import Image from "next/image";
import styles from "./page.module.css";

interface LangParam {
	lang: string;
}

export default function MainPage({ params }: { params: LangParam }) {
	return (
		<main className={styles.main}>
			<Image
				className={styles.logo}
				src="/applemusic-like-lyrics/amll-icon.svg"
				alt=""
				priority
				width={80}
				height={80}
			/>
			<h1>Apple Music-like Lyrics</h1>
			<div>一个不仅像，还有自己风格的开源歌词显示组件框架。</div>
            <div className={styles.warn}>
                本文档页面还在建设中，内容会随时变化或有不稳定的地方，敬请留意。
            </div>
		</main>
	);
}
