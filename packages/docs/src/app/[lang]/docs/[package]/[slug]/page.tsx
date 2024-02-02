import { MDXRemote, compileMDX } from "next-mdx-remote/rsc";
import fs from "fs/promises";
import path from "path/posix";
import { Metadata } from "next";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "geist/font/mono";
import "highlight.js/styles/github-dark.css";
import "./globals.css";

export interface DocumationPageParam {
	lang: string;
	package: string;
	slug: string;
	availableLang: string[];
}

const docsPath = "src/docs";

export async function generateStaticParams(): Promise<DocumationPageParam[]> {
	const pageParams: DocumationPageParam[] = [];

	const modules = await fs.readdir(path.resolve(docsPath));

	for (const module of modules) {
		if (await fs.stat(path.resolve(docsPath, module)).then((v) => !v.isDirectory())) {
			continue;
		}
		const posts = await fs.readdir(path.resolve(docsPath, module));
		// File name format: slug.lang.mdx
		const distinctedPosts = [...new Set(posts.map((v) => v.split(".")[0]))];
		const langs = [...new Set(posts.map((v) => v.split(".")[1]))];
		for (const post of distinctedPosts) {
			langs.forEach((lang) => {
				pageParams.push({
					lang,
					package: module,
					slug: post,
					availableLang: langs,
				});
			});
		}
	}

	return pageParams;
}

async function compileDoc(params: DocumationPageParam) {
	const rawContent = await fs.readFile(
		path.resolve(docsPath, params.package, `${params.slug}.${params.lang}.mdx`),
		{
			encoding: "utf8",
		},
	);
	return await compileMDX<{ title: string }>({
		source: rawContent,
		options: {
			parseFrontmatter: true,
			mdxOptions: {
				rehypePlugins: [rehypeHighlight as any],
			},
		},
	});
}

export async function generateMetadata({
	params,
}: { params: DocumationPageParam }) {
	const { frontmatter } = await compileDoc(params);
	const packageName =
		params.package.charAt(0).toUpperCase() + params.package.slice(1);
	return {
		title: `${frontmatter.title ?? "无标题"} - ${packageName} 模块 - AMLL`,
	} as Metadata;
}

export default async function DocumationPage({
	params,
}: { params: DocumationPageParam }) {
	const rawContent = await fs.readFile(
		path.resolve(docsPath, params.package, `${params.slug}.${params.lang}.mdx`),
		{
			encoding: "utf8",
		},
	);
	return (
		<main>
			<MDXRemote
				source={rawContent}
				options={{
					parseFrontmatter: true,
					mdxOptions: {
						rehypePlugins: [rehypeHighlight as any],
						remarkPlugins: [remarkGfm],
						format: "mdx",
					},
				}}
			/>
		</main>
	);
}
