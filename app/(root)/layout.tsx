export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <main>
    <h1 className="text-xl font-extrabold text-red-900">Sidebar</h1>
    {children}
   </main>
  );
}
