import React from 'react';
import type { BrandColors } from '../utils/branding';

interface HeroSectionProps {
  heroImageUrl: string;
  colors: BrandColors;
}

const HeroSection: React.FC<HeroSectionProps> = ({ heroImageUrl, colors }) => {
  return (
    <section
      className="relative h-72 md:h-96 bg-center bg-cover flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url('${heroImageUrl}')`,
      }}
    >
      {/* Content */}
      <div className="relative z-10 text-center text-white space-y-6">
        <h1
          className="text-3xl md:text-5xl font-extrabold tracking-wide inline-block px-6 py-2 rounded-md shadow-lg"
          style={{ backgroundColor: colors.primary }}
        >
          Our Menu
        </h1>
      </div>
    </section>
  );
};

export default HeroSection;
