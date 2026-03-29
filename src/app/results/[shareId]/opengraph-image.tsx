import { ImageResponse } from "next/og";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/seo/config";

export const runtime = "edge";
export const alt = "SupaScanner Security Grade";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GRADE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: "#d1fae5", text: "#047857", ring: "#6ee7b7" },
  B: { bg: "#ecfccb", text: "#4d7c0f", ring: "#bef264" },
  C: { bg: "#fef3c7", text: "#b45309", ring: "#fcd34d" },
  D: { bg: "#ffedd5", text: "#c2410c", ring: "#fdba74" },
  F: { bg: "#fee2e2", text: "#b91c1c", ring: "#fca5a5" },
};

const GRADE_LABELS: Record<string, string> = {
  A: "Excellent",
  B: "Good",
  C: "Needs Improvement",
  D: "Poor",
  F: "Critical",
};

export default async function Image({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  const supabase = createSupabaseAdmin();
  const { data: result } = await supabase
    .from("shared_results")
    .select("grade, total_findings, critical_count, high_count, medium_count, low_count")
    .eq("share_id", shareId)
    .single();

  const grade = result?.grade ?? "?";
  const colors = GRADE_COLORS[grade] ?? GRADE_COLORS.F;
  const label = GRADE_LABELS[grade] ?? "Unknown";
  const total = result?.total_findings ?? 0;

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
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "#1c1917",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            SS
          </div>
          <div style={{ fontSize: "20px", color: "#57534e", fontWeight: 600 }}>
            SupaScanner
          </div>
        </div>

        <div
          style={{
            width: "160px",
            height: "160px",
            borderRadius: "80px",
            backgroundColor: colors.bg,
            border: `6px solid ${colors.ring}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "80px",
              fontWeight: 700,
              color: colors.text,
            }}
          >
            {grade}
          </div>
        </div>

        <div
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: "#1c1917",
            marginBottom: "8px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "18px",
            color: "#a8a29e",
            marginBottom: "40px",
          }}
        >
          {total} finding{total !== 1 ? "s" : ""} detected
        </div>

        <div
          style={{
            display: "flex",
            gap: "32px",
          }}
        >
          <StatPill
            label="Critical"
            count={result?.critical_count ?? 0}
            color="#dc2626"
          />
          <StatPill
            label="High"
            count={result?.high_count ?? 0}
            color="#ea580c"
          />
          <StatPill
            label="Medium"
            count={result?.medium_count ?? 0}
            color="#d97706"
          />
          <StatPill
            label="Low"
            count={result?.low_count ?? 0}
            color="#2563eb"
          />
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "16px",
            color: "#a8a29e",
          }}
        >
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...size },
  );
}

function StatPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <div style={{ fontSize: "32px", fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: "14px", color: "#a8a29e" }}>{label}</div>
    </div>
  );
}
