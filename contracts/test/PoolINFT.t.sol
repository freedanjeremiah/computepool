// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PoolINFT} from "../src/PoolINFT.sol";

contract PoolINFTTest is Test {
    PoolINFT inft;
    address admin = address(0xA11CE);
    address oracle;
    uint256 oraclePk = 0xB0B;
    address alice = address(0xA1);
    address bob   = address(0xB2);

    function setUp() public {
        oracle = vm.addr(oraclePk);
        vm.prank(admin);
        inft = new PoolINFT(oracle);
    }

    function test_Mint_StoresAndEmits() public {
        bytes32 hash = keccak256("plaintext");
        vm.prank(admin);
        uint256 id = inft.mint(alice, hash, "0g://abcd", hex"deadbeef");
        assertEq(id, 1);
        assertEq(inft.ownerOf(id), alice);
        (bytes32 h, string memory uri, bytes memory sk) = inft.pools(id);
        assertEq(h, hash);
        assertEq(uri, "0g://abcd");
        assertEq(sk, hex"deadbeef");
    }

    function test_OnlyOwnerCanMint() public {
        vm.prank(alice);
        vm.expectRevert();
        inft.mint(alice, bytes32(0), "x", hex"00");
    }

    function test_AuthorizeUsage_OwnerThenUserUntilExpiry() public {
        vm.prank(admin);
        uint256 id = inft.mint(alice, bytes32(0), "x", hex"00");
        assertTrue(inft.isAuthorized(id, alice));
        assertFalse(inft.isAuthorized(id, bob));

        vm.prank(alice);
        inft.authorizeUsage(id, bob, block.timestamp + 1 hours);
        assertTrue(inft.isAuthorized(id, bob));

        vm.warp(block.timestamp + 2 hours);
        assertFalse(inft.isAuthorized(id, bob));
    }

    function _signTransfer(
        uint256 tokenId,
        address to,
        string memory uri,
        bytes memory sealedKey
    ) internal view returns (bytes memory) {
        bytes32 digest = keccak256(abi.encode(
            keccak256("CPPOOL_TRANSFER"), tokenId, to, uri, sealedKey
        ));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePk, ethHash);
        return abi.encodePacked(r, s, v);
    }

    function test_TransferWithProof_RotatesURIAndKey() public {
        vm.prank(admin);
        uint256 id = inft.mint(alice, keccak256("p"), "0g://old", hex"01");

        bytes memory sig = _signTransfer(id, bob, "0g://new", hex"02");

        vm.prank(alice);
        inft.transferWithProof(id, bob, "0g://new", hex"02", sig);

        assertEq(inft.ownerOf(id), bob);
        (, string memory uri, bytes memory sk) = inft.pools(id);
        assertEq(uri, "0g://new");
        assertEq(sk, hex"02");
    }

    function test_TransferWithProof_RejectsBadOracleSig() public {
        vm.prank(admin);
        uint256 id = inft.mint(alice, bytes32(0), "x", hex"00");

        // Sign with the wrong key
        uint256 wrongPk = 0xDEAD;
        bytes32 digest = keccak256(abi.encode(
            keccak256("CPPOOL_TRANSFER"), id, bob, "x2", hex"01"
        ));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPk, ethHash);
        bytes memory badSig = abi.encodePacked(r, s, v);

        vm.prank(alice);
        vm.expectRevert(PoolINFT.NotOracleSig.selector);
        inft.transferWithProof(id, bob, "x2", hex"01", badSig);
    }
}
