import Navbar from "./layout/navbar";
import HeroSection from "./sections/hero-section";
import MxAutoSection from "./sections/mx-auto-section";
import Footer from "./layout/footer";

export default function Page() {
  return (
    <>
      <div className="bg-ploy-background-primary text-ploy-text-primary min-h-screen">
        <Navbar />
        <HeroSection />
        <MxAutoSection />
        <Footer />
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
