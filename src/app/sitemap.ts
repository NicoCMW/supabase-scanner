import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/config";
import { getAllPosts } from "@/lib/seo/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${siteConfig.url}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/security-checklist`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/docs/cli`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/docs/api`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.url}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.url}/acceptable-use`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}
