import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Knowledge base for CardioX and ECG
const knowledgeBase: Record<string, string | ((query: string) => string)> = {
  // CardioX questions
  "what is cardiox": "CardioX is an advanced ECG monitoring system by Deckmount that provides live waveform analysis, predictive alerts, and an intuitive control center engineered for cardiologists and clinical teams. It transforms ECG data into instantaneous insights while preserving clinician-friendly workflows.",
  
  "cardiox features": "CardioX features include: AI Rhythm Intelligence for live PQRS pattern interpretation, 12-Lead Precision visualization, Omni-Channel Access across desktop, tablet, and mobile devices, and Clinical Workflow Control for configuring filters and acquisition modes. It also offers live ECG waveform rendering, auto-calculated metrics (PR, QRS, QT/QTc, ST), PDF + JSON report generation, and secure cloud + local storage.",
  
  "cardiox capabilities": "CardioX capabilities include live ECG waveform rendering with hospital-grade filtering, auto-calculated PR, QRS, QT/QTc, ST, and trajectory metrics, combined PDF + JSON report generation, adaptive noise reduction, unique share links with multiple cloud destinations (AWS S3, Azure, GCS, API, FTP, Dropbox), and offline-first workflows with smart duplicate capture prevention.",
  
  "how does cardiox work": "CardioX works by capturing ECG signals through a 12-lead system, processing them with AI-powered neural engines that interpret live PQRS patterns, highlighting anomalies instantly. The system provides real-time waveform monitoring with AI-assisted arrhythmia detection, secure authentication via hospital ID or biometric passkeys, and generates comprehensive reports with both PDF and JSON formats.",
  
  "cardiox login": "CardioX offers secure authentication through the Clinical Portal. You can login using hospital ID, phone number, or biometric passkeys. The system is designed for rapid access without compromising security, ensuring healthcare professionals can access critical cardiac data quickly and safely.",
  
  "cardiox deployment": "CardioX is deployment-ready with Windows & macOS builds. It's distributed via PyInstaller bundles with offline-first data storage, ensuring hospitals and remote clinics remain connected to insights at all times. The system features redundant storage with automated sync to CardioX Cloud and encrypted handoff for API integrations.",
  
  "cardiox dashboard": "The CardioX dashboard is a Clinical Operations Dashboard that aggregates live ECG signals, clinical annotations, and patient history into a single responsive interface. It displays real-time cardiac parameters including HR (Heart Rate), PR interval, QRS duration, Axis, QT/QTc intervals, and session timers. The dashboard features a dynamic calendar for scheduled ECG reviews, AI-generated conclusions with clinician override workflow, quick access to recent reports, and collaborative comments. It's designed for real-world cardiology labs with multi-patient monitoring capabilities.",
  
  "dashboard": "The CardioX dashboard provides real-time monitoring of all cardiac parameters. It displays key metrics like HR, PR, QRS, Axis, and QT/QTc intervals, shows live ECG recordings from different leads, and provides quick access to recent reports. The dashboard includes a dynamic calendar for scheduling, AI-generated conclusions, and collaborative features for clinical teams.",
  
  "why use cardiox": "You should use CardioX because it offers: 1) Real-time AI-powered arrhythmia detection for instant anomaly identification, 2) Hospital-grade filtering and precision with 12-lead visualization, 3) Seamless multi-device access across desktop, tablet, and mobile, 4) Offline-first workflows ensuring continuous operation even without internet, 5) Comprehensive reporting with both PDF and JSON formats, 6) Secure cloud and local storage with automated sync, 7) Intuitive control center designed specifically for cardiology workflows, and 8) Predictive alerts that help prevent cardiac events before they become critical.",
  
  "why cardiox": "CardioX provides advanced ECG monitoring with AI-powered insights, real-time waveform analysis, and an intuitive interface designed for cardiologists. It offers offline capabilities, secure multi-device access, comprehensive reporting, and predictive alerts to help clinical teams make faster, more informed decisions.",
  
  "benefits of cardiox": "CardioX benefits include: AI-assisted diagnosis with instant anomaly detection, real-time monitoring across all 12 leads, secure multi-device access, offline functionality for remote clinics, automated report generation, cloud and local storage redundancy, and workflow optimization for high-volume cardiac labs.",
  
  "cardiox control panel": "The CardioX Control Panel is a command center for acquisition, filtering, and report capture. It allows you to switch between 12:1 and 6:2 lead layouts instantly, configure filters (baseline wander, notch, muscle artifact), use printer-ready templates with millimeter calibration, auto-save ECG snapshots, maintain rhythm fidelity up to 30 minutes with smart timers, and access role-based presets for clinicians, technicians, and home caregivers. The panel is optimized for CPU efficiency (20-30% utilization) and includes crash recovery features.",
  
  "control panel": "The CardioX Control Panel provides precision controls for ECG acquisition and filtering. You can switch lead layouts, configure filters, capture screen recordings, generate reports, and access demo simulations - all without leaving the live view. It includes workflow automation features like auto-save and smart timers.",
  
  // ECG questions
  "what is ecg": "ECG (Electrocardiogram) is a medical test that records the electrical activity of your heart. It shows the rhythm and electrical impulses as they travel through the heart muscle. ECGs are used to detect heart problems, monitor heart health, and diagnose various cardiac conditions.",
  
  "how does ecg work": "An ECG works by placing electrodes on your skin that detect the electrical signals produced by your heart with each heartbeat. These signals are recorded and displayed as waveforms on a monitor or printed on paper. The test is painless and non-invasive, typically taking just a few minutes to complete.",
  
  "why use ecg": "ECG is essential for: detecting heart rhythm abnormalities (arrhythmias), identifying heart attacks and coronary artery disease, monitoring heart health during surgery or medication, evaluating pacemaker function, diagnosing structural heart problems, and screening for cardiac conditions. It's a non-invasive, quick, and cost-effective way to assess cardiac function.",
  
  "why ecg": "ECG is a vital diagnostic tool that helps detect heart problems early, monitor cardiac health, diagnose arrhythmias and heart attacks, and guide treatment decisions. It's non-invasive, quick, and provides immediate insights into heart function.",
  
  "what is 12 lead ecg": "A 12-lead ECG uses 10 electrodes placed on the body to record electrical activity from 12 different angles or 'leads'. This provides a comprehensive view of the heart's electrical activity from multiple perspectives, allowing doctors to detect abnormalities in different regions of the heart. It's the standard diagnostic ECG used in hospitals and clinics.",
  
  "ecg leads": "ECG leads are different views of the heart's electrical activity. A 12-lead ECG includes: 3 limb leads (I, II, III), 3 augmented leads (aVR, aVL, aVF), and 6 precordial/chest leads (V1-V6). Each lead provides information about different parts of the heart, helping cardiologists get a complete picture of cardiac function.",
  
  "ecg waveform": "An ECG waveform shows the electrical activity of the heart. The main components are: P wave (atrial depolarization), QRS complex (ventricular depolarization), T wave (ventricular repolarization), and sometimes a U wave. The intervals between these waves (PR, QT, QRS duration) provide important diagnostic information about heart rhythm and conduction.",
  
  // General help
  "help": "I'm Cardmia, your CardioX assistant! I can help you with questions about CardioX features, ECG basics, how the system works, deployment information, dashboards, control panels, benefits, and more. Just ask me anything about CardioX or ECG, and I'll do my best to help!",
  
  "hello": "Hello! I'm Cardmia, your CardioX assistant. How can I help you today? I can answer questions about CardioX features, ECG basics, system capabilities, dashboards, and more!",
  
  "hi": "Hi there! I'm Cardmia, here to help you learn about CardioX and ECG. What would you like to know?",
  
  "contact": "For support or inquiries about CardioX, please contact our Solutions Team:\n\n📧 Email: ankur.kumar@deckmount.in\n📞 Direct Phone: +91 87000 76769\n📞 Company Phone: 1800 309 2499\n\nYou can also visit the Support section on this website. The CardioX system includes comprehensive documentation and support resources for clinical teams.",
  
  "contact details": "Here are the contact details for CardioX support:\n\n📧 Email: ankur.kumar@deckmount.in\n📞 Direct Phone: +91 87000 76769\n📞 Company Phone: 1800 309 2499\n\nAddress: 260, Phase IV, Udyog Vihar, Sector 18, Gurugram, Haryana 122015\nWebsite: deckmount.in\n\nYou can also visit the Support section on this website for more information.",
  
  "pricing": "For information about CardioX pricing, licensing, or deployment options, please contact Deckmount directly. They can provide details about Windows & macOS builds, cloud integration options, and enterprise deployment packages.",
};

