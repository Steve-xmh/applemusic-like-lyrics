import Link from "next/link";
import styles from "./index.module.css";
import { LANGUAGES } from "@/lib/lang";

export const TopBar = ({ lang }: { lang: string }) => {
	return (
		<header className={styles.header}>
			<Link href={`/${lang}`}>Apple Music-like Lyrics</Link>
			<div className={styles.divider} />
			<div className={styles.topbarItem}>
				文档
				<div className={styles.menu}>
					<Link href={`/${lang}/docs/core/introduction`}>Core 模块</Link>
				</div>
			</div>
			<div className={styles.topbarItem}>
				语言
				<div className={styles.menu}>
					{LANGUAGES.map((lang, i) => (
						<Link key={`lang-link-${i}`} href={`/${lang.lang}`}>
							{lang.display}
						</Link>
					))}
				</div>
			</div>

			<Link href="https://github.com/Steve-xmh/applemusic-like-lyrics">
				Github
			</Link>
		</header>
	);
};
