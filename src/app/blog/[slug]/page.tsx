import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug } from "@/lib/seo/blog";
import { siteConfig } from "@/lib/seo/config";
import { techArticleJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface BlogPostPageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords as unknown as string[],
    alternates: {
      canonical: `${siteConfig.url}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `${siteConfig.url}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      ...(post.updatedAt ? { modifiedTime: post.updatedAt } : {}),
      section: "Security",
      images: [
        {
          url: `/og/blog/${post.slug}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [`/og/blog/${post.slug}`],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

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
              href="/blog"
              className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
            >
              Blog
            </a>
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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: techArticleJsonLd(post) }}
        />

        {post.faqs && post.faqs.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: faqJsonLd(post.faqs) }}
          />
        )}

        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.category, href: `/blog?category=${encodeURIComponent(post.category)}` },
            { label: post.title, href: `/blog/${post.slug}` },
          ]}
        />

        <article>
          <header className="mb-10">
            <p className="text-xs text-sand-400 mb-3 uppercase tracking-wide">
              {post.category} &middot;{" "}
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-sand-900">
              {post.title}
            </h1>
            <p className="text-sand-500 mt-4 text-lg leading-relaxed">
              {post.description}
            </p>
          </header>

          <div className="prose prose-sand max-w-none">
            {post.body ? (
              <div dangerouslySetInnerHTML={{ __html: post.body }} />
            ) : (
              <p className="text-sand-400 italic">
                This article is coming soon.
              </p>
            )}
          </div>
        </article>

        <aside className="mt-16 pt-8 border-t border-sand-200">
          <h2 className="text-lg font-semibold mb-2 text-sand-900">
            Scan your Supabase project
          </h2>
          <p className="text-sand-500 text-sm mb-4">
            Get an A-F security grade with copy-paste SQL fixes in under 40
            seconds.
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-2.5 bg-sand-900 hover:bg-sand-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Start free scan
          </a>
        </aside>
      </div>
    </main>
  );
}
