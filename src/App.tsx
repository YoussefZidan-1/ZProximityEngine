import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import gsap from 'gsap';
import { ReactLenis } from 'lenis/react';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { 
  ArrowRight, 
  Terminal,
  Moon,
  Sun
} from 'lucide-react';
import { Proximity, ProximityText, ProximityProvider } from './lib';

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

// LAZY LOADED HEAVY COMPONENTS
const PresetsSection = lazy(() => import('./components/PresetsSection'));
const Documentation = lazy(() => import('./Documentation'));
const Gamebox = lazy(() => import('./components/Gamebox'));

// =====================================================================
// DRY ANIMATION WRAPPERS (Tasteful Reveals Only)
// =====================================================================

const getRevealConfig = (delay: number, animateOnScroll: boolean, duration: number) => ({
  reveal: [110, 0] as [number, number],
  opacity: [0, 1] as [number, number],
  duration,
  ease: "expo",
  scroll: { scrub: false, once: true, start: animateOnScroll ? "top 95%" : "appear" },
  timeline: { reveal: { delay }, opacity: { delay } }
});

const RevealText = ({ text, delay = 0, duration = 1.2, animateOnScroll = true, className = "", textClassName = "", splitBy = "word", ...props }: any) => (
  <ProximityText 
    mode="scroll"
    text={text}
    wordSpacing={0.3}
    splitBy={splitBy}
    preset="reveal-opacity"
    className={className}
    textClassName={textClassName}
    config={getRevealConfig(delay, animateOnScroll, duration)}
    {...props}
  />
);

const RevealGroup = ({ children, delay = 0, duration = 1.2, animateOnScroll = true, className = "" }: any) => (
  <Proximity
    mode="scroll"
    preset="reveal-opacity"
    selector=".reveal-item"
    className={className}
    config={getRevealConfig(delay, animateOnScroll, duration)}
  >
    {children}
  </Proximity>
);

// =====================================================================
// UI COMPONENTS
// =====================================================================

