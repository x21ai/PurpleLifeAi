import Navbar from "./layout/navbar";
import HeroSection from "./sections/hero-section";
import WhyPurpleExistsSection from "./sections/why-purple-exists-section";
import WhatReBuildingTowardSection from "./sections/what-re-building-toward-section";
import MxAutoSection from "./sections/mx-auto-section";
import MxAutoSection2 from "./sections/mx-auto-section-2";
import PromisesKeepSection from "./sections/promises-keep-section";
import FreeOpenYoursSection from "./sections/free-open-yours-section";
import BeginWhereYouAreSection from "./sections/begin-where-you-are-section";
import Footer from "./layout/footer";

export default function Page() {
  return (
    <>
      <div className="purplelife-public bg-ploy-background-primary text-ploy-text-primary min-h-screen">
        <Navbar />
        <main>
          <HeroSection />
          <WhyPurpleExistsSection />
          <WhatReBuildingTowardSection />
          <MxAutoSection />
          <MxAutoSection2 />
          <PromisesKeepSection />
          <FreeOpenYoursSection />
          <BeginWhereYouAreSection />
        </main>
        <Footer />
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
