export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="h-screen flex flex-col">
      {children}
    </div>
  );
}
