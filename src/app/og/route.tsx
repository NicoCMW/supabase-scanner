import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo/config";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf9f7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            backgroundColor: "#1c1917",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "28px",
            fontWeight: 700,
            marginBottom: "32px",
          }}
        >
          SS
        </div>
        <div
          style={{
            fontSize: "56px",
            fontWeight: 700,
            color: "#1c1917",
            marginBottom: "16px",
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#57534e",
            maxWidth: "800px",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {siteConfig.description}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "16px",
            color: "#a8a29e",
          }}
        >
          supabase-scanner.vercel.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
