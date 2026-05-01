import React, { useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { 
  ArrowRight, 
  Terminal, 
  Layers,
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react';
import { Proximity, ProximityText, ProximityProvider } from './lib';
import TextReveal from './components/TextReveal';

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`text-[10px] uppercase font-bold tracking-[0.2em] block ${className}`}>
    {children}
  </span>
);

const PresetCard = ({ 
  preset, 
  title, 
  description, 
  config = {},
  viewMode = 'text',
  splitMode = 'letter'
}: { 
  preset: string, 
  title: string, 
  description: string, 
  config?: any,
  viewMode?: 'text' | 'elements',
  splitMode?: 'letter' | 'word',
}) => (
  <Proximity 
    preset={preset as any}
    reach={0.8}
    className="group relative bg-[var(--bg-color)] border border-[var(--border-color)] p-8 flex flex-col items-center justify-center gap-6 overflow-hidden min-h-[320px]"
    {...config}
  >
    <div className="relative z-10 flex flex-col items-center text-center w-full">
      <div className="h-28 flex items-center justify-center mb-6 w-full">
        {viewMode === 'text' ? (
          <ProximityText 
             text={preset === 'cipher' ? 'Scramble' : preset.toUpperCase()}
             splitBy={splitMode}
             preset={preset as any}
             fontFamily="'Source Serif 4', serif"
             style={{ fontStyle: 'italic' }}
             textClassName="text-3xl font-black font-serif italic tracking-tighter"
             {...config}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
             <div className="prox-item w-8 h-8 bg-[var(--text-color)] rounded-sm"></div>
             <div className="prox-item w-8 h-8 bg-[var(--text-color)] rounded-full"></div>
             <div className="prox-item w-8 h-8 border-2 border-[var(--text-color)] rounded-sm"></div>
             <div className="prox-item w-8 h-8 bg-[var(--text-color)] rotate-45"></div>
          </div>
        )}
      </div>
      <Badge className="opacity-40 mb-2">{title}</Badge>
      <p className="text-[11px] uppercase tracking-tighter max-w-[200px] text-gray-400 dark:text-gray-500">{description}</p>
    </div>
  </Proximity>
);

