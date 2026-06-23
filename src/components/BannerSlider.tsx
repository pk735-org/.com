import React, { useState, useEffect } from 'react';

export const BannerSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'PK735 Welcome Bonus',
      subtitle: 'Get Rs 735 free on downloading our official APK app today!',
      bg: 'linear-gradient(135deg, #023E37 0%, #04534A 100%)',
      btnText: 'Claim Now',
      color: '#FED36A',
    },
    {
      id: 2,
      title: 'Secure Payments',
      subtitle: 'EasyPaisa & JazzCash deposits credited instantly. 24/7 withdrawals.',
      bg: 'linear-gradient(135deg, #0A3D62 0%, #3C6382 100%)',
      btnText: 'Deposit',
      color: '#00C853',
    },
    {
      id: 3,
      title: 'Aviator Crash Game',
      subtitle: 'Fly high and cash out up to 100x your bet! Real-time simulator.',
      bg: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
      btnText: 'Play Now',
      color: '#FFE600',
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="w-full relative rounded-xl overflow-hidden shadow-lg border border-white/5 h-[120px] select-none">
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className="absolute inset-0 flex flex-col justify-center px-5 transition-opacity duration-700 ease-in-out"
          style={{
            background: slide.bg,
            opacity: idx === currentSlide ? 1 : 0,
            pointerEvents: idx === currentSlide ? 'auto' : 'none',
          }}
        >
          {/* Subtle decorations */}
          <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 rounded-full opacity-10 bg-white" />
          <div className="absolute left-[30%] top-[-30px] w-20 h-20 rounded-full opacity-5 bg-white" />

          <div className="max-w-[70%] z-10">
            <h3 className="text-[14px] font-black tracking-wide uppercase" style={{ color: slide.color }}>
              {slide.title}
            </h3>
            <p className="text-[11px] text-white/95 mt-1 font-medium leading-snug">
              {slide.subtitle}
            </p>
          </div>
          
          <button 
            className="absolute right-5 bottom-4 text-[10px] font-bold px-3 py-1.5 rounded-[4px] cursor-pointer active:scale-95 transition-transform"
            style={{ backgroundColor: slide.color, color: '#111' }}
          >
            {slide.btnText}
          </button>
        </div>
      ))}

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-5 flex gap-1.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentSlide ? 'bg-[#FED36A] w-4' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
