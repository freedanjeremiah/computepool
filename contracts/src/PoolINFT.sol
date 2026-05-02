// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title PoolINFT — ERC-7857-style intelligent NFT for ComputePool inference pools.
/// @notice Encrypted metadata lives off-chain (0G Storage); only the AES key sealed to
///         the owner's secp256k1 pubkey + a plaintext content hash live on-chain.
///         Re-sealing on transfer/clone is attested by the TEE `oracle`.
contract PoolINFT is ERC721, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct Pool {
        bytes32 metadataHash;     // sha256 of canonical-JSON plaintext
        string  metadataURI;      // e.g. "0g://<data_root_hex>"
        bytes   sealedKey;        // ECIES(recipientPubkey, AES-GCM-key)
    }

    address public oracle;
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => uint256)) public authorizations;
    uint256 private _nextId;

    event PoolMinted(uint256 indexed tokenId, address indexed owner, bytes32 metadataHash, string metadataURI);
    event PoolTransferred(uint256 indexed tokenId, address indexed from, address indexed to, string newMetadataURI);
    event PoolCloned(uint256 indexed sourceId, uint256 indexed newId, address indexed to);
    event UsageAuthorized(uint256 indexed tokenId, address indexed user, uint256 expiresAt);
    event OracleChanged(address indexed previous, address indexed current);

    error NotOracleSig();
    error NotOwnerOrApproved();

    constructor(address _oracle) ERC721("ComputePool Pool INFT", "CPPOOL") Ownable(msg.sender) {
        oracle = _oracle;
        emit OracleChanged(address(0), _oracle);
    }

    function setOracle(address _o) external onlyOwner {
        emit OracleChanged(oracle, _o);
        oracle = _o;
    }

    function mint(
        address to,
        bytes32 metadataHash,
        string calldata metadataURI,
        bytes calldata sealedKey
    ) external onlyOwner returns (uint256 id) {
        id = ++_nextId;
        _safeMint(to, id);
        pools[id] = Pool({metadataHash: metadataHash, metadataURI: metadataURI, sealedKey: sealedKey});
        emit PoolMinted(id, to, metadataHash, metadataURI);
    }

    function transferWithProof(
        uint256 tokenId,
        address to,
        string calldata newMetadataURI,
        bytes calldata newSealedKey,
        bytes calldata oracleSig
    ) external {
        address from = ownerOf(tokenId);
        if (msg.sender != from && !isApprovedForAll(from, msg.sender) && getApproved(tokenId) != msg.sender) {
            revert NotOwnerOrApproved();
        }
        bytes32 digest = keccak256(abi.encode(
            keccak256("CPPOOL_TRANSFER"), tokenId, to, newMetadataURI, newSealedKey
        ));
        if (digest.toEthSignedMessageHash().recover(oracleSig) != oracle) revert NotOracleSig();

        Pool storage p = pools[tokenId];
        p.metadataURI = newMetadataURI;
        p.sealedKey = newSealedKey;

        _transfer(from, to, tokenId);
        emit PoolTransferred(tokenId, from, to, newMetadataURI);
    }

    function cloneWithProof(
        uint256 sourceId,
        address to,
        string calldata newMetadataURI,
        bytes calldata newSealedKey,
        bytes calldata oracleSig
    ) external returns (uint256 newId) {
        if (msg.sender != ownerOf(sourceId)) revert NotOwnerOrApproved();
        bytes32 digest = keccak256(abi.encode(
            keccak256("CPPOOL_CLONE"), sourceId, to, newMetadataURI, newSealedKey
        ));
        if (digest.toEthSignedMessageHash().recover(oracleSig) != oracle) revert NotOracleSig();

        newId = ++_nextId;
        _safeMint(to, newId);
        pools[newId] = Pool({
            metadataHash: pools[sourceId].metadataHash,
            metadataURI: newMetadataURI,
            sealedKey: newSealedKey
        });
        emit PoolCloned(sourceId, newId, to);
    }

    function authorizeUsage(uint256 tokenId, address user, uint256 expiresAt) external {
        if (msg.sender != ownerOf(tokenId)) revert NotOwnerOrApproved();
        authorizations[tokenId][user] = expiresAt;
        emit UsageAuthorized(tokenId, user, expiresAt);
    }

    function isAuthorized(uint256 tokenId, address user) external view returns (bool) {
        return user == ownerOf(tokenId) || authorizations[tokenId][user] > block.timestamp;
    }
}
