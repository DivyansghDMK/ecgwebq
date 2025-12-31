import { Outlet, useNavigate, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="admin-root min-h-screen bg-white text-gray-900 p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          CardioX Admin Dashboard
        </h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              localStorage.removeItem("admin_logged_in");
              localStorage.removeItem("role");
              localStorage.removeItem("token");
              navigate("/artists/login");
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => navigate("/artists")}
          className={`px-4 py-2 rounded font-medium ${
            location.pathname === "/artists" || location.pathname === "/artists/"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-900"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => navigate("/artists/users")}
          className={`px-4 py-2 rounded font-medium ${
            location.pathname.includes("users")
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-900"
          }`}
        >
          Users
        </button>

        <button
          onClick={() => navigate("/artists/reports")}
          className={`px-4 py-2 rounded font-medium ${
            location.pathname.includes("reports")
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-900"
          }`}
        >
          Reports
        </button>
      </div>

      {/* Page Content */}
      <Outlet />
    </div>
  );
}
