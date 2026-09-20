import Navbar from "./layout/navbar";
import HeroSection from "./sections/hero-section";
import Footer from "./layout/footer";

export default function Page() {
  return (
    <>
      <div className="purplelife-public bg-ploy-background-primary text-ploy-text-primary min-h-screen">
        <Navbar />
        <HeroSection />
        <Footer />
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
