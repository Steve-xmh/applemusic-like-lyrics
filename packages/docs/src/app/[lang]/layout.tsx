import { LANGUAGES } from "@/lib/lang";
import styles from "./layout.module.css";
import { TopBar } from "@/components/TopBar";

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
		<html lang={params.lang}>
			<body>
				<TopBar lang={params.lang} />
				{children}
			</body>
		</html>
	);
}
