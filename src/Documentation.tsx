import React, { useState, useEffect, useRef } from 'react';
import { Proximity, ProximityText } from './lib';
import { X, RotateCcw, Check, Terminal, Play, BookOpen, Settings2, Copy } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

// =====================================================================
// CONSTANTS & DATA
// =====================================================================

const SECTIONS =[
  { id: 'getting-started', title: '1. Getting Started' },
  { id: 'basics', title: '2. Core Basics' },
  { id: 'props-vs-config', title: '3. Props vs Config Obj' },
  { id: 'playground', title: '4. Interactive Builder' },
  { id: 'advanced-targeting', title: '5. Neighbor & Nearest' },
  { id: 'explicit-global', title: '6. Explicit & Global' },
  { id: 'text-splitting', title: '7. Text Splitting' },
  { id: 'custom-easing', title: '8. Custom Easing' },
  { id: 'scroll-mode', title: '9. Scroll Mode Deep Dive' },
];

const PRESETS = {
  transform:['scale', 'flexScale', 'x', 'y', 'rotate', 'skew'],
  appearance:['opacity', 'blur', 'reveal'],
  physics:['magnetic', 'repel'],
  space:['tilt', 'tiltCard'],
  text:['weight', 'cipher'],
};

const AVAILABLE_EASES =[
  "smooth", "heavy", "sharp", "fluid", "bouncy", "elastic", 
  "jello", "bounce", "swing", "vibrate", "robot", "ghost", 
  "expo", "circus", "glitch", "slowmo", "spring", "heavySpring", 
  "anticipate", "launch", "drift", "whiplash"
];

// =====================================================================
// HELPER COMPONENTS
// =====================================================================

const DocH2 = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <h2 id={id} className="text-2xl md:text-3xl font-black tracking-tighter italic font-serif mt-16 mb-6 scroll-mt-24 pb-2 border-b border-[var(--border-color)]">
    {children}
  </h2>
);

// UPDATED: Higher contrast colors for readability
const DocP = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm leading-relaxed opacity-90 mb-6 font-medium">{children}</p>
);

const CodeSpan = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-[var(--text-color)] text-[var(--bg-color)] px-1.5 py-0.5 rounded-sm font-mono text-xs break-words">{children}</code>
);

// =====================================================================
// STATIC CODE BLOCK WITH COPY
// =====================================================================

