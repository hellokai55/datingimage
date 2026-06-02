import { AboutHero } from './about-hero';
import { AboutHowItWorks } from './about-how-it-works';
import { AboutPrivacy } from './about-privacy';
import { AboutGallery } from './about-gallery';

export default function About() {
  return (
    <div className="flex flex-col">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <AboutHero />
        </div>
      </section>

      <section className="border-t px-4 py-16 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <AboutHowItWorks />
        </div>
      </section>

      <AboutGallery />

      <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <AboutPrivacy />
        </div>
      </section>
    </div>
  );
}
