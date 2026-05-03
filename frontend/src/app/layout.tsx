import type { Metadata } from "next";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IdeaMinter",
  description: "Map your indie startup ideas to historical clones and real-time active projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <header className="header">
            <div style={{ marginRight: 'auto' }}>
              <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', border: 'none', padding: 0 }}>IdeaMinter</h2>
              </a>
            </div>
            <Show when="signed-out">
              <SignInButton mode="modal">
                 <button className="auth-btn-secondary">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="auth-btn-primary">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <a href="/dashboard" style={{ fontWeight: 'bold', textDecoration: 'none', color: 'var(--text-color)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Bank</a>
                <div className="user-nav">
                  <UserButton />
                </div>
              </div>
            </Show>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
