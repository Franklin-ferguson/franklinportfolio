import { useEffect, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Work from './components/Work';
import Expertise from './components/Expertise';
import Experience from './components/Experience';
import Research from './components/Research';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { revealSections, ScrollTrigger, startSmoothScroll } from './lib/motion';

export default function App() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let stopSmooth: () => void = () => {};
    let alive = true;
    startSmoothScroll().then((stop) => {
      if (alive) stopSmooth = stop;
      else stop();
    });
    const undoReveal = mainRef.current ? revealSections(mainRef.current) : () => {};
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => {
      alive = false;
      stopSmooth();
      undoReveal();
      window.removeEventListener('load', refresh);
    };
  }, []);

  return (
    <>
      <Header />
      <main id="main" ref={mainRef}>
        <Hero />
        <About />
        <Work />
        <Expertise />
        <Experience />
        <Research />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
