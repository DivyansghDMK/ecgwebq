import SearchBar from "../common/SearchBar";
import SummaryCard from "../common/SummaryCard";
import { useState } from "react";

type Report = {
  name: string;
  type: string;
  date: string;
  size: string;
  key: string;
};

const REPORTS: Report[] = []; // empty initially

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="grid grid-cols-12 gap-6">

      {/*Search bar + Actions */}
      <div className="col-span-12 flex gap-4 items-center">
        <div className="flex-1">
          <SearchBar placeholder="Search filename..." value={searchTerm} onChange={setSearchTerm} />
        </div>

        <button className="bg-orange-500 text-white px-4 py-2 rounded">
          Refresh
        </button>

        <button className="bg-gray-200 px-4 py-2 rounded">
          Copy Link
        </button>
      </div>

      {/*Summary cards */}
      <div className="col-span-6">
        <SummaryCard
          title="Total Files"
          value={REPORTS.length}
          color="green"
        />
      </div>

      <div className="col-span-6">
        <SummaryCard
          title="Total Size"
          value="0 KB"
          color="red"
        />
      </div>

      {/*Reports table */}
      <div className="col-span-12 bg-white rounded-xl border overflow-hidden">
        {REPORTS.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No reports uploaded yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-orange-500 text-white">
              <tr>
                <th className="p-2 text-left">File</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Size</th>
                <th className="p-2 text-left">S3 Key</th>
              </tr>
            </thead>

            <tbody>
              {REPORTS.map((file, idx) => (
                <tr key={idx} className="hover:bg-gray-100">
                  <td className="p-2">{file.name}</td>
                  <td className="p-2">{file.type}</td>
                  <td className="p-2">{file.date}</td>
                  <td className="p-2">{file.size}</td>
                  <td className="p-2 text-xs">{file.key}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
