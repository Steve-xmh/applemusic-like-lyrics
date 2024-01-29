import Link from "next/link";
import styles from "./index.module.css";
import { LANGUAGES } from "@/lib/lang";

export const TopBar = ({ lang }: { lang: string }) => {	
	return (
		<header className={styles.header}>
			<Link href={`/${lang}`}>
				Apple Music-like Lyrics
			</Link>
			<div className={styles.divider} />
			<Link href={`${lang}/docs/core/introduction`}>
				文档
				<div className={styles.menu}>
				<Link href={`${lang}/docs/core/introduction`}>Core 模块</Link>
				</div>
			</Link>
			<Link href={`${lang}/docs/core/introduction`}>
				语言<div className={styles.menu}>
					{LANGUAGES.map(lang => (<Link href={`/${lang.lang}`}>{lang.display}</Link>))}
				</div>
			</Link>
	
			<Link href="https://github.com/Steve-xmh/applemusic-like-lyrics">
				Github
			</Link>
		</header>
	);
};
