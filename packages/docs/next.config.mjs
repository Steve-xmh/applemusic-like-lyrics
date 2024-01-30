import mdx from "@next/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeHighlight from "rehype-highlight";

const withMDX = mdx({
	options: {
		remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
		rehypePlugins: [rehypeHighlight]
	},
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'export',
	reactStrictMode: true,
	basePath: "/applemusic-like-lyrics",
	pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
};

const finalConfig = withMDX(nextConfig);

export default finalConfig;
