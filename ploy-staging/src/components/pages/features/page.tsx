import Navbar from "./layout/navbar";
import HeroSection from "./sections/hero-section";
import CaptureSection from "./sections/capture-section";
import MxAutoSection from "./sections/mx-auto-section";
import AskPurpleSection from "./sections/ask-purple-section";
import SeeSection from "./sections/see-section";
import CaregiversFamilyAnyoneSection from "./sections/caregivers-family-anyone-section";
import RestSection from "./sections/rest-section";
import BeginTodaySection from "./sections/begin-today-section";
import MxAutoSection2 from "./sections/mx-auto-section-2";
import Footer from "./layout/footer";

export default function Page() {
  return (
    <>
      <div className="purplelife-public bg-ploy-background-primary text-ploy-text-primary min-h-screen">
        <Navbar />
        <main>
          <HeroSection />
          <CaptureSection />
          <MxAutoSection />
          <AskPurpleSection />
          <SeeSection />
          <CaregiversFamilyAnyoneSection />
          <RestSection />
          <BeginTodaySection />
          <MxAutoSection2 />
        </main>
        <Footer />
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
