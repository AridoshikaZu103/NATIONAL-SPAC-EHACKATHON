import dynamic from 'next/dynamic';
import Navbar from '@/components/ui/Navbar';
import HeroOverlay from '@/components/ui/HeroOverlay';
import MissionCards from '@/components/ui/MissionCards';
import Timeline from '@/components/ui/Timeline';
import StatsCounter from '@/components/ui/StatsCounter';
import Footer from '@/components/ui/Footer';
import LoadingScreen from '@/components/shared/LoadingScreen';

// Dynamic import for the 3D scene — must disable SSR to avoid WebGL errors
const SpaceScene = dynamic(() => import('@/components/scene/SpaceScene'), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <Navbar />

      {/* 3D Background Scene (fixed position) */}
      <SpaceScene />

      {/* Content layers above the 3D scene */}
      <main className="main-content">
        {/* Hero Section */}
        <HeroOverlay />

        {/* Scrollable Content Sections */}
        <div className="content-sections">
          <MissionCards />
          <hr className="glow-divider" />
          <Timeline />
          <hr className="glow-divider" />
          <StatsCounter />
        </div>

        <Footer />
      </main>

      <style jsx>{`
        .main-content {
          position: relative;
          z-index: 10;
        }

        .content-sections {
          position: relative;
          background: linear-gradient(
            180deg,
            var(--color-bg-primary) 0%,
            rgba(3, 0, 20, 0.97) 5%,
            rgba(3, 0, 20, 0.99) 100%
          );
        }
      `}</style>
    </>
  );
}
