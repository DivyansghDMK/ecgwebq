import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    //Dummy login (later intg. with admin auth system)
    if (username === "admin" && password === "admin123") {
      localStorage.setItem("admin_logged_in", "true");
      localStorage.setItem("role", "admin");
      navigate("/artists");
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div className="admin-root min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white p-6 rounded-xl w-80 shadow-lg border">
        <h2 className="text-xl font-bold text-center mb-4 text-gray-900">
          Admin Login
        </h2>

        <input
          type="text"
          placeholder="Username"
          className="w-full border px-3 py-2 mb-3 rounded 
           bg-white text-gray-900 
           placeholder-gray-400 
           focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border px-3 py-2 mb-3 rounded 
           bg-white text-gray-900 
           placeholder-gray-400 
           focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm mb-3">{error}</p>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
        >
          Login
        </button>
      </div>
    </div>
  );
}