const StaticCodeBlock = ({ code }: { code: string }) => {
  const[copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mb-6 w-full">
      <div className="absolute right-3 top-3 z-10">
        <button 
          onClick={handleCopy}
          className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors backdrop-blur-md"
          title="Copy Code"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="bg-black text-gray-300 dark:bg-zinc-900 p-4 md:p-6 pt-10 border border-black/20 dark:border-white/10 text-[10px] md:text-xs font-mono overflow-x-auto leading-relaxed shadow-lg rounded-sm w-full">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// =====================================================================
// LIVE EDITABLE CONFIG BLOCK
// =====================================================================

const LiveConfigEditor = ({ initialConfig, defaultPreset = "scale", viewMode = 'elements' }: { initialConfig: string, defaultPreset?: string, viewMode?: 'elements' | 'text' }) => {
  const[code, setCode] = useState(initialConfig);
  // Initialize state with the parsed initial config to fix the "doesn't work on load" bug
  const[parsedConfig, setParsedConfig] = useState<any>(() => {
    try { return new Function("return " + initialConfig)(); } catch { return {}; }
  });
  const[error, setError] = useState<string | null>(null);
  const[copied, setCopied] = useState(false);
  const[renderKey, setRenderKey] = useState("init");

  useEffect(() => {
    try {
      const parsed = new Function("return " + code)();
      setParsedConfig(parsed);
      setError(null);
      setRenderKey(JSON.stringify(parsed)); 
    } catch (err: any) {
      setError(err.message);
    }
  }, [code]);

  const handleReset = () => setCode(initialConfig);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-[var(--border-color)] flex flex-col lg:flex-row my-8 bg-[var(--bg-color)] shadow-xl w-full">
      
      {/* Editor Side */}
      <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border-color)] min-w-0">
        <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 border-b border-[var(--border-color)]">
          <div className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
            <Terminal size={12} /> config object
          </div>
          <div className="flex gap-4">
            <button onClick={handleCopy} className="text-[10px] uppercase font-bold flex items-center gap-1 hover:opacity-50 transition-opacity">
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />} Copy
            </button>
            <button onClick={handleReset} className="text-[10px] uppercase font-bold flex items-center gap-1 hover:opacity-50 transition-opacity">
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>
        <div className="relative grow min-h-[250px]">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            className="absolute inset-0 w-full h-full p-4 bg-transparent font-mono text-[11px] md:text-xs leading-relaxed outline-none resize-none focus:ring-0 text-[var(--text-color)]"
          />
          {error && (
            <div className="absolute bottom-0 left-0 w-full bg-red-500 text-white text-[10px] p-2 font-mono z-10 shadow-lg">
              ⚠️ Syntax Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Preview Side */}
      <div className="w-full lg:w-1/2 p-6 md:p-10 flex items-center justify-center relative min-h-[300px] mono-grid overflow-hidden">
        <div className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-widest opacity-50 flex items-center gap-2 z-10">
          <Play size={10} /> Live Preview
        </div>
        {!error && (
          <Proximity key={renderKey} preset={defaultPreset as any} {...parsedConfig}>
            {viewMode === 'elements' ? (
               <div className="flex flex-wrap justify-center gap-4">
                 <div className="prox-item w-12 h-12 md:w-16 md:h-16 bg-[var(--text-color)] rounded-sm" />
                 <div className="prox-item w-12 h-12 md:w-16 md:h-16 bg-[var(--text-color)] rounded-full" />
                 <div className="prox-item w-12 h-12 md:w-16 md:h-16 border-2 border-[var(--text-color)] rounded-sm" />
               </div>
            ) : (
               <ProximityText 
                  text="Hover Me"
                  splitBy="letter"
                  preset={defaultPreset as any}
                  textClassName="text-3xl md:text-5xl font-black tracking-tighter"
                  {...parsedConfig}
               />
            )}
          </Proximity>
        )}
      </div>
    </div>
  );
};

