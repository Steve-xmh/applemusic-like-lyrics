import { compileMDX } from "next-mdx-remote/rsc";
import fs from "fs/promises";
import path from "path/posix";
import Link from "next/link";
import { Metadata } from "next";

export interface DocumationPageParam {
	lang: string;
}

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

export async function generateStaticParams({ params }: { params: DocumationPageParam }) {
	return [params];
}

export async function generateMetadata({
	params,
}: { params: DocumationPageParam }) {
	return {
		title: "所有模块文档 - AMLL",
	} as Metadata;
}

export default async function DocumationPage({
	params,
}: { params: DocumationPageParam }) {
	const pages = [];
	const modules = await fs.readdir(path.resolve(docsPath));
	modules.sort();
	for (const module of modules) {
		const posts = await fs.readdir(path.resolve(docsPath, module));
		posts.sort();
		// File name format: slug.lang.mdx
		const splitedPosts = posts.map((v) => v.split("."));
		const moduleList = {
			modulePackage: module,
			pages: [] as {
				slug: string;
				lang: string;
			}[],
		};
		for (const post of splitedPosts) {
			moduleList.pages.push({
				slug: post[0],
				lang: post[1],
			});
		}
		pages.push(moduleList);
	}

	// const { content, frontmatter } = await compileDoc(params);
	return (
		<main>
			<h1>所有模块文档</h1>
			<ul>
				{pages.map((module) => (
					<li key={`module-${module.modulePackage}`}>
						<h2>{module.modulePackage}</h2>
						<ul>
							{module.pages.map((page) => (
								<li key={`module-${module.modulePackage}-${page.slug}`}>
									<Link href={`/${page.lang}/docs/${module.modulePackage}/${page.slug}`}>
										{page.slug} ({page.lang})
									</Link>
								</li>
							))}
						</ul>
					</li>
				))}
			</ul>
		</main>
	);
}
