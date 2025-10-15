import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

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

  // No need to fetch a list of files, just show download buttons that always hit the API endpoints
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Visit Details</h2>
          <Button
            onClick={async () => {
              try {
                setLoading(true);
                const response = await axios.get(
                  "http://localhost:5050/api/reports/daily_visits_xlsx",
                  { responseType: "blob" }
                );
                const blob = new Blob([response.data], {
                  type:
                    response.headers["content-type"] ||
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.download = "daily_visits.xlsx";
                document.body.appendChild(link);
                link.click();
                link.remove();
                setLoading(false);
              } catch (err) {
                setLoading(false);
                alert("Failed to download report");
              }
            }}
          >
            Download Visit Details (XLSX)
          </Button>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Team Lead Visit Report</h2>
          <Button
            onClick={async () => {
              try {
                setLoading(true);
                const response = await axios.get(
                  "http://localhost:5050/api/reports/team_lead_visits_xlsx",
                  { responseType: "blob" }
                );
                const blob = new Blob([response.data], {
                  type:
                    response.headers["content-type"] ||
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.download = "team_lead_visits.xlsx";
                document.body.appendChild(link);
                link.click();
                link.remove();
                setLoading(false);
              } catch (err) {
                setLoading(false);
                alert("Failed to download report");
              }
            }}
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
              const url = `http://localhost:5050/api/reports/team_lead_visit_details_xlsx/${slug}`;
              return (
                <li
                  key={slug}
                  className="flex items-center justify-between border p-2 rounded"
                >
                  <span>{filename}</span>
                  <Button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const response = await axios.get(url, {
                          responseType: "blob",
                        });
                        const blob = new Blob([response.data], {
                          type:
                            response.headers["content-type"] ||
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        });
                        const link = document.createElement("a");
                        link.href = window.URL.createObjectURL(blob);
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        setLoading(false);
                      } catch (err) {
                        setLoading(false);
                        alert("Failed to download report");
                      }
                    }}
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