const CodeBlock = ({ code }: { code: string }) => (
  <div className="bg-black dark:bg-zinc-900 text-gray-400 p-8 rounded-sm font-mono text-[11px] leading-relaxed overflow-x-auto border border-black dark:border-zinc-800 shadow-2xl flex-grow h-full mb-8">
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

export default function App() {
  const [activeTab, setActiveTab] = useState('presets');
  const [isDark, setIsDark] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'elements'>('text');
  const [splitMode, setSplitMode] = useState<'letter' | 'word'>('letter');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useGSAP(() => {
    ScrollTrigger.refresh();
  });

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    gsap.to(window, {
      duration: 1.2,
      scrollTo: {
        y: targetId,
        offsetY: 100
      },
      ease: "power3.inOut"
    });
  };

  return (
    <ProximityProvider config={{ defaultFont: "'Bricolage Grotesque', sans-serif" }}>
      <div className={`min-h-screen transition-colors duration-700 bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col overflow-x-hidden selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black`}>
        
        {/* Header Section */}
        <header className="border-b border-[var(--border-color)] flex flex-col lg:flex-row w-full z-50 bg-[var(--bg-color)] sticky top-0">
          <div className="p-8 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] lg:w-1/4">
            <TextReveal animateOnScroll={false} delay={0.1}>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-[0.9]">
                Z-Proximity<br/>Engine
              </h1>
            </TextReveal>
          </div>
          <div className="grow flex flex-col md:flex-row items-center justify-between px-8 py-4 md:py-0 gap-6">
            <nav className="flex gap-10 text-[10px] font-bold uppercase tracking-[0.2em]">
              <TextReveal animateOnScroll={false} delay={0.3} stagger={0.1}>
                <a href="#vision" onClick={(e) => handleScroll(e, '#vision')} className="smooth-strike mr-10">01 / Vision</a>
                <a href="#presets" onClick={(e) => handleScroll(e, '#presets')} className="smooth-strike mr-10">02 / Presets</a>
                <a href="#implementation" onClick={(e) => handleScroll(e, '#implementation')} className="smooth-strike">03 / Docs</a>
              </TextReveal>
            </nav>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsDark(!isDark)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <TextReveal animateOnScroll={false} delay={0.5}>
                <span className="text-[10px] font-mono opacity-50 hidden sm:block">v2.0.0 — BUILD STABLE</span>
              </TextReveal>
              <TextReveal animateOnScroll={false} delay={0.6}>
                <div className="px-5 py-2.5 bg-[var(--text-color)] text-[var(--bg-color)] text-[11px] font-mono flex items-center gap-2">
                  <Terminal size={12} />
                  npm i z-proximity-engine
                </div>
              </TextReveal>
            </div>
          </div>
        </header>

        {/* Main Grid Content Area */}
        <main className="grow flex flex-col">
          
          {/* Column 1: Manifesto & Hero Intro */}
          <section id="vision" className="border-b lg:border-b-0 lg:border-r border-[var(--border-color)] p-10 flex flex-col justify-between min-h-[500px]">
            <div>
              <TextReveal delay={0.1} duration={1}>
                <Badge className="mb-10 text-gray-400 dark:text-gray-500">01 / The Vision</Badge>
              </TextReveal>
              <div className="mb-8">
                <ProximityText 
                    text="Spatial awareness for the modern web."
                    mode="scroll"
                    preset="reveal-opacity"
                    splitBy="letter"
                    textClassName="text-5xl font-serif text-align-left italic leading-[1.1] tracking-tight origin-left"
                    wordSpacing={0.5}
                    config={{
                      reveal: [150, 0],
                      duration: 1.2,
                      resetDuration: 1.2,
                      ease: "spring",
                      resetEase: "spring",
                      scroll: {
                        scrub: false,
                        once: false,
                        start: "appear",
                        end: "top 30%",
                      }
                    }}
                  />
              </div>
              <TextReveal delay={0.6} duration={1}>
                <p className="text-sm leading-relaxed mb-10 text-gray-600 dark:text-gray-400 italic">
                  A lightweight GSAP-powered React library that calculates cursor distance, velocity, and angle to drive fluid UI transformations.
                </p>
              </TextReveal>
              
              <div className="space-y-4 pt-10 border-t border-black/10 dark:border-white/10">
                <div className="flex justify-between items-end text-right">
                  <Badge>Core Engine Weight</Badge>
                  <TextReveal delay={0.8} stagger={0.05} duration={0.8}>
                    <span className="text-3xl font-black tabular-nums">2.96KB</span>
                  </TextReveal>
                </div>
                <div className="flex justify-between items-end text-right">
                  <Badge>Target FPS</Badge>
                  <TextReveal delay={1} stagger={0.05} duration={0.8}>
                    <span className="text-3xl font-black tabular-nums">120+</span>
                  </TextReveal>
                </div>
              </div>
            </div>

            <div className="mt-20">
              <button className="w-full py-5 bg-[var(--text-color)] text-[var(--bg-color)] text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:invert transition-all group">
                Documentation
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>

          {/* Column 2: Presets & Interaction */}
          <section id="presets" className="border-b lg:border-b-0 lg:border-r border-[var(--border-color)] flex flex-col">
            <div className="p-10 border-b border-[var(--border-color)]">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                  <Badge className="mb-6">02 / Interaction Presets</Badge>
                  <TextReveal>
                    <h3 className="text-2xl font-black font-sans italic tracking-tighter">Physics Models</h3>
                  </TextReveal>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex border border-[var(--border-color)] overflow-hidden">
                    <button 
                      onClick={() => setViewMode('text')}
                      className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${viewMode === 'text' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5'}`}
                    >
                      Text
                    </button>
                    <button 
                      onClick={() => setViewMode('elements')}
                      className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border-l border-[var(--border-color)] transition-all ${viewMode === 'elements' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5'}`}
                    >
                      Elements
                    </button>
                  </div>

                  <div className={`flex border border-[var(--border-color)] overflow-hidden transition-opacity duration-300 ${viewMode === 'elements' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <button 
                      onClick={() => setSplitMode('letter')}
                      className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${splitMode === 'letter' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5'}`}
                    >
                      Letter
                    </button>
                    <button 
                      onClick={() => setSplitMode('word')}
                      className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border-l border-[var(--border-color)] transition-all ${splitMode === 'word' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5'}`}
                    >
                      Word
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-10">Hover elements below to simulate spatial reaction.</p>
              
              <div className="grid grid-cols-2 gap-px bg-[var(--border-color)] border border-[var(--border-color)] overflow-hidden shadow-2xl">
                <PresetCard 
                  preset="scale" 
                  title="Fluid Scale" 
                  description="Size adjustment based on pointer Euclidean distance."
                  viewMode={viewMode}
                  splitMode={splitMode}
                />
                <PresetCard 
                  preset="blur" 
                  title="Deep Blur" 
                  description="Gaussian focus shift driving depth-of-field effects."
                  config={{ blur: [12, 0] }}
                  viewMode={viewMode}
                  splitMode={splitMode}
                />
                <PresetCard 
                  preset="magnetic" 
                  title="Magnetic" 
                  description="Inverse square attraction to pointer origin."
                  config={{ magnetic: [0, 0.4], reach: 1.5 }}
                  viewMode={viewMode}
                  splitMode={splitMode}
                />
                <PresetCard 
                  preset="tilt" 
                  title="3D Tilt" 
                  description="Quaternion-based rotation on the local X/Y axes."
                  config={{ tilt: [0, 40] }}
                  viewMode={viewMode}
                  splitMode={splitMode}
                />
                <PresetCard 
                  preset="tiltCard" 
                  title="Tilt Card" 
                  description="Perspective transform relative to element center."
                  config={{ tiltCard: [0, 20] }}
                  viewMode={viewMode}
                  splitMode={splitMode}
                />
                {viewMode === 'text' && (
                  <>
                    <PresetCard 
                      preset="cipher" 
                      title="Cipher" 
                      description="Dynamic text decryption as cursor enters reach."
                      config={{ cipher: [0, 1] }}
                      viewMode={viewMode}
                      splitMode={splitMode}
                    />
                    <PresetCard 
                      preset="weight" 
                      title="Weight" 
                      description="Variable font-weight modulation from Thin to Black."
                      config={{ weight: [100, 900] }}
                      viewMode={viewMode}
                      splitMode={splitMode}
                    />
                  </>
                )}
                <PresetCard 
                  preset="x" 
                  title="Horizontal" 
                  description="Linear X-axis translation based on proximity."
                  config={{ x: [0, 50] }}
                  viewMode={viewMode}
                  splitMode={splitMode}
                />
                <PresetCard 
                  preset="y" 
                  title="Vertical" 
                  description="Linear Y-axis translation based on proximity."
                  config={{ y: [0, -50] }}
                  viewMode={viewMode}
                  splitMode={splitMode}
                />
                <PresetCard 
                  preset="repel" 
                  title="Repel" 
                  description="Active avoidance physics pushing away from pointer."
                  config={{ repel: [0, 0.6] }}
                  viewMode={viewMode}
                  splitMode={splitMode}
                />
                <PresetCard 
                  preset="opacity" 
                  title="Opacity" 
                  description="Visibility modulation for ghosting and focus effects."
                  config={{ opacity: [0.1, 1] }}
                  viewMode={viewMode}
                  splitMode={splitMode}
                />
                <PresetCard 
                  preset="reveal" 
                  title="Hover Reveal" 
                  description="Starts hidden. Slides up and fades in seamlessly as the cursor approaches."
                  viewMode={viewMode}
                  splitMode={splitMode}
                                />
              </div>
            </div>
            
            <div className="p-10 flex-grow mono-grid">
              <Badge className="mb-6 opacity-50">Custom Hooks</Badge>
              <TextReveal>
                <h4 className="text-sm font-bold uppercase mb-4 tracking-[0.1em]">Technical Utility</h4>
              </TextReveal>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                Custom <code className="bg-[var(--text-color)] text-[var(--bg-color)] px-1.5 py-0.5 rounded-sm font-mono text-xs">onCalculate</code> hooks allow engineers to inject complex physics—spring dynamics, flocking behaviors, or path-based attractions—directly into the component's render cycle.
              </p>

              <div className="mt-10 p-8 border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm relative overflow-hidden group">
                 <Proximity 
                    onCalculate={(intensity) => ({
                      scale: 1 + intensity * 0.05,
                      rotate: intensity * 2,
                      filter: `blur(${10 - intensity * 10}px)`
                    })}
                    reach={1.2}
                    className="flex flex-col items-center justify-center gap-4 py-8"
                  >
                    <div className="prox-item text-4xl font-serif italic font-bold">Spatial Playground</div>
                    <div className="w-1/2 h-[1px] bg-black/20 dark:bg-white/20"></div>
                    <Badge className="text-gray-400 dark:text-gray-500">Move pointer to focus</Badge>
                  </Proximity>
              </div>
            </div>
          </section>

          {/* Column 3: Implementation & Specs */}
          <section id="implementation" className="p-10 flex flex-col h-full overflow-hidden">
            <TextReveal delay={0.4}>
              <Badge className="mb-8">03 / Implementation</Badge>
            </TextReveal>
            
            <div className="grow flex flex-col">
              <CodeBlock code={`import { Proximity } from 'z-proximity-engine';\n\n// Basic usage\n<Proximity\n  preset="magnetic-scale"\n  reach={1.5}\n  ease="elastic"\n/>\n\n// Custom Physics\n<Proximity\n  onCalculate={(intensity, dist) => ({\n    filter: \`blur(\${intensity * 10}px)\`,\n    y: intensity * -40\n  })}\n>\n  Hover me\n</Proximity>`} />
              
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8 border-t border-[var(--border-color)] pt-8">
                  <div className="space-y-2">
                    <Badge>License</Badge>
                    <span className="text-xs font-mono">MIT / 2026</span>
                  </div>
                  <div className="space-y-2">
                    <Badge>Stack</Badge>
                    <span className="text-xs font-mono uppercase">GSAP / React 19</span>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck size={20} className="text-[var(--text-color)]" />
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.2em]">All Systems Operational</h5>
                  </div>
                  <div className="flex justify-between items-center bg-[var(--bg-color)] border border-[var(--border-color)] p-4 font-mono text-[11px]">
                    <span className="text-gray-400 dark:text-gray-500">$ npm i z-proximity-engine</span>
                    <button className="hover:scale-110 active:scale-95 transition-transform"><Layers size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Global Performance Bar */}
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
  );
}