// Default response with contact information
const getDefaultResponse = (): string => {
  return `I'm not entirely sure about that specific detail. For more detailed information, please contact our Solutions Team:\n\n📧 Email: ankur.kumar@deckmount.in\n📞 Phone: +91 87000 76769\n\nYou can also reach out via the Support section on this website. I can help you with questions about CardioX features, ECG basics, system capabilities, dashboards, and more!`;
};

// Helper function to handle typos and variations
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    // Common typos
    .replace(/dahboard/g, "dashboard")
    .replace(/dashbord/g, "dashboard")
    .replace(/cariox/g, "cardiox")
    .replace(/cardio x/g, "cardiox")
    .replace(/cardio-x/g, "cardiox")
    .replace(/capabilit/g, "capabilities")
    .replace(/featur/g, "features")
    .replace(/contac/g, "contact")
    .replace(/detai/g, "details");
}

function findResponse(query: string): string {
  const normalizedQuery = normalizeQuery(query);
  
  // Priority matching - check for specific phrases first (longer matches have priority)
  const sortedKeys = Object.keys(knowledgeBase).sort((a, b) => b.length - a.length);
  
  // Check for exact phrase matches first
  for (const key of sortedKeys) {
    if (normalizedQuery.includes(key)) {
      const response = knowledgeBase[key];
      return typeof response === "function" ? response(query) : response;
    }
  }
  
  // Check for keyword combinations with priority
  const keywordMap: Array<{ keywords: string[]; response: string; priority: number; requireAll?: boolean }> = [
    { keywords: ["capabilities", "capabilit"], response: knowledgeBase["cardiox capabilities"] as string, priority: 10 },
    { keywords: ["features", "featur"], response: knowledgeBase["cardiox features"] as string, priority: 10 },
    { keywords: ["dashboard", "dashbord", "dahboard"], response: knowledgeBase["dashboard"] as string, priority: 9 },
    { keywords: ["why", "use", "benefit", "should"], response: knowledgeBase["why use cardiox"] as string, priority: 8 },
    { keywords: ["control", "panel"], response: knowledgeBase["control panel"] as string, priority: 8 },
    { keywords: ["contact", "contac", "details", "detai"], response: knowledgeBase["contact details"] as string, priority: 7 },
    { keywords: ["pricing", "price", "cost"], response: knowledgeBase["pricing"] as string, priority: 7 },
    { keywords: ["login", "auth", "sign in"], response: knowledgeBase["cardiox login"] as string, priority: 6 },
    { keywords: ["deploy", "deployment", "install"], response: knowledgeBase["cardiox deployment"] as string, priority: 6 },
    { keywords: ["cardiox", "cariox"], response: knowledgeBase["what is cardiox"] as string, priority: 5 },
    { keywords: ["ecg", "electrocardiogram"], response: knowledgeBase["what is ecg"] as string, priority: 5 },
    { keywords: ["12 lead", "12-lead"], response: knowledgeBase["what is 12 lead ecg"] as string, priority: 4 },
    { keywords: ["waveform", "wave"], response: knowledgeBase["ecg waveform"] as string, priority: 4 },
    { keywords: ["lead", "leads"], response: knowledgeBase["ecg leads"] as string, priority: 3 },
  ];
  
  // Find best match based on keywords
  let bestMatch: { response: string; priority: number } | null = null;
  
  for (const entry of keywordMap) {
    const hasKeyword = entry.keywords.some(keyword => normalizedQuery.includes(keyword));
    if (hasKeyword && (!bestMatch || entry.priority > bestMatch.priority)) {
      bestMatch = { response: entry.response, priority: entry.priority };
    }
  }
  
  if (bestMatch) {
    return bestMatch.response;
  }
  
  // Return default response with contact information
  return getDefaultResponse();
}

