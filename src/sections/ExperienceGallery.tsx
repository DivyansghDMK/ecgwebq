import { ScreenTabs, Section, SectionHead, type ScreenItem } from "./ui";

const loginImage = new URL("../Assets/Login.webp", import.meta.url).href;
const dashboardImage = new URL("../Assets/Dashboard.webp", import.meta.url).href;
const controlPanelImage = new URL("../Assets/ControlPanel.webp", import.meta.url).href;
const signUpImage = new URL("../Assets/SignUp.webp", import.meta.url).href;
const graphOverlayImage = new URL("../Assets/121GraphMode.webp", import.meta.url).href;
const hrvImage = new URL("../Assets/HRVLeadII.webp", import.meta.url).href;
const hyperkalemiaImage = new URL("../Assets/Hyperkalmia_Photo.webp", import.meta.url).href;

const galleryItems: ScreenItem[] = [
  {
    title: "Sign in",
    kicker: "Access",
    description:
      "Sign in with your phone number or full name and the password you chose at signup. Sign-in works offline; connect to the internet at least once a week.",
    image: loginImage
  },
  {
    title: "Create your account",
    kicker: "Setup",
    description:
      "Connect the RhythmUltra device, then fill in your details. Signup needs an internet connection once.",
    image: signUpImage
  },
  {
    title: "Clinical dashboard",
    kicker: "Overview",
    description:
      "Monitor patient sessions, review recent reports, and watch live vitals with responsive widgets built for cardiology teams.",
    image: dashboardImage
  },
  {
    title: "12-lead live test",
    kicker: "Acquisition",
    description:
      "Command center view for acquisition and filtering, featuring BPM, PR, QRS, ST, QT/QTc metrics with demo controls.",
    image: controlPanelImage
  },
  {
    title: "Graph overlay",
    kicker: "Live",
    description:
      "Switch the live view to ECG-paper graph mode with a grid for reading intervals and amplitudes by eye.",
    image: graphOverlayImage
  },
  {
    title: "HRV test, Lead II",
    kicker: "HRV",
    description:
      "Dedicated HRV capture for Lead II with live timing, interval tracking, and long-window waveform collection to support autonomic and rhythm variability review.",
    image: hrvImage
  },
  {
    title: "Hyperkalemia detection",
    kicker: "Screening",
    description:
      "Screening view that analyzes Lead II and precordial signals for hyperkalemia-related waveform changes, so teams can inspect T-wave, PR, and QRS behavior in one place.",
    image: hyperkalemiaImage
  }
];

export function ExperienceGallery() {
  return (
    <Section id="gallery">
      <SectionHead
        eyebrow="The desktop app"
        title="From sign-in to diagnostics, screen by screen"
        lede="A walk through the Deckmount ECG Monitor as a clinician meets it: administration, dashboards, live acquisition and analysis."
      />
      <ScreenTabs items={galleryItems} />
    </Section>
  );
}
