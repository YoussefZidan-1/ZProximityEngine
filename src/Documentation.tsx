import { MousePointer2, Smartphone, Terminal, Move, Maximize, Zap, Sparkles, ArrowLeft } from 'lucide-react';
import { Proximity, ProximityText, ProximityProvider } from './lib';

// ==========================================
// Reusable UI Components for Documentation
// ==========================================
const CodeBlock = ({ code }: { code: string }) => (
  <div className="bg-[#0f0f0f] text-green-400 p-6 rounded-lg font-mono text-[12px] leading-relaxed overflow-x-auto border border-white/10 shadow-inner">
    <pre><code>{code.trim()}</code></pre>
  </div>
);

const FeatureSection = ({ title, description, code, children, icon: Icon }: any) => (
  <section className="mb-24 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
    {/* Left: Info & Code */}
    <div className="flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-4 text-white">
        <div className="p-2 bg-white/10 rounded-md"><Icon size={20} /></div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <p className="text-gray-400 mb-8 text-sm leading-relaxed">{description}</p>
      <CodeBlock code={code} />
    </div>

    {/* Right: Live Interactive Demo */}
    <div className="relative border border-white/10 bg-[#050505] rounded-2xl p-8 min-h-[400px] flex items-center justify-center overflow-hidden group">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      
      <div className="absolute top-4 left-4 flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest z-10">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Live Playground
      </div>
      
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  </section>
);

const Box = ({ children, className = "" }: any) => (
  <div className={`prox-item w-20 h-20 bg-white text-black flex items-center justify-center font-bold rounded-xl shadow-lg cursor-pointer ${className}`}>
    {children}
  </div>
);

