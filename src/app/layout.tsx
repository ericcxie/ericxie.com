import CommandPalette from "@/components/CommandPalette/CommandPalette";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import { getAllPosts } from "@/lib/blogs";
import { getAllProjects } from "@/lib/projects";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import local from "next/font/local";
import "./globals.css";

const akkurat = local({
  src: [
    { path: "../../public/fonts/AkkuratPro.ttf", weight: "400" },
    { path: "../../public/fonts/AkkuratPro-Bold.otf", weight: "700" },
  ],
  variable: "--font-akkurat",
});

export const metadata: Metadata = {
  title: "Eric Xie",
  description: "Engineering student at the University of Waterloo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posts = getAllPosts();
  const projects = getAllProjects();
  return (
    // next-themes sets the theme class on <html> before React hydrates
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${akkurat.className} flex min-h-screen flex-col bg-background-light dark:bg-background-dark`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Header />
          <CommandPalette posts={posts} projects={projects} />
          <div className="md:pb-30 mx-auto w-full max-w-[700px] flex-grow px-6 pb-20 pt-8 md:px-6 md:pt-20">
            {children}
          </div>
          <Footer />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
