import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Activity, Wind, ArrowRight } from "lucide-react";

export function LoginSection() {
  const navigate = useNavigate();

  const loginOptions = [
    {
      id: "ecg",
      title: "Login for ECG",
      description: "Access ECG monitoring and analysis dashboard for cardiologists and clinical teams",
      icon: Activity,
      gradient: "from-brand-orange via-brand-electric to-brand-focus",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      cardBg: "bg-gradient-to-br from-orange-50/40 to-amber-50/30",
      borderColor: "border-orange-200/50",
      route: "/login",
    },
    {
      id: "cpap",
      title: "Login for CPAP/BiPAP",
      description: "Access respiratory therapy device dashboard for CPAP and BiPAP monitoring",
      icon: Wind,
      gradient: "from-teal-400 to-emerald-500",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      cardBg: "bg-gradient-to-br from-teal-50/40 to-emerald-50/30",
      borderColor: "border-teal-200/50",
      route: "/cpap/login",
    },
  ];

  return (
    <section id="login-section" className="mx-auto max-w-6xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <Badge className="uppercase tracking-[0.4em] mb-4">Secure Access</Badge>
        <h2 className="section-heading mb-4">
          Choose Your Platform
        </h2>
        <p className="section-subheading max-w-2xl mx-auto">
          Select your service to access your personalized dashboard and monitoring tools
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {loginOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => navigate(option.route)}
              className={`${option.cardBg} rounded-2xl border ${option.borderColor} shadow-lg hover:shadow-xl p-8 cursor-pointer group relative overflow-hidden backdrop-blur-sm transition-all duration-300`}
            >
              <div className="relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`p-4 rounded-xl ${option.iconBg} shadow-md`}
                  >
                    <Icon className={`w-8 h-8 ${option.iconColor}`} />
                  </motion.div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-3">
                  {option.title}
                </h3>

                {/* Description */}
                <p className="text-center text-gray-600 mb-8 text-sm leading-relaxed">
                  {option.description}
                </p>

                {/* Action Button */}
                <div className="flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${option.gradient} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