// =====================================================================
// MAIN DOCUMENTATION COMPONENT
// =====================================================================

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const[showFloatingBtn, setShowFloatingBtn] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Playground States
  const[activePresets, setActivePresets] = useState<string[]>(['scale', 'blur']);
  const[pgViewMode, setPgViewMode] = useState<'elements'|'text'>('elements');

  // GSAP SCROLL-TRIGGER PINNING
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      if (!containerRef.current || !sidebarRef.current) return;
      
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top+=85", 
        end: "bottom bottom", 
        pin: sidebarRef.current,
        pinSpacing: false, 
        invalidateOnRefresh: true,
      });
    });
    return () => mm.revert();
  }, { scope: containerRef });

  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 500);
    return () => clearTimeout(t);
  },[]);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingBtn(window.scrollY > 200);

      const sections = SECTIONS.map(s => document.getElementById(s.id));
      let current = SECTIONS[0].id;

      sections.forEach(sec => {
        if (sec) {
          if (sec.getBoundingClientRect().top <= window.innerHeight / 3) {
            current = sec.id;
          }
        }
      });
      
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  },[]);

  const scrollToSection = (id: string) => {
    gsap.to(window, { duration: 1.2, scrollTo: { y: `#${id}`, offsetY: 100 }, ease: "power3.inOut" });
    setIsSidebarOpen(false);
  };

  const combinedPreset = activePresets.join('-');

  return (
    <div ref={containerRef} className="flex relative items-start w-full bg-[var(--bg-color)] text-[var(--text-color)] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black border-t border-[var(--border-color)]">
      
      {/* Floating Mobile Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-[var(--text-color)] text-[var(--bg-color)] rounded-full shadow-2xl transition-all duration-500 lg:hidden ${showFloatingBtn && !isSidebarOpen ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}
      >
        <BookOpen size={20} />
      </button>

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside ref={sidebarRef} className={`
        fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[var(--bg-color)] border-r border-[var(--border-color)] overflow-y-auto shrink-0
        transition-transform duration-300 ease-in-out
        lg:absolute lg:top-0 lg:left-0 lg:h-[calc(100vh-85px)] lg:translate-x-0 lg:transition-none
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-6 md:p-8 pb-4 flex justify-between items-center border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)] z-10">
          <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter">Z-Proximity Docs</h1>
          <button className="lg:hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full" onClick={() => setIsSidebarOpen(false)}>
            <X size={20}/>
          </button>
        </div>
        <nav className="p-4 md:p-6 space-y-1">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`w-full text-left px-4 py-3 text-[10px] md:text-[11px] uppercase tracking-widest font-bold transition-all ${
                activeSection === sec.id 
                  ? 'bg-[var(--text-color)] text-[var(--bg-color)]' 
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100'
              }`}
            >
              {sec.title}
            </button>
          ))}
        </nav>
      </aside>

      <div className="hidden lg:block w-72 shrink-0 border-r border-[var(--border-color)]" />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 w-full px-6 py-10 md:px-12 lg:px-16 pb-32 max-w-5xl mx-auto overflow-hidden">
        
        <section id="getting-started">
          <DocH2>1. Getting Started</DocH2>
          <DocP>ZProximity Engine relies on GSAP for its hyper-optimized animation rendering. You'll need to install the engine alongside GSAP.</DocP>
          <StaticCodeBlock code="npm install z-proximity-engine gsap @gsap/react" />
        </section>

        <section id="basics">
          <DocH2>2. Core Basics</DocH2>
          <DocP>Wrap any HTML elements you want to animate inside the &lt;Proximity&gt; component. By default, the engine targets elements with the class .prox-item. Change values in the editor below and watch it update instantly!</DocP>
          <LiveConfigEditor 
            defaultPreset="scale"
            initialConfig={`{\n  reach: 1.5,\n  duration: 0.3,\n  ease: "back.out(1.7)",\n  scale:[1, 1.5]\n}`}
          />
        </section>

        <section id="props-vs-config">
          <DocH2>3. Props vs Config Object</DocH2>
          <DocP>ZProximity is incredibly flexible. You can pass settings as direct props for quick setups, or group them into a single config object for cleaner code.</DocP>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="flex flex-col min-w-0">
              <h4 className="font-bold text-[10px] uppercase mb-3 opacity-70 flex items-center gap-2 tracking-widest"><Check size={14}/> Method 1: Direct Props</h4>
              <StaticCodeBlock code={`<Proximity \n  preset="magnetic"\n  reach={2}\n  ease="elastic"\n>\n  <div className="prox-item">Hover</div>\n</Proximity>`} />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="font-bold text-[10px] uppercase mb-3 opacity-70 flex items-center gap-2 tracking-widest"><Check size={14}/> Method 2: Config Object</h4>
              <StaticCodeBlock code={`const physics = {\n  preset: "magnetic",\n  reach: 2,\n  ease: "elastic"\n};\n\n<Proximity config={physics}>\n  <div className="prox-item">Hover</div>\n</Proximity>`} />
            </div>
          </div>
        </section>

        <section id="playground">
          <DocH2>4. The Preset Builder</DocH2>
          <DocP>ZProximity allows you to chain multiple physics calculations seamlessly using dash-syntax. Try combining them below to see the result live.</DocP>
          
          <div className="border border-[var(--border-color)] bg-[var(--bg-color)] shadow-2xl flex flex-col w-full">
            
            {/* Toolbar */}
            <div className="flex border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5 p-4 justify-between items-center">
              <div className="flex gap-2">
                <button onClick={() => setPgViewMode('elements')} className={`px-3 py-1.5 md:px-4 md:py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors border border-[var(--border-color)] ${pgViewMode === 'elements' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'bg-transparent'}`}>Elements</button>
                <button onClick={() => setPgViewMode('text')} className={`px-3 py-1.5 md:px-4 md:py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors border border-[var(--border-color)] ${pgViewMode === 'text' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'bg-transparent'}`}>Typography</button>
              </div>
              <div className="text-[9px] md:text-[11px] font-mono px-2 py-1 md:px-3 bg-[var(--text-color)] text-[var(--bg-color)] truncate max-w-[150px] md:max-w-xs">
                preset="{combinedPreset || 'none'}"
              </div>
            </div>

            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[var(--border-color)] p-4 md:p-6 space-y-6">
                {Object.entries(PRESETS).map(([category, presets]) => {
                   if (pgViewMode === 'elements' && category === 'text') return null;
                   if (pgViewMode === 'text' && category === 'space') return null;
                   
                   return (
                    <div key={category}>
                      <h4 className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60 mb-3">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {presets.map(p => {
                          const isActive = activePresets.includes(p);
                          return (
                            <button 
                              key={p}
                              onClick={() => {
                                if (isActive) setActivePresets(activePresets.filter(ap => ap !== p));
                                else setActivePresets([...activePresets, p]);
                              }}
                              className={`px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-mono border transition-all ${isActive ? 'border-[var(--text-color)] bg-[var(--text-color)] text-[var(--bg-color)]' : 'border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="w-full md:w-2/3 p-6 md:p-12 flex items-center justify-center mono-grid min-h-[300px] md:min-h-[400px]">
                 <Proximity key={combinedPreset + pgViewMode} preset={combinedPreset as any} reach={1.8}>
                    {pgViewMode === 'elements' ? (
                      <div className="grid grid-cols-2 gap-4 md:gap-6">
                        <div className="prox-item w-16 h-16 md:w-20 md:h-20 bg-[var(--text-color)] flex items-center justify-center text-[var(--bg-color)] font-bold text-xl">1</div>
                        <div className="prox-item w-16 h-16 md:w-20 md:h-20 bg-[var(--text-color)] flex items-center justify-center text-[var(--bg-color)] font-bold text-xl rounded-full">2</div>
                        <div className="prox-item w-16 h-16 md:w-20 md:h-20 border-[3px] border-[var(--text-color)] flex items-center justify-center font-bold text-xl">3</div>
                        <div className="prox-item w-16 h-16 md:w-20 md:h-20 bg-[var(--text-color)] flex items-center justify-center text-[var(--bg-color)] font-bold text-xl rotate-12">4</div>
                      </div>
                    ) : (
                      <ProximityText 
                        text="INTERACTIVE"
                        splitBy="letter"
                        preset={combinedPreset as any}
                        textClassName="text-3xl md:text-5xl lg:text-7xl font-black font-sans tracking-tighter"
                      />
                    )}
                 </Proximity>
              </div>
            </div>
          </div>
        </section>

        <section id="advanced-targeting">
          <DocH2>5. Neighbor vs Nearest Logic</DocH2>
          <DocP>Want to pull the item you are hovering, but push the others away? Use nearestPreset and neighborPreset. This creates a highly organic "dock" or "focus" effect without writing complex layout loops.</DocP>
          <LiveConfigEditor 
            defaultPreset=""
            initialConfig={`{\n  reach: 2,\n  nearestPreset: "scale-magnetic",\n  neighborPreset: "repel-blur",\n  scale:[1, 1.4],\n  blur:[0, 4],\n  magnetic:[0, 0.4],\n  repel:[0, 0.6]\n}`}
          />
        </section>

        <section id="explicit-global">
          <DocH2>6. Boundaries: Explicit & Global</DocH2>
          <DocP>By default, proximity triggers based on mathematical distance. But you can strictly control *when* it listens.</DocP>
          <ul className="space-y-4 my-6">
            <li className="flex items-start gap-4 p-4 border border-[var(--border-color)] bg-black/5 dark:bg-white/5">
              <Settings2 className="shrink-0 mt-1 text-[var(--text-color)]" size={20}/>
              <div>
                <strong className="block font-bold">explicit={`{true}`}</strong>
                <span className="text-sm opacity-80 mt-1 block">The engine will ignore the mouse UNTIL the cursor physically enters the bounding box.</span>
              </div>
            </li>
            <li className="flex items-start gap-4 p-4 border border-[var(--border-color)] bg-black/5 dark:bg-white/5">
              <Settings2 className="shrink-0 mt-1 text-[var(--text-color)]" size={20}/>
              <div>
                <strong className="block font-bold">global={`{true}`}</strong>
                <span className="text-sm opacity-80 mt-1 block">Tracks the mouse across the ENTIRE window, even if the user is miles away.</span>
              </div>
            </li>
          </ul>
        </section>

        <section id="text-splitting">
          <DocH2>7. Text Splitting</DocH2>
          <DocP>The &lt;ProximityText&gt; component does all the heavy lifting of wrapping letters, words, or lines in accessible spans.</DocP>
          <LiveConfigEditor 
            viewMode="text"
            defaultPreset="y-opacity"
            initialConfig={`{\n  reach: 1.5,\n  splitBy: "word",\n  y:[0, -30],\n  opacity:[0.2, 1],\n  ease: "bounce.out"\n}`}
          />
        </section>

        <section id="custom-easing">
          <DocH2>8. Custom Easing</DocH2>
          <DocP>ZProximity features 22 custom-engineered physics eases built specifically for UI motion.</DocP>
          
          <div className="flex flex-wrap gap-2 mb-8 p-4 border border-[var(--border-color)] bg-black/5 dark:bg-white/5">
            {AVAILABLE_EASES.map(ease => (
              <span key={ease} className="text-[10px] font-mono bg-[var(--text-color)] text-[var(--bg-color)] px-1.5 py-0.5 rounded-sm">
                {ease}
              </span>
            ))}
          </div>

          <LiveConfigEditor 
            defaultPreset="x-y"
            initialConfig={`{\n  reach: 2,\n  duration: 0.8,\n  ease: "whiplash",\n  x:[0, 80],\n  y:[0, -40]\n}`}
          />
        </section>

        {/* REAMPED SECTION 9 */}
        <section id="scroll-mode">
          <DocH2>9. Scroll Mode Deep Dive</DocH2>
          <DocP>Scroll Mode ditches mouse tracking. It binds animations to viewport position. The engine automatically calculates scroll velocity, allowing elements to "lean" or "react" to how fast the user is scrolling.</DocP>
          
          <StaticCodeBlock code={`<Proximity\n  mode="scroll"\n  preset="tiltCard-y-opacity"\n  config={{\n    scroll: { start: "top 100%", end: "center 40%", scrub: true },\n    tiltCard: [0, 45], // Reacts to scroll speed!\n    stagger: 0.2\n  }}\n/>`} />
          
          <DocP>
            <strong>🔥 Demo: Velocity & Staggered Entry</strong><br/>
            As you scroll down to see these cards, notice two things:<br/>
            1. <strong>Stagger:</strong> The cards appear one-by-one with a delay.<br/>
            2. <strong>Velocity Leaning:</strong> If you scroll quickly, the cards tilt heavily. If you scroll slowly, the tilt is subtle.
          </DocP>

          <div className="my-12 py-20 px-6 bg-zinc-900 dark:bg-zinc-100 border border-[var(--border-color)] rounded-sm overflow-hidden" style={{ perspective: 1200 }}>
            <Proximity
              mode="scroll"
              preset="tiltCard-y-opacity-scale"
              config={{
                scroll: { start: "top 95%", end: "center 30%", scrub: 0.5, once: false },
                y: [150, 0],
                opacity: [0, 1],
                scale: [0.7, 1],
                tiltCard: [0, 60], // High value to make velocity leaning obvious
                stagger: 0.2 // Distinct staggered entry
              }}
              className="flex flex-col md:flex-row gap-8 justify-center items-center"
            >
              {[1, 2, 3].map((num) => (
                <div key={num} className="prox-item w-full md:w-48 h-64 bg-black dark:bg-white text-white dark:text-black p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.1)] rounded-lg">
                  <span className="text-xs font-black opacity-50">#0{num}</span>
                  <div className="space-y-2">
                    <div className="h-1 w-12 bg-current opacity-30" />
                    <span className="text-3xl font-black italic tracking-tighter block leading-none">
                      {num === 1 ? 'PHYSIC' : num === 2 ? 'SCROLL' : 'STAGGR'}
                    </span>
                  </div>
                </div>
              ))}
            </Proximity>
          </div>

          <DocP>
            <strong>✨ Cinematic Word-by-Word Scroll</strong><br/>
            Below is a typography reveal where every word is tied to the scrollbar.
          </DocP>

          <div className="my-8 p-10 md:p-20 border border-[var(--border-color)] bg-[var(--bg-color)] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 mono-grid" />
            <div className="relative z-10 text-center">
              <ProximityText
                mode="scroll"
                text="The experience of motion is not just about what moves, but how it responds to your rhythm."
                preset="reveal-opacity"
                splitBy="word"
                textClassName="text-2xl md:text-6xl font-black font-serif italic tracking-tight leading-[1.1]"
                config={{
                  reveal:[100, 0],
                  opacity: [0.5, 1],
                  stagger: 0.08,
                  scroll: { start: "top 90%", end: "center 40%", scrub: 1, once: false }
                }}
              />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}