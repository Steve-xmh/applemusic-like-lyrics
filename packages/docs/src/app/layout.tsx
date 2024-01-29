import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Apple Music-like Lyrics",
	description:
		"A lyric player component library aims to look similar to iPad version of Apple Music. Also with DOM, React and Vue bindings.",
	icons: "/favicon.ico",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="zh-CN">
			<body className={inter.className}>
				<TopBar lang="zh-CN" />
				{children}
			</body>
		</html>
	);
}
