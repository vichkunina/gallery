import { About } from './components/About/About';
import { Contact } from './components/Contact/Contact';
import { Footer } from './components/Footer/Footer';
import { Gallery } from './components/Gallery/Gallery';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { Koshmariki } from './components/Koshmariki/Koshmariki';
import { Lightbox } from './components/Lightbox/Lightbox';
import { SkipLink } from './components/SkipLink/SkipLink';
import { ScrollChihuahua } from './components/ScrollChihuahua/ScrollChihuahua';
import { GalleryProvider } from './context/GalleryContext';

export default function App() {
  return (
    <GalleryProvider>
      <SkipLink />
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Gallery />
        <Koshmariki />
        <Contact />
      </main>
      <Footer />
      <ScrollChihuahua />
      <Lightbox />
    </GalleryProvider>
  );
}
