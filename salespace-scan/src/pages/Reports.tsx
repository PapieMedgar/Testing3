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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
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
