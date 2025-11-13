import { useEffect } from "react";
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
import { Footer } from "@/components/Footer";

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
      </main>
      <Footer />
    </>
  );
}

