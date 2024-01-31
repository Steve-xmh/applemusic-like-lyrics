import { LANGUAGES } from "@/lib/lang";
import styles from "./layout.module.css";
import { TopBar } from "@/components/TopBar";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import classnames from "classnames";

export async function generateStaticParams() {
	return LANGUAGES;
}

export default function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: { lang: string };
}>) {
	return (
		<html
			lang={params.lang}
			className={`${GeistSans.variable} ${GeistMono.variable}`}
		>
			<body>
				<TopBar lang={params.lang} />
				{children}
			</body>
		</html>
	);
}
