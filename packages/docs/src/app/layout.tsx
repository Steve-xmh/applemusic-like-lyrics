import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Apple Music-like Lyrics",
	description:
		"A lyric player component library aims to look similar to iPad version of Apple Music. Also with DOM, React and Vue bindings.",
	icons: "/applemusic-like-lyrics/favicon.ico",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>{children}</>
	);
}