// ==========================================
// Main Documentation Page
// ==========================================
export default function Documentation({ onBack }: { onBack: () => void }) {
  return (
    <ProximityProvider config={{ defaultFont: "'JetBrains Mono', monospace" }}>
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black pb-32 font-sans">
        
        {/* Header */}
        <header className="border-b border-white/10 p-10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors border border-white/10"
                aria-label="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter">ZProximity Engine</h1>
                <p className="text-xs text-gray-500 font-mono mt-1">Interactive API Documentation</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs font-mono bg-white/10 px-4 py-2 rounded-full">
              <Terminal size={14} /> npm i z-proximity-engine
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-10 mt-10 space-y-32">

          {/* Feature 1: The Basics */}
          <FeatureSection
            icon={MousePointer2}
            title="1. Core Presets & Chaining"
            description="Chain presets together using dash-syntax to combine effects instantly. The engine automatically handles Euclidean distance calculations and physics easing."
            code={`
<Proximity 
  preset="scale-rotate" 
  reach={1.5} 
  ease="elastic"
>
  <div className="prox-item">Hover Me</div>
</Proximity>
            `}
          >
            <Proximity preset="scale-rotate" reach={1.5} ease="elastic" resetEase="elastic" duration={1.5} resetDuration={1.5} config={{
              rotate: [0, 360]
            }}>
              <Box>Hover!</Box>
            </Proximity>
          </FeatureSection>

          {/* Feature 2: Split Focus Logic */}
          <FeatureSection
            icon={Maximize}
            title="2. Split Focus Logic (The Dock)"
            description="Apply different physics to the element you are targeting vs its surrounding siblings using nearestPreset and neighborPreset."
            code={`
<Proximity 
  selector=".dock-item"
  nearestPreset="scale-y" 
  neighborPreset="repel"
  reach={2}
  config={{ y:[0, -40], scale:[1, 1.5], repel: [0, 0.5] }}
>
  <div className="dock-item">1</div>
  <div className="dock-item">2</div>
  <div className="dock-item">3</div>
</Proximity>
            `}
          >
            <Proximity 
              selector=".dock-item" 
              nearestPreset="scale-y" 
              neighborPreset="repel"
              reach={2}
              config={{ y:[0, -40], scale:[1, 1.5], repel: [0, 0.5] }}
              className="flex gap-4"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="dock-item w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center font-mono">
                  {i}
                </div>
              ))}
            </Proximity>
          </FeatureSection>

          {/* Feature 3: Typographic Engine */}
          <FeatureSection
            icon={Terminal}
            title="3. Typographic Engine & Cipher"
            description="ProximityText splits your string automatically (by letter, word, or line). The 'cipher' preset creates a matrix-style hacker decryption effect."
            code={`
<ProximityText 
  text="CLASSIFIED DATA" 
  preset="cipher-scale-weight" 
  splitBy="letter"
  reach={2}
  config={{ 
    cipher:[0, 1], // Scrambled -> Clear
    weight:[100, 900]
  }} 
/>
            `}
          >
            <ProximityText 
              text="CLASSIFIED DATA" 
              preset="cipher-scale-weight" 
              splitBy="letter"
              reach={2}
              textClassName="text-3xl md:text-5xl font-mono text-green-400"
              config={{ cipher: [0, 1], weight:[100, 900] }} 
            />
          </FeatureSection>

          {/* Feature 4: Micro-Timeline Overrides */}
          <FeatureSection
            icon={Zap}
            title="4. Timeline Overrides"
            description="Don't want all properties animating at the same speed? Use the timeline object to give individual properties specific durations, delays, or eases."
            code={`
<Proximity 
  preset="blur-scale"
  config={{
    timeline: {
      blur: { duration: 0.1, ease: "sharp" }, // Snaps instantly
      scale: { duration: 1.5, ease: "elastic" } // Bounces slowly
    }
  }}
>
  <div className="prox-item">Micro-Timing</div>
</Proximity>
            `}
          >
            <Proximity 
              preset="blur-scale" 
              reach={1.5}
              config={{
                timeline: {
                  blur: { duration: 0.1, ease: "sharp" },
                  scale: { duration: 1.5, ease: "elastic" }
                }
              }}
            >
              <Box className="w-32 h-32 rounded-full !bg-blue-500 !text-white text-xs">Different Eases</Box>
            </Proximity>
          </FeatureSection>

          {/* Feature 5: Scroll Mode */}
          <FeatureSection
            icon={Move}
            title="5. Scroll Driven Animations"
            description="Switch mode='scroll' to attach proximity math to the viewport scrollbar instead of the mouse. Perfect for organic reveals."
            code={`
<ProximityText 
  mode="scroll"
  preset="reveal-blur-opacity"
  splitBy="word"
  text="Reacts to the container's scrollbar."
  config={{
    scroll: {
      scroller: ".no-scrollbar",
      start: "top 80%",
      once: false,
      scrub: true,
      stagger: 0.1
    }
  }}
/>
            `}
          >
            <div className="h-[200px] w-full overflow-y-auto border border-white/20 p-8 rounded-lg relative no-scrollbar">
              <div className="h-[300px] flex items-center justify-center opacity-30 text-xs font-mono">Scroll Down Slowly ↓</div>
              <ProximityText 
                mode="scroll"
                preset="reveal-blur-opacity"
                splitBy="word"
                text="This text reacts to the container's scrollbar."
                textClassName="text-2xl font-serif italic"
                config={{
                  scroll: {
                    scroller: ".no-scrollbar", 
                    start: "top 80%",
                    once: false,
                    scrub: true,
                    stagger: 0.1
                  }
                }}
              />
              <div className="h-[300px]"></div>
            </div>
          </FeatureSection>

          {/* Feature 6: Custom Physics Hook */}
          <FeatureSection
            icon={Sparkles}
            title="6. Custom Physics (onCalculate)"
            description="The Escape Hatch. Intercept the proximity math frame-by-frame and inject your own custom GSAP properties."
            code={`
<Proximity
  reach={2}
  onCalculate={(intensity, distance, dx, dy) => ({
    x: dx * 0.1, 
    y: dy * 0.1,
    rotate: intensity * 180,
    backgroundColor: \`rgba(\${intensity * 255}, 100, 255, 1)\`
  })}
>
  <div className="prox-item">Custom</div>
</Proximity>
            `}
          >
            <Proximity
              reach={2}
              onCalculate={(intensity, distance, dx, dy) => ({
                x: dx * 0.1,
                y: dy * 0.1,
                rotate: intensity * 180,
                backgroundColor: `rgba(${intensity * 255}, 100, 255, 1)`,
                borderRadius: `${intensity * 50}%`
              })}
            >
              <Box className="w-24 h-24 !bg-zinc-800 !text-white !border-2 !border-white/20 transition-colors">Hook</Box>
            </Proximity>
          </FeatureSection>

          {/* Feature 7: Constraints */}
          <FeatureSection
            icon={Smartphone}
            title="7. Constraints: Global vs Explicit"
            description="By default, effects run when you hover the container. Use explicit={true} to force the mouse to physically touch the item. Use global={true} to track the mouse everywhere on the page."
            code={`
{/* Will only react if mouse is EXACTLY on it */}
<Proximity preset="scale" explicit={true}>
  <div className="prox-item" />
</Proximity>

{/* Will follow mouse even if cursor is off-screen */}
<Proximity preset="tiltCard" global={true}>
  <div className="prox-item" />
</Proximity>
            `}
          >
            <div className="flex gap-10">
              <div className="text-center">
                <Proximity preset="magnetic-scale" explicit={true} reach={2}>
                  <Box className="!bg-red-500 !text-white text-xs text-center p-2 mb-2">Explicit (Strict)</Box>
                </Proximity>
                <span className="text-[10px] text-gray-500">Touch to activate</span>
              </div>

              <div className="text-center">
                <Proximity preset="tiltCard-scale" global={true} reach={5} config={{ tiltCard: [0, 40] }}>
                  <Box className="!bg-purple-500 !text-white text-xs text-center p-2 mb-2">Global (Always)</Box>
                </Proximity>
                <span className="text-[10px] text-gray-500">Always watching</span>
              </div>
            </div>
          </FeatureSection>

        </main>
      </div>
    </ProximityProvider>
  );
}