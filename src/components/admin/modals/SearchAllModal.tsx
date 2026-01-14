import { useState } from "react";
import Modal from "../common/Modal";
import { Search, User, UserCheck, FileText } from "lucide-react";

interface SearchAllModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchAllModal({ isOpen, onClose }: SearchAllModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock search results
    const mockResults = [
      { type: "user", name: "John Doe", id: "USR-001", icon: User },
      { type: "doctor", name: "Dr. Sarah Smith", id: "DOC-001", icon: UserCheck },
      { type: "report", name: "ECG Report #1234", id: "RPT-001", icon: FileText },
    ].filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setResults(mockResults);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search All">
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, doctors, reports..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="mt-3 w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Search
        </button>
      </form>

      {results.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((result, index) => {
            const Icon = result.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
              >
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Icon className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{result.name}</p>
                  <p className="text-sm text-gray-500">{result.id}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : searchQuery && (
        <div className="text-center py-8 text-gray-500">
          No results found for "{searchQuery}"
        </div>
      )}
    </Modal>
  );
}


