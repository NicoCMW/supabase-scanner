import type { Metadata } from "next";
import { getAllPosts } from "@/lib/seo/blog";
import { siteConfig } from "@/lib/seo/config";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Supabase security guides, RLS best practices, and vibe coding security tips from the SupaScanner team.",
  alternates: {
    canonical: `${siteConfig.url}/blog`,
  },
  openGraph: {
    title: `Blog | ${siteConfig.name}`,
    description:
      "Supabase security guides, RLS best practices, and vibe coding security tips.",
    url: `${siteConfig.url}/blog`,
    type: "website",
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-12 flex items-center justify-between">
          <a
            href="/"
            className="text-base font-semibold tracking-tight text-sand-900"
          >
            SupaScanner
          </a>
          <div className="flex items-center gap-6">
            <a
              href="/pricing"
              className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
            >
              Pricing
            </a>
            <a
              href="/login"
              className="text-sm px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white font-medium rounded-lg transition-colors"
            >
              Sign in
            </a>
          </div>
        </nav>

        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
          ]}
        />

        <h1 className="text-3xl font-semibold mb-2 text-sand-900">Blog</h1>
        <p className="text-sand-500 text-sm mb-12">
          Supabase security guides and best practices.
        </p>

        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="border-b border-sand-200 pb-8">
              <p className="text-xs text-sand-400 mb-2 uppercase tracking-wide">
                {post.category} &middot;{" "}
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </p>
              <h2 className="text-xl font-semibold mb-2 text-sand-900">
                <a
                  href={`/blog/${post.slug}`}
                  className="hover:text-sand-600 transition-colors"
                >
                  {post.title}
                </a>
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed">
                {post.description}
              </p>
              <a
                href={`/blog/${post.slug}`}
                className="inline-block mt-3 text-sm font-medium text-sand-900 hover:text-sand-600 transition-colors"
              >
                Read more
              </a>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
