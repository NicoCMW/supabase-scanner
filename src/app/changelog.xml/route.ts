import { siteConfig } from "@/lib/seo/config";
import { getAllChangelogEntries } from "@/lib/changelog";

export function GET() {
  const entries = getAllChangelogEntries();

  const items = entries
    .map(
      (entry) => `    <item>
      <title>${escapeXml(entry.title)}</title>
      <description>${escapeXml(entry.description)}</description>
      <link>${siteConfig.url}/changelog#${entry.id}</link>
      <guid isPermaLink="false">${entry.id}</guid>
      <pubDate>${new Date(entry.date).toUTCString()}</pubDate>
      <category>${entry.category}</category>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} Changelog</title>
    <link>${siteConfig.url}/changelog</link>
    <description>Product updates, new features, and improvements from ${escapeXml(siteConfig.name)}.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(entries[0].date).toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/changelog.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
