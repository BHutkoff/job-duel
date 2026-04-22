import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* NAVBAR */}
        <nav
          style={{
            display: "flex",
            gap: 10,
            padding: 10,
            borderBottom: "1px solid gray",
          }}
        >
          <Link href="/">🏠 Dashboard</Link>
          <Link href="/challenges">⚔️ Challenges</Link>
          <Link href="/add">➕ Add Application</Link>
          <Link href="/applications">📄 Applications</Link>
        </nav>

        {/* PAGE CONTENT */}
        <main style={{ padding: 20 }}>{children}</main>
      </body>
    </html>
  );
}
