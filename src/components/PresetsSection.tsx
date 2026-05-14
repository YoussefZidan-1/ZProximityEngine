import React, { useState } from 'react';
import { Proximity, ProximityText } from '../lib';

const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`text-[10px] uppercase font-bold tracking-[0.2em] block ${className}`}>
    {children}
  </span>
);

const PresetCard = ({ 
  preset, title, description, config = {}, viewMode = 'text', splitMode = 'letter'
}: { 
  preset: string, title: string, description: string, config?: any, viewMode?: 'text' | 'elements', splitMode?: 'letter' | 'word'
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
             textClassName="text-3xl font-normal font-serif italic tracking-widest"
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
      <Badge className="opacity-70 mb-2">{title}</Badge>
      <p className="text-[11px] uppercase tracking-tighter max-w-[200px] opacity-80">{description}</p>
    </div>
  </Proximity>
);

export default function PresetsSection() {
  const [viewMode, setViewMode] = useState<'text' | 'elements'>('text');
  const [splitMode, setSplitMode] = useState<'letter' | 'word'>('letter');

  return (
    <section id="presets" className="border-b lg:border-b-0 lg:border-r border-[var(--border-color)] flex flex-col">
      <div className="p-10 border-b border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Badge className="mb-6">02 / Interaction Presets</Badge>
            <h3 className="text-2xl font-black font-sans italic tracking-tighter">Physics Models</h3>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex border border-[var(--border-color)] overflow-hidden">
              <button onClick={() => setViewMode('text')} className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${viewMode === 'text' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>Text</button>
              <button onClick={() => setViewMode('elements')} className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border-l border-[var(--border-color)] transition-all ${viewMode === 'elements' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>Elements</button>
            </div>

            <div className={`flex border border-[var(--border-color)] overflow-hidden transition-opacity duration-300 ${viewMode === 'elements' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <button onClick={() => setSplitMode('letter')} className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${splitMode === 'letter' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>Letter</button>
              <button onClick={() => setSplitMode('word')} className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border-l border-[var(--border-color)] transition-all ${splitMode === 'word' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>Word</button>
            </div>
          </div>
        </div>

        <p className="text-[11px] opacity-80 uppercase tracking-widest mb-10">Hover elements below to simulate spatial reaction.</p>
        
        <div className="grid grid-cols-2 gap-px bg-[var(--border-color)] border border-[var(--border-color)] overflow-hidden shadow-2xl">
          <PresetCard preset={viewMode === 'elements' ? 'flexScale' : 'scale'} title="Fluid Scale" description="Size adjustment based on pointer Euclidean distance." viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="blur" title="Deep Blur" description="Gaussian focus shift driving depth-of-field effects." config={{ blur:[12, 0] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="magnetic" title="Magnetic" description="Inverse square attraction to pointer origin." config={{ magnetic:[0, 0.4], reach: 1.5 }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="tilt" title="3D Tilt" description="Quaternion-based rotation on the local X/Y axes." config={{ tilt: [0, 40] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="tiltCard" title="Tilt Card" description="Perspective transform relative to element center." config={{ tiltCard: [0, 20] }} viewMode={viewMode} splitMode={splitMode} />
          
          <PresetCard preset="rotate" title="Rotation" description="Angular spin based on interaction distance." config={{ rotate: viewMode === 'elements' ?[0, 360] :[-90, 0] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="skew" title="Skew Matrix" description="Shear transforms along the X/Y axes." config={{ skew: viewMode === 'elements' ?[0, 360] : [90, 0] }} viewMode={viewMode} splitMode={splitMode} />

          {viewMode === 'text' && (
            <>
              <PresetCard preset="cipher" title="Cipher" description="Dynamic text decryption as cursor enters reach." config={{ cipher:[0, 1] }} viewMode={viewMode} splitMode={splitMode} />
              <PresetCard preset="weight" title="Weight" description="Variable font-weight modulation from Thin to Black." config={{ weight:[100, 900] }} viewMode={viewMode} splitMode={splitMode} />
              <PresetCard preset="letterSpacing" title="Letter Spacing" description="Adjusts text tracking width dynamically." config={{ letterSpacing: [-0.05, 0.3] }} viewMode={viewMode} splitMode={splitMode} />
            </>
          )}

          {viewMode === 'elements' && (
            <PresetCard preset="borderRadius" title="Border Radius" description="Morphs corners from square to round seamlessly." config={{ borderRadius: [0, 50] }} viewMode={viewMode} splitMode={splitMode} />
          )}

          <PresetCard preset="x" title="Horizontal" description="Linear X-axis translation based on proximity." config={{ x: [0, 50] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="y" title="Vertical" description="Linear Y-axis translation based on proximity." config={{ y: [0, -50] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="repel" title="Repel" description="Active avoidance physics pushing away from pointer." config={{ repel: [0, 0.4] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="opacity" title="Opacity" description="Visibility modulation for ghosting and focus effects." config={{ opacity:[0.1, 1] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="reveal" title="Hover Reveal" description="Starts hidden. Slides up and fades in seamlessly as the cursor approaches." viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="glow" title="Drop Glow" description="Dynamic shadow spread driven by proximity." config={{ glow: [0, 30] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="brightness" title="Brightness" description="Modulates CSS brightness filter." config={{ brightness: [0.5, 1.5] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="contrast" title="Contrast" description="Sharpens and deepens contrast." config={{ contrast: [0.5, 2] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="grayScale" title="Grayscale" description="Fades to black & white or vibrant color." config={{ grayScale: [1, 0] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="color" title="Color Shift" description="Interpolates text color dynamically." config={{ color: ["var(--text-color)", "#3b82f6"] }} viewMode={viewMode} splitMode={splitMode} />
          <PresetCard preset="background" title="Bg Morph" description="Shifts element background color." config={{ background: ["transparent", "rgba(59, 130, 246, 0.3)"] }} viewMode={viewMode} splitMode={splitMode} />
        </div>
      </div>
      
      <div className="p-10 flex-grow mono-grid">
        <Badge className="mb-6 opacity-70">Custom Hooks</Badge>
        <h4 className="text-sm font-bold uppercase mb-4 tracking-[0.1em]">Technical Utility</h4>
        <p className="text-sm leading-relaxed opacity-90">
          Custom <code className="bg-[var(--text-color)] text-[var(--bg-color)] px-1.5 py-0.5 rounded-sm font-mono text-xs">onCalculate</code> hooks allow engineers to inject complex physics—spring dynamics, flocking behaviors, or path-based attractions—directly into the component's render cycle.
        </p>

        <div className="mt-10 p-8 border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm relative overflow-hidden group shadow-2xl">
           <Proximity 
              onCalculate={(intensity) => ({
                scale: 1 + intensity * 0.05,
                rotate: intensity * 2,
                filter: `blur(${10 - intensity * 10}px)`
            })}
            onReset={() => ({
              rotate: 0,
              filter: `blur(0px)`
              })}
              reach={1.2}
              className="flex flex-col items-center justify-center gap-4 py-8"
            >
              <div className="prox-item text-4xl font-serif italic font-bold">Spatial Playground</div>
              <div className="w-1/2 h-[1px] bg-black/30 dark:bg-white/30"></div>
              <Badge className="opacity-90">Move pointer to focus</Badge>
            </Proximity>
        </div>
      </div>
    </section>
  );
}