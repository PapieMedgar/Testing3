import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { reportsAPI } from "@/lib/api";

const TEAM_LEADS = [
  "Moses Thulare Moshwane",
  "Nkosingiphile Ntombikayise Ntombi Khumalo",
  "Ntombizodwa Zodwa Dubazana",
  "Gilda Katarina Mashele",
];
function leadSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (
    downloadFn: () => Promise<Response>,
    filename: string
  ) => {
    try {
      setLoading(true);
      const response = await downloadFn();
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError("Failed to download report");
    }
  };

  // New: download all reports sequentially (2 global + per-lead files)
  const handleDownloadAll = async () => {
    setError(null);
    setLoading(true);
    const downloads: Array<{
      fn: () => Promise<Response>;
      filename: string;
    }> = [];

    // global reports
    downloads.push({
      fn: reportsAPI.downloadDailyVisitsXLSX,
      filename: "daily_visits.xlsx",
    });
    downloads.push({
      fn: reportsAPI.downloadTeamLeadVisitsXLSX,
      filename: "team_lead_visits.xlsx",
    });

    // per-lead reports
    TEAM_LEADS.forEach((lead) => {
      const slug = leadSlug(lead);
      downloads.push({
        fn: () => reportsAPI.downloadTeamLeadVisitDetailsXLSX(slug),
        filename: `visit_details_${slug}.xlsx`,
      });
    });

    for (const item of downloads) {
      try {
        const response = await item.fn();
        if (!response || !response.ok) {
          throw new Error("Failed to download");
        }
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = item.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        // small delay to ensure downloads start cleanly
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.error("Download-all error:", e);
        setError("Failed to download all reports");
        break;
      }
    }

    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      {/* Download All button */}
      <div className="mb-4">
        <Button onClick={handleDownloadAll} disabled={loading}>
          Download All Reports (XLSX)
        </Button>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Visit Details</h2>
          <Button
            onClick={() =>
              handleDownload(
                reportsAPI.downloadDailyVisitsXLSX,
                "daily_visits.xlsx"
              )
            }
          >
            Download Visit Details (XLSX)
          </Button>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Team Lead Visit Report</h2>
          <Button
            onClick={() =>
              handleDownload(
                reportsAPI.downloadTeamLeadVisitsXLSX,
                "team_lead_visits.xlsx"
              )
            }
          >
            Download Team Lead Visit Report (XLSX)
          </Button>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Team Lead Visits Details Export
          </h2>
          <ul className="space-y-2">
            {TEAM_LEADS.map((lead) => {
              const slug = leadSlug(lead);
              const filename = `visit_details_${slug}.xlsx`;
              return (
                <li
                  key={slug}
                  className="flex items-center justify-between border p-2 rounded"
                >
                  <span>{filename}</span>
                  <Button
                    onClick={() =>
                      handleDownload(
                        () => reportsAPI.downloadTeamLeadVisitDetailsXLSX(slug),
                        filename
                      )
                    }
                  >
                    Download
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
        {loading && <div className="text-blue-500">Downloading...</div>}
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  );
};

export default Reports;
