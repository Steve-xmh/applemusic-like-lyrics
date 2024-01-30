import { LANGUAGES } from "@/lib/lang";

export async function generateStaticParams() {
	return LANGUAGES;
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
        <>{children}</>
	);
}