export const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`text-[10px] uppercase font-bold tracking-[0.2em] block ${className}`}>
    {children}
  </span>
);

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const lenisRef = useRef<any>(null);
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const horizontalWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useGSAP(() => {
    // GSAP Horizontal Scroll hijacking
    if (horizontalSectionRef.current && horizontalWrapperRef.current) {
      const wrapper = horizontalWrapperRef.current;
      ScrollTrigger.create({
        trigger: horizontalSectionRef.current,
        start: "top top",
        end: () => `+=${wrapper.scrollWidth - window.innerWidth}`,
        pin: true,
        pinSpacing: true, // Force vertical scroll pauses during pinning
        animation: gsap.to(wrapper, {
          x: () => -(wrapper.scrollWidth - window.innerWidth),
          ease: "none",
        }),
        scrub: 1,
        invalidateOnRefresh: true,
      });

      // CRITICAL FIX: Ensure triggers created by child components below 
      // the pin account for the newly injected pinSpacing layout
      ScrollTrigger.sort();
    }
  });

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
    }
  
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    // CRITICAL FIX: Do not alter delta-time, Lenis needs exact time sync
    gsap.ticker.lagSmoothing(0); 
    // CRITICAL FIX: Removed .fps(120) to prevent thermal throttling and jank
  
    return () => {
      gsap.ticker.remove(update);
      lenis?.off('scroll', ScrollTrigger.update);
    };
  }, []);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    gsap.to(window, { duration: 1.2, scrollTo: { y: targetId, offsetY: 100 }, ease: "power3.inOut" });
  };

  return (
    <ReactLenis root ref={lenisRef} autoRaf={false} options={{ lerp: 0.1, duration: 1.5 }}>
      <ProximityProvider config={{ defaultFont: "'Bricolage Grotesque', 'Cairo', sans-serif" }}>
        <div className={`min-h-screen transition-colors duration-700 bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col overflow-x-hidden selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black`}>
          
          <header className="border-b border-[var(--border-color)] flex flex-col lg:flex-row w-full z-50 bg-[var(--bg-color)] sticky top-0">
            <div className="p-8 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] lg:w-1/4">
              <RevealText text="Z-Proximity&#10;Engine" animateOnScroll={false} delay={0.1} textClassName="text-2xl font-black tracking-tighter uppercase leading-[0.9]" />
            </div>
            
            <div className="grow flex flex-col md:flex-row items-center justify-between px-8 py-4 md:py-0 gap-6">
              <nav>
                <RevealGroup animateOnScroll={false} delay={0.3} className="flex gap-10 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <a href="#vision" onClick={(e) => handleScroll(e, '#vision')} className="reveal-item smooth-strike mr-10">01 / Vision</a>
                  <a href="#presets" onClick={(e) => handleScroll(e, '#presets')} className="reveal-item smooth-strike mr-10">02 / Presets</a>
                  <a href="#implementation" onClick={(e) => handleScroll(e, '#implementation')} className="reveal-item smooth-strike">03 / Docs</a>
                  <a href="#gamebox" onClick={(e) => handleScroll(e, '#gamebox')} className="reveal-item smooth-strike mr-10">04 / Gamebox</a>
                </RevealGroup>
              </nav>

              <RevealGroup animateOnScroll={false} delay={0.5} className="flex items-center gap-6">
                <button 
                  onClick={() => setIsDark(!isDark)}
                  className="reveal-item p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors relative w-8 h-8 flex items-center justify-center"
                  aria-label="Toggle theme"
                >
                  <Moon size={18} className="absolute inset-0 m-auto transition-opacity duration-500 opacity-100 dark:opacity-0" />
                  <Sun size={18} className="absolute inset-0 m-auto transition-opacity duration-500 opacity-0 dark:opacity-100" />
                </button>
                <span className="reveal-item text-[10px] font-mono opacity-50 hidden sm:block">v2.5.6 — BETA</span>
                <div className="reveal-item px-5 py-2.5 bg-[var(--text-color)] text-[var(--bg-color)] text-[11px] font-mono flex items-center gap-2">
                  <Terminal size={12} />
                  npm i z-proximity-engine
                </div>
              </RevealGroup>
            </div>
          </header>

          <main className="grow">
            
            <section id="vision" className="relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[var(--border-color)] p-10 flex flex-col justify-between min-h-[500px]">
              <div className='relative z-10'>
                <RevealGroup delay={0.1} duration={1}>
                  <Badge className="reveal-item mb-10">01 / The Vision</Badge>
                </RevealGroup>
                
                {/* Immersive Scroll Velocity Distortion Container */}
                <Proximity
                  mode="scroll"
                  preset="velocitySkew-velocityScale"
                  config={{
                    scroll: {
                      start: "top top",
                      end: "bottom top",
                      scrub: true,
                      velocityMap: {
                        blur: [0, 8],
                        borderRadius: [0, 20]
                      }
                    },
                    velocitySkew: [-15, 15],
                    velocityScale: [0.98, 1.02]
                  }}
                  className="mb-8"
                >
                  <div className="prox-item p-6 md:p-10 border-2 border-[var(--border-color)] rounded-sm bg-black/5 dark:bg-white/5 backdrop-blur-md">
                    <ProximityText 
                      text="Spatial awareness for the modern web."
                      mode="scroll"
                      preset="reveal-opacity"
                      splitBy="letter"
                      textClassName="text-5xl md:text-7xl font-serif text-align-left italic leading-[1.1] tracking-tight origin-left"
                      wordSpacing={0.5}
                      config={{
                        reveal:[150, 0], opacity: [0, 1], duration: 1.2, ease: "spring",
                        scroll: { scrub: false, once: false, start: "appear" }
                      }}
                    />
                  </div>
                </Proximity>

                <RevealText 
                  text="A lightweight GSAP-powered React library that calculates cursor distance, velocity, and angle to drive fluid UI transformations for Hover and Scroll."
                  delay={0.4} duration={1}
                  textClassName="text-sm leading-relaxed mb-10 opacity-70 italic"
                />
                
                {/* Unified Staggered Group-Trigger Grid */}
                <Proximity
                  mode="scroll"
                  preset="reveal-y-opacity"
                  config={{
                    scroll: { triggerMode: "group", start: "top 85%", scrub: false },
                    stagger: 0.15,
                    y: [60, 0],
                    opacity: [0, 1]
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-black/10 dark:border-white/10"
                >
                  <div className="prox-item p-6 border border-[var(--border-color)] bg-black/5 dark:bg-white/5 shadow-md flex justify-between items-end">
                    <Badge>Core Weight</Badge>
                    <span className="text-3xl font-black tabular-nums">10.16KB</span>
                  </div>
                  <div className="prox-item p-6 border border-[var(--border-color)] bg-black/5 dark:bg-white/5 shadow-md flex justify-between items-end">
                    <Badge>Target FPS</Badge>
                    <span className="text-3xl font-black tabular-nums">120+</span>
                  </div>
                  <div className="prox-item p-6 border border-[var(--border-color)] bg-black/5 dark:bg-white/5 shadow-md flex justify-between items-end">
                    <Badge>Load Limit</Badge>
                    <span className="text-3xl font-black tabular-nums">100+ Elements</span>
                  </div>
                </Proximity>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <a href="#implementation" onClick={(e) => handleScroll(e, '#implementation')} className="flex-1">
                  <button className="w-full py-5 bg-[var(--text-color)] text-[var(--bg-color)] text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:opacity-90 transition-all group cursor-pointer border border-[var(--text-color)]">
                    Documentation
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </a>
                <a 
                  href="https://github.com/YoussefZidan-1/ZProximityEngine" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <button className="w-full py-5 border border-[var(--border-color)] text-[var(--text-color)] text-[11px] font-black uppercase tracking-[0.2em] gap-3 flex items-center justify-center hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-all group cursor-pointer">
                    GitHub Repo
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </a>
              </div>
            </section>
            <section ref={horizontalSectionRef} className="border-b border-[var(--border-color)] bg-zinc-950 text-white overflow-hidden h-screen flex flex-col justify-center">
              <div className="px-10 mb-10 shrink-0">
                <Badge className="text-zinc-500 mb-2">GSAP Horizontal Scroll Area</Badge>
                <h3 className="text-3xl font-black italic tracking-tighter">Fluid Parallax Axis X</h3>
              </div>
              <div ref={horizontalWrapperRef} className="flex gap-8 px-10 w-max">
                <Proximity
                  mode="scroll"
                  preset="parallax-scale-velocitySkew"
                  config={{
                    scroll: { 
                      mode: "lens", 
                      lensCenter: [0.5, 0.5], 
                      lensRadius: 0.45, 
                      scrub: true 
                    },
                    parallax: [-40, 40],
                    scale: [0.92, 1.08],
                    velocitySkew: [-12, 12]
                  }}
                  className="flex gap-8"
                >
                  {['FLUIDITY', 'VELOCITY', 'SPATIAL', 'ELEGANCE'].map((word, idx) => (
                    <div key={word} data-speed={1 + idx * 0.2} className="prox-item w-[300px] md:w-[400px] h-[300px] bg-white/5 border border-white/10 p-10 flex flex-col justify-between shadow-2xl rounded-sm">
                      <span className="text-[10px] font-mono text-zinc-500">PROXIMITY AXIS X / 0{idx + 1}</span>
                      <h4 className="text-5xl font-black italic tracking-tighter">{word}</h4>
                    </div>
                  ))}
                </Proximity>
              </div>
            </section>

            {/* Viewport Lens Mode Focus Stack */}
            <section className="border-b border-[var(--border-color)] py-20 px-10 relative">
              <Badge className="mb-4">Viewport Focal Point</Badge>
              <h3 className="text-3xl font-black italic tracking-tighter mb-10">Radial Center Lens</h3>
              
              <Proximity
                mode="scroll"
                preset="scale-glow-brightness-blur"
                config={{
                  scroll: { 
                    mode: "lens", 
                    lensCenter: [0.5, 0.5], 
                    lensRadius: 0.35,
                    start: "top bottom", 
                    end: "bottom top", 
                    scrub: true 
                  },
                  scale: [0.85, 1.15],
                  glow: [0, 25],
                  brightness: [0.6, 1.2],
                  blur: [5, 0]
                }}
                className="flex flex-col gap-4 max-w-3xl mx-auto"
              >
                {[
                  { title: "PERFORMANCE CORE", desc: "Maintains absolute frame consistency even under dense layout calculations." },
                  { title: "ZERO RE-REFRACTS", desc: "Batch mutations and writes run inside dynamic target queues to bypass layout thrashing." },
                  { title: "MODULAR PHYSICS", desc: "Combine presets or utilize raw calculations on calculating callbacks." },
                ].map((item, idx) => (
                  <div key={item.title} className="prox-item border border-[var(--border-color)] bg-[var(--bg-color)] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg rounded-sm">
                    <div>
                      <span className="text-[10px] font-mono opacity-50">LENS ZONE // {idx + 1}</span>
                      <h4 className="text-xl font-bold tracking-tight mt-1">{item.title}</h4>
                    </div>
                    <p className="text-xs opacity-70 max-w-sm">{item.desc}</p>
                  </div>
                ))}
              </Proximity>
            </section>

            {/* LAZY LOADED PRESETS SECTION */}
            <Suspense fallback={<div className="p-20 text-center border-b lg:border-b-0 lg:border-r border-[var(--border-color)] text-[10px] uppercase font-bold tracking-widest opacity-50">Loading Physics Engine...</div>}>
              <PresetsSection />
            </Suspense>

            <section id="implementation" className="p-10 flex flex-col h-full overflow-hidden">
              <Badge className="mb-8">03 / Docs</Badge>
              
              {/* LAZY LOADED DOCUMENTATION COMPONENT */}
              <Suspense fallback={<div className="py-32 text-center text-[10px] uppercase font-bold tracking-widest opacity-50">Loading Documentation Modules...</div>}>
                <Documentation/>
              </Suspense>
              
              <Suspense fallback={<div className="p-20 text-center border-b lg:border-b-0 lg:border-r border-[var(--border-color)] text-[10px] uppercase font-bold tracking-widest opacity-50">Loading Physics Engine...</div>}>
                <Gamebox />
              </Suspense>
            </section>
          </main>

          <footer className="border-t border-[var(--border-color)] py-4 px-10 flex flex-col sm:flex-row justify-between items-center text-[10px] uppercase font-bold tracking-[0.2em] bg-[var(--bg-color)] gap-4">
            <div className="flex gap-10">
              <a href="https://github.com/YoussefZidan-1/ZProximityEngine" className="smooth-underline" target="_blank">GitHub</a>
              <a href="https://www.linkedin.com/in/yousef-zedan-6a275a400/" className="smooth-underline" target="_blank">LinkedIn</a>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>STABLE_RECL_NODE_14</span>
            </div>
          </footer>

        </div>
      </ProximityProvider>
    </ReactLenis>
  );
}