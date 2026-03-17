export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="h-screen flex flex-col">
      {children}
    </div>
  );
}