export function CardmiaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Cardmia, your CardioX assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate thinking delay
    setTimeout(() => {
      const response = findResponse(inputValue);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-gradient-to-r from-brand-orange via-brand-electric to-brand-focus",
          "text-slate-950 shadow-glow hover:opacity-90 transition-all",
          "border-2 border-white/20",
          "md:bottom-6 md:right-6 bottom-4 right-4"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed z-50 flex flex-col",
              "rounded-3xl border border-white/20 bg-slate-900/95 backdrop-blur-xl",
              "shadow-2xl overflow-hidden",
              "bottom-20 right-4 left-4 md:bottom-24 md:right-6 md:left-auto",
              "h-[calc(100vh-140px)] md:h-[600px]",
              "w-auto md:w-[400px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-brand-orange/20 via-brand-electric/20 to-brand-focus/20 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-orange to-brand-electric">
                <Bot className="h-5 w-5 text-slate-950" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Cardmia</h3>
                <p className="text-xs text-white/60">CardioX Assistant</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5",
                      message.isUser
                        ? "bg-gradient-to-r from-brand-orange to-brand-electric text-slate-950"
                        : "bg-white/10 text-white border border-white/10"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                    <p className="mt-1 text-xs opacity-60">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-4 bg-slate-900/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about CardioX or ECG..."
                  className={cn(
                    "flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5",
                    "text-sm text-white placeholder:text-white/40",
                    "focus:outline-none focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                  )}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="h-10 w-10 rounded-full p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-center text-white/40">
                Ask me about CardioX features, ECG basics, or system capabilities
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

