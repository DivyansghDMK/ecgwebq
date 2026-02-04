import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Stethoscope, Mail, Lock, Eye, EyeOff } from "lucide-react";

type Role = "admin" | "doctor";

export default function LoginPage() {
  const navigate = useNavigate();

  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: "",
  });
  const [doctorCredentials, setDoctorCredentials] = useState({
    username: "",
    password: "",
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);

  const handleLogin = (role: Role, username: string, password: string) => {
    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

  // TEMP AUTH (backend later)
  localStorage.setItem("role", role);
  localStorage.setItem("token", "dummy-token");

  // Redirect based on role
  if (role === "admin") {
    localStorage.setItem("admin_logged_in", "true");
    navigate("/artists");
  } else if (role === "doctor") {
    localStorage.setItem("doctor_logged_in", "true");
    navigate("/doctor");
  }
  };

  const loginBoxes = [
    {
      role: "admin" as Role,
      title: "Admin",
      icon: Shield,
      gradient: "from-purple-500 via-purple-600 to-indigo-600",
      bgGradient: "from-purple-50 to-indigo-50",
      borderColor: "border-purple-200",
      credentials: adminCredentials,
      setCredentials: setAdminCredentials,
      showPassword: showAdminPassword,
      setShowPassword: setShowAdminPassword,
    },
    {
      role: "doctor" as Role,
      title: "Doctor",
      icon: Stethoscope,
      gradient: "from-brand-orange via-brand-electric to-brand-focus",
      bgGradient: "from-orange-50 to-amber-50",
      borderColor: "border-orange-200",
      credentials: doctorCredentials,
      setCredentials: setDoctorCredentials,
      showPassword: showDoctorPassword,
      setShowPassword: setShowDoctorPassword,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 py-12 px-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-orange via-brand-electric to-brand-focus bg-clip-text text-transparent mb-3">
            Welcome to CardioX
          </h1>
          <p className="text-gray-600 text-lg">Choose your role to continue</p>
        </motion.div>

        {/* Login boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
          {loginBoxes.map((box, index) => {
            const Icon = box.icon;
            return (
              <motion.div
                key={box.role}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative bg-gradient-to-br ${box.bgGradient} p-8 rounded-2xl shadow-xl border-2 ${box.borderColor} hover:shadow-2xl transition-all duration-300`}
              >
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div
                    className={`p-4 rounded-2xl bg-gradient-to-r ${box.gradient} shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                  {box.title}
                </h2>

                {/* Input Fields */}
                <div className="space-y-4">
                  {/* Username Input */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Username / Email"
                      value={box.credentials.username}
                      onChange={(e) =>
                        box.setCredentials({
                          ...box.credentials,
                          username: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const passwordInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input') as HTMLInputElement;
                          passwordInput?.focus();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={box.showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={box.credentials.password}
                      onChange={(e) =>
                        box.setCredentials({
                          ...box.credentials,
                          password: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleLogin(
                            box.role,
                            box.credentials.username,
                            box.credentials.password
                          );
                        }
                      }}
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => box.setShowPassword(!box.showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
                      aria-label={box.showPassword ? "Hide password" : "Show password"}
                    >
                      {box.showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    handleLogin(
                      box.role,
                      box.credentials.username,
                      box.credentials.password
                    )
                  }
                  className={`w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r ${box.gradient} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200`}
                >
                  Login as {box.title}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
