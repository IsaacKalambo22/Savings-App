import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NestKeep — Organize every savings account in one place",
  description:
    "NestKeep is an offline-first household savings tracker. Manage every account, transaction, and goal for your whole household — in one secure place.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A63E0",
};

// Runs before first paint: applies a previously saved theme choice so there's
// no flash. If nothing is saved, the CSS prefers-color-scheme fallback handles it.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
