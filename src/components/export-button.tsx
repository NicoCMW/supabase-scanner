"use client";

import { useState } from "react";

export function ExportButton() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/dashboard/export");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ??
        "scan-history.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="px-3 py-1.5 text-sm text-sand-600 border border-sand-200 rounded-lg hover:border-sand-300 hover:text-sand-900 transition-colors disabled:opacity-50"
    >
      {exporting ? "Exporting..." : "Export CSV"}
    </button>
  );
}
