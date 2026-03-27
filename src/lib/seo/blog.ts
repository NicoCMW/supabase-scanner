import type { BlogPost } from "./types";

const posts: readonly BlogPost[] = [
  {
    slug: "state-of-supabase-security-2026",
    title: "The State of Supabase Security in 2026",
    description:
      "How secure are Supabase applications in 2026? We analyzed common vulnerability patterns across Supabase projects and found that most apps share the same critical misconfigurations.",
    category: "Security Basics",
    publishedAt: "2026-03-15",
    keywords: [
      "supabase security",
      "supabase security audit",
      "is supabase secure",
      "supabase RLS",
    ],
    body: "",
  },
  {
    slug: "5-rls-mistakes-every-vibe-coder-makes",
    title: "5 RLS Mistakes Every Vibe Coder Makes",
    description:
      "Row Level Security is your last line of defense in Supabase. These are the five most common RLS mistakes we see in AI-generated code and how to fix each one.",
    category: "RLS",
    publishedAt: "2026-03-18",
    keywords: [
      "supabase RLS",
      "supabase RLS mistakes",
      "row level security",
      "vibe coding security",
    ],
    body: "",
  },
  {
    slug: "supabase-storage-buckets-probably-public",
    title: "Why Your Supabase Storage Buckets Are Probably Public",
    description:
      "Most Supabase storage buckets are accidentally public. Learn how to audit your bucket permissions, fix common misconfigurations, and lock down file access.",
    category: "Storage",
    publishedAt: "2026-03-20",
    keywords: [
      "supabase storage security",
      "supabase public bucket",
      "supabase storage policies",
    ],
    body: "",
  },
];

export function getAllPosts(): readonly BlogPost[] {
  return posts.toSorted(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostsByCategory(
  category: string,
): readonly BlogPost[] {
  return posts
    .filter((p) => p.category === category)
    .toSorted(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function getAllSlugs(): readonly string[] {
  return posts.map((p) => p.slug);
}
