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
  reveal:[110, 0] as[number, number],
  opacity:[0, 1] as [number, number],
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

const CodeBlock = ({ code }: { code: string }) => (
  <div className="bg-black dark:bg-zinc-900 text-gray-300 p-8 rounded-sm font-mono text-[11px] leading-relaxed overflow-x-auto border border-black dark:border-zinc-800 shadow-2xl flex-grow h-full mb-8">
    <div className="flex gap-2 mb-6">
      <div className="w-2 h-2 rounded-full bg-red-400/30"></div>
      <div className="w-2 h-2 rounded-full bg-yellow-400/30"></div>
      <div className="w-2 h-2 rounded-full bg-green-400/30"></div>
    </div>
    <pre className="whitespace-pre-wrap">
      <code>{code}</code>
    </pre>
  </div>
);

// =====================================================================
// MAIN APP
// =====================================================================

export default function App() {
  const[isDark, setIsDark] = useState(true);
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },[isDark]);

  useGSAP(() => {
    // FIX: We use a ResizeObserver on the body so that the exact moment 
    // the Lazy-loaded components finish loading and expand the page, GSAP fixes the physics coordinates
    const resizeObserver = new ResizeObserver(() => {
      ScrollTrigger.refresh();
    });
    
    resizeObserver.observe(document.body);
    
    return () => {
      resizeObserver.disconnect();
    };
  });

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
  },[]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    gsap.to(window, { duration: 1.2, scrollTo: { y: targetId, offsetY: 100 }, ease: "power3.inOut" });
  };

  return (
    <ReactLenis root ref={lenisRef} autoRaf={false} options={{ lerp: 0.1, duration: 1.5 }}>
      <ProximityProvider config={{ defaultFont: "'Bricolage Grotesque', sans-serif" }}>
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
                <span className="reveal-item text-[10px] font-mono opacity-50 hidden sm:block">v2.4.2 — STABLE</span>
                <div className="reveal-item px-5 py-2.5 bg-[var(--text-color)] text-[var(--bg-color)] text-[11px] font-mono flex items-center gap-2">
                  <Terminal size={12} />
                  npm i z-proximity-engine
                </div>
              </RevealGroup>
            </div>
          </header>

          <main className="grow flex flex-col">
            
            <section id="vision" className="relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[var(--border-color)] p-10 flex flex-col justify-between min-h-[500px]">
              <div className='relative z-10'>
                <RevealGroup delay={0.1} duration={1}>
                  <Badge className="reveal-item mb-10">01 / The Vision</Badge>
                </RevealGroup>
                
                <div className="mb-8">
                  {/* FIX: Simplified the hero config to once: true so it doesn't accidentally trigger a reset/leave animation and disappear */}
                  <ProximityText 
                    text="Spatial awareness for the modern web."
                    mode="scroll"
                    preset="reveal-opacity"
                    splitBy="letter"
                    textClassName="text-5xl font-serif text-align-left italic leading-[1.1] tracking-tight origin-left"
                    wordSpacing={0.5}
                    config={{
                      reveal:[150, 0], opacity: [0, 1], duration: 1.2, ease: "spring",
                      scroll: { scrub: false, once: false, start: "appear" }
                    }}
                  />
                </div>

                <RevealText 
                  text="A lightweight GSAP-powered React library that calculates cursor distance, velocity, and angle to drive fluid UI transformations for Hover and Scroll."
                  delay={0.4} duration={1}
                  textClassName="text-sm leading-relaxed mb-10 opacity-70 italic"
                />
                
                <div className="space-y-4 pt-10 border-t border-black/10 dark:border-white/10">
                  <div className="flex justify-between items-end text-right">
                    <Badge>Core Engine Weight</Badge>
                    <RevealGroup delay={0.6} duration={0.8}>
                      <span className="reveal-item text-3xl font-black tabular-nums">2.96KB</span>
                    </RevealGroup>
                  </div>
                  <div className="flex justify-between items-end text-right">
                    <Badge>Target FPS</Badge>
                    <RevealGroup delay={0.8} duration={0.8}>
                      <span className="reveal-item text-3xl font-black tabular-nums">120+</span>
                    </RevealGroup>
                  </div>
                  <div className="flex justify-between items-end text-right">
                    <Badge>Performs well even after many uses</Badge>
                    <RevealGroup delay={0.6} duration={0.8}>
                      <span className="reveal-item text-3xl font-black tabular-nums">100+ Elements</span>
                    </RevealGroup>
                  </div>
                </div>
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