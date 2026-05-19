import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/sections/Hero";
import { Features } from "@/sections/Features";
import { DashboardShowcase } from "@/sections/DashboardShowcase";
import { ProductOverview } from "@/sections/ProductOverview";
import { ExperienceGallery } from "@/sections/ExperienceGallery";
import { ControlPanel } from "@/sections/ControlPanel";
import { ModesShowcase } from "@/sections/ModesShowcase";
import { AnalysisSection } from "@/sections/AnalysisSection";
import { WaveformAnalysisShowcase } from "@/sections/WaveformAnalysisShowcase";
import { ReportHistorySection } from "@/sections/ReportHistorySection";
import { AdminSection } from "@/sections/AdminSection";
import { SupportSection } from "@/sections/SupportSection";
import { CtaSection } from "@/sections/CtaSection";
import { LoginSection } from "@/sections/LoginSection";
import { Footer } from "@/components/Footer";
import NotificationContainer from "@/components/common/NotificationContainer";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
 
import { CardmiaChatbot } from "@/components/CardmiaChatbot";
import { Routes, Route } from "react-router-dom";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import UsersPage from "@/components/admin/users/UsersPage";
import ReportsPage from "@/components/admin/reports/ReportsPage";
import DashboardOverview from "@/components/admin/dashboard/DashboardOverview";
import S3FileBrowser from "@/components/S3FileBrowser";
import ECGGraphsPage from "@/components/admin/graphs/ECGGraphsPage";
import LoginPage from "@/components/auth/LoginPage";
import RequireRole from "@/components/auth/RequireRole";
import DoctorDashboardPresentation from "@/components/doctor/DoctorDashboardPresentation";
import DoctorReportsPage from "@/components/doctor/DoctorReportsPage";
import DoctorSetupPage from "@/components/doctor/DoctorSetupPage";
import SupportComplaints from "@/components/admin/SupportComplaints";
import VersionDownloadPage from "@/pages/VersionDownloadPage";
import LicensesPage from "@/pages/Licenses";


function CPAPUnderConstruction() {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-100 px-4 py-12 text-slate-900">
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-blue-200/60 to-transparent" />
      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 rounded-[2rem] border border-blue-100 bg-white/90 p-6 shadow-2xl shadow-blue-200/70 backdrop-blur md:grid-cols-[1.05fr_0.95fr] md:p-10">
        <div className="text-center md:text-left">
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-blue-700">
            CPAP/BiPAP
          </span>
          <p className="mt-8 max-w-xl text-base leading-7 text-slate-600">
            CPAP/BiPAP access is temporarily unavailable while this module is being upgraded.
          </p>
          <div className="mt-8 inline-flex rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-300/70">
            Coming Soon
          </div>
        </div>
        <div className="flex justify-center">
          <img
            src="/assets/under-construction.png"
            alt="Under construction"
            className="w-full max-w-md object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </main>
  );
}


function ScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
        {/*normal url */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <main className="flex flex-col gap-6 w-full">
                <ScrollToHash />
                <Hero />
                <ExperienceGallery />
                <ProductOverview />
                <Features />
                <DashboardShowcase />
                <ControlPanel />
              <ModesShowcase />
              <AnalysisSection />
              <WaveformAnalysisShowcase />
              <ReportHistorySection />
              <AdminSection />
              <SupportSection />
              <CtaSection />
              <LoginSection />
            </main>
            <Footer />
            <CardmiaChatbot />
          </>
        }
      />

      {/*admin login (removed external link variant) */}

      {/*admin dashboard */}
      <Route element={<RequireRole role="admin" />}>
        <Route path="/artists" element={<AdminLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="s3-browser" element={<S3FileBrowser />} />
          <Route path="graphs" element={<ECGGraphsPage />} />
          <Route path="support" element={<SupportComplaints />} />
          <Route path="licenses" element={<LicensesPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="doctor" />}>
        <Route path="/doctor" element={<DoctorDashboardPresentation />} />
        <Route path="/doctor/reports" element={<DoctorReportsPage />} />
      </Route>
      {/* public login for admin / doctor */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/doctor/setup" element={<DoctorSetupPage />} />
      
      {/* Version download page */}
      <Route path="/version" element={<VersionDownloadPage />} />

        {/* CPAP/BiPAP Routes */}
        <Route path="/cpap/login" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/dashboard" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/auto_cpap_mode" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/cpap_mode" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/s_mode" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/t_mode" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/st_mode" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/vaps_mode" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/reports" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/reports/upload" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/reports/analytics" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/settings" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/settings/profile" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/settings/machine" element={<CPAPUnderConstruction />} />
        <Route path="/cpap/settings/admin" element={<CPAPUnderConstruction />} />
        <Route path="/settings/cpap_machine" element={<CPAPUnderConstruction />} />
        <Route path="/settings/admin" element={<CPAPUnderConstruction />} />
      </Routes>
      <NotificationContainer />
    </NotificationProvider>
    </AuthProvider>
  );
}
