import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/sections/Hero";
import { Features } from "@/sections/Features";
import { DashboardShowcase } from "@/sections/DashboardShowcase";
import { ProductOverview } from "@/sections/ProductOverview";
import { ExperienceGallery } from "@/sections/ExperienceGallery";
import { ControlPanel } from "@/sections/ControlPanel";
import { AnalysisSection } from "@/sections/AnalysisSection";
import { AdminSection } from "@/sections/AdminSection";
import { SupportSection } from "@/sections/SupportSection";
import { CtaSection } from "@/sections/CtaSection";
import { LoginSection } from "@/sections/LoginSection";
import { Footer } from "@/components/Footer";
 
import { CardmiaChatbot } from "@/components/CardmiaChatbot";
import { Routes, Route } from "react-router-dom";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import UsersPage from "@/components/admin/users/UsersPage";
import ReportsPage from "@/components/admin/reports/ReportsPage";
import DashboardOverview from "@/components/admin/dashboard/DashboardOverview";
import S3FileBrowser from "@/components/S3FileBrowser";
import ECGGraphsPage from "@/components/admin/graphs/ECGGraphsPage";
import LoginPage from "@/components/auth/LoginPage";
import Dashboard from "@/components/dashboard/Dashboard";
import CPAPLogin from "@/components/dashboard_CPAP_BiPAP/CPAPLogin";
import CPAPDashboard from "@/components/dashboard_CPAP_BiPAP/CPAPDashboard";
import CPAPSettings from "@/components/dashboard_CPAP_BiPAP/CPAPSettings";
import AutoCPAPMode from "@/components/dashboard_CPAP_BiPAP/AutoCPAPMode";
import CPAPMode from "@/components/dashboard_CPAP_BiPAP/CPAPMode";
import SMode from "@/components/dashboard_CPAP_BiPAP/SMode";
import TMode from "@/components/dashboard_CPAP_BiPAP/TMode";
import STMode from "@/components/dashboard_CPAP_BiPAP/STMode";
import VAPSMode from "@/components/dashboard_CPAP_BiPAP/VAPSMode";
import ReportsLogin from "@/components/dashboard_CPAP_BiPAP/ReportsLogin";
import ReportsUpload from "@/components/dashboard_CPAP_BiPAP/ReportsUpload";
import ReportsAnalytics from "@/components/dashboard_CPAP_BiPAP/ReportsAnalytics";
import DoctorDashboardPresentation from "@/components/doctor/DoctorDashboardPresentation";
import DoctorReportsPage from "@/components/doctor/DoctorReportsPage";



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
    <Routes>
      {/*normal url */}
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <main className="flex flex-col gap-6">
              <ScrollToHash />
              <Hero />
              <ExperienceGallery />
              <ProductOverview />
              <Features />
              <DashboardShowcase />
              <ControlPanel />
              <AnalysisSection />
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
      <Route path="/artists" element={<AdminLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="s3-browser" element={<S3FileBrowser />} />
        <Route path="graphs" element={<ECGGraphsPage />} />
      </Route>
      {/* public login for admin / doctor */}
      <Route path="/login" element={<LoginPage />} />

        {/* common dashboard (role-based later) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/doctor" element={<DoctorDashboardPresentation />} />
            <Route path="/doctor/reports" element={<DoctorReportsPage />} />

        {/* CPAP/BiPAP Routes */}
        <Route path="/cpap/login" element={<CPAPLogin />} />
        <Route path="/cpap/dashboard" element={<CPAPDashboard />} />
        <Route path="/cpap/auto_cpap_mode" element={<AutoCPAPMode />} />
        <Route path="/cpap/cpap_mode" element={<CPAPMode />} />
        <Route path="/cpap/s_mode" element={<SMode />} />
        <Route path="/cpap/t_mode" element={<TMode />} />
        <Route path="/cpap/st_mode" element={<STMode />} />
        <Route path="/cpap/vaps_mode" element={<VAPSMode />} />
        <Route path="/cpap/reports" element={<ReportsLogin />} />
        <Route path="/cpap/reports/upload" element={<ReportsUpload />} />
        <Route path="/cpap/reports/analytics" element={<ReportsAnalytics />} />
        <Route path="/cpap/settings" element={<CPAPSettings />} />
        <Route path="/cpap/settings/profile" element={<CPAPSettings />} />
        <Route path="/cpap/settings/machine" element={<CPAPSettings />} />
        <Route path="/cpap/settings/admin" element={<CPAPSettings />} />
        <Route path="/settings/cpap_machine" element={<CPAPSettings />} />
        <Route path="/settings/admin" element={<CPAPSettings />} />
        </Routes>
  );
}
