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
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import UsersPage from "@/components/admin/users/UsersPage";
import ReportsPage from "@/components/admin/reports/ReportsPage";
import DashboardOverview from "@/components/admin/dashboard/DashboardOverview";
import S3FileBrowser from "@/components/S3FileBrowser";
import LoginPage from "@/components/auth/LoginPage";
import RequireRole from "@/components/auth/RequireRole";
import DoctorDashboardPresentation from "@/components/doctor/DoctorDashboardPresentation";
import DoctorReportsPage from "@/components/doctor/DoctorReportsPage";
import DoctorSetupPage from "@/components/doctor/DoctorSetupPage";
import SupportComplaints from "@/components/admin/SupportComplaints";
import VersionDownloadPage from "@/pages/VersionDownloadPage";
import LicensesPage from "@/pages/Licenses";
import DevicesPage from "@/components/admin/devices/DevicesPage";
import UnderConstruction from "@/components/UnderConstruction";


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
          <Route path="devices" element={<DevicesPage />} />
          <Route path="graphs" element={<Navigate to="/artists" replace />} />
          <Route path="support" element={<SupportComplaints />} />
          <Route path="licenses" element={<LicensesPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="doctor" />}>
        <Route path="/doctor" element={<DoctorDashboardPresentation />} />
        <Route path="/doctor/reports" element={<DoctorReportsPage />} />
      </Route>
      {/* public login routes */}
      <Route path="/login" element={<LoginPage mode="doctor" />} />
      <Route path="/login_admin" element={<LoginPage mode="admin" />} />
      <Route path="/doctor/setup" element={<DoctorSetupPage />} />
      
      {/* Version download page */}
      <Route path="/version" element={<VersionDownloadPage />} />

        {/* CPAP/BiPAP Routes - Under Construction */}
        <Route path="/cpap/login" element={<UnderConstruction />} />
        <Route path="/cpap/dashboard" element={<UnderConstruction />} />
        <Route path="/cpap/auto_cpap_mode" element={<UnderConstruction />} />
        <Route path="/cpap/cpap_mode" element={<UnderConstruction />} />
        <Route path="/cpap/s_mode" element={<UnderConstruction />} />
        <Route path="/cpap/t_mode" element={<UnderConstruction />} />
        <Route path="/cpap/st_mode" element={<UnderConstruction />} />
        <Route path="/cpap/vaps_mode" element={<UnderConstruction />} />
        <Route path="/cpap/reports" element={<UnderConstruction />} />
        <Route path="/cpap/reports/upload" element={<UnderConstruction />} />
        <Route path="/cpap/reports/analytics" element={<UnderConstruction />} />
        <Route path="/cpap/settings" element={<UnderConstruction />} />
        <Route path="/cpap/settings/profile" element={<UnderConstruction />} />
        <Route path="/cpap/settings/machine" element={<UnderConstruction />} />
        <Route path="/cpap/settings/admin" element={<UnderConstruction />} />
        <Route path="/settings/cpap_machine" element={<UnderConstruction />} />
        <Route path="/settings/admin" element={<UnderConstruction />} />
      </Routes>
      <NotificationContainer />
    </NotificationProvider>
    </AuthProvider>
  );
}
