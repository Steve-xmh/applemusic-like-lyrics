import styles from "./layout.module.css";
import fs from "fs/promises";
import path from "path/posix";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";

const docsPath = "src/docs";

async function compileDoc(modulePackage: string, slug: string, lang: string) {
	const rawContent = await fs.readFile(
		path.resolve(docsPath, modulePackage, `${slug}.${lang}.mdx`),
		{
			encoding: "utf8",
		},
	);
	return await compileMDX<{ title: string }>({
		source: rawContent,
		options: { parseFrontmatter: true },
	});
}

async function loadAllPages() {
	const pages = [];
	const modules = await fs.readdir(path.resolve(docsPath));
	modules.sort();
	for (const module of modules) {
		if (await fs.stat(path.resolve(docsPath, module)).then((v) => !v.isDirectory())) {
			continue;
		}
		const posts = (await fs.readdir(path.resolve(docsPath, module))).filter(v => v.endsWith(".mdx"));
		posts.sort();
		// File name format: slug.lang.mdx
		const splitedPosts = posts.map((v) => v.split("."));
		const moduleList = {
			modulePackage: module,
			pages: [] as {
				slug: string;
				lang: string;
				title?: string;
			}[],
		};
		for (const post of splitedPosts) {
			const { frontmatter } = await compileDoc(module, post[0], post[1]);
			moduleList.pages.push({
				slug: post[0],
				lang: post[1],
				title: frontmatter.title,
			});
		}
		pages.push(moduleList);
	}
	return pages;
}

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: { lang: string };
}>) {
	const pages = await loadAllPages();
	return (
		<div className={styles.docsLayout}>
			<div className={styles.docsSidebar}>
				<ul>
					{pages.map((module) => (
						<li key={`module-${module.modulePackage}`}>
							<h2>{module.modulePackage}</h2>
							<ul>
								{module.pages.map((page) => (
									<li key={`module-${module.modulePackage}-${page.slug}`}>
										<Link
											href={`/${page.lang}/docs/${module.modulePackage}/${page.slug}`}
										>
											{page.title ?? "无标题"} ({page.slug}) ({page.lang})
										</Link>
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			</div>
            <div className={styles.dragHandler} />
			<main>{children}</main>
		</div>
	);
}
