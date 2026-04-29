export function AppPage({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={`px-8 py-8${narrow ? " max-w-xl" : ""}`}>
      {children}
    </div>
  );
}
