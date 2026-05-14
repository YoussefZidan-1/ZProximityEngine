import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Proximity, ProximityText } from './lib';
import {
  X, RotateCcw, Check, Terminal, Play, BookOpen, Copy, Eye,
  Zap, MousePointer, Layers, Cpu, Sparkles, AlertTriangle, Heart
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const SECTIONS = [
  { id: 'mental-model',     icon: '🧠', title: 'The Mental Model' },
  { id: 'installation',     icon: '📦', title: 'Installation' },
  { id: 'your-first-effect',icon: '⚡', title: 'Your First Effect' },
  { id: 'reach-falloff',    icon: '📡', title: 'Reach & Falloff' },
  { id: 'preset-chaining',  icon: '🔗', title: 'Preset Chaining' },
  { id: 'styling-aesthetics',icon: '✨', title: 'Styling & Aesthetics' },
  { id: 'common-mistakes',  icon: '⚠️',  title: 'Common Mistakes' },
  { id: 'text-magic',       icon: '✍️',  title: 'Text Magic' },
  { id: 'neighbor-nearest', icon: '🎯', title: 'Neighbor vs Nearest' },
  { id: 'scroll-mode',      icon: '📜', title: 'Scroll Mode' },
  { id: 'custom-physics',   icon: '🔬', title: 'Custom Physics' },
  { id: 'performance',      icon: '🚀', title: 'Performance' },
  { id: 'api-reference',    icon: '📖', title: 'API Reference' },
];

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border border-[var(--border-color)] opacity-80">
    {children}
  </span>
);

const Callout = ({
  type = 'info',
  icon,
  children,
}: {
  type?: 'info' | 'warn' | 'tip' | 'danger';
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const colors: Record<string, string> = {
    info:   'border-blue-600! bg-blue-50! text-blue-950! dark:bg-blue-950/30! dark:text-blue-100!',
    warn:   'border-yellow-600! bg-yellow-50! text-yellow-950! dark:bg-yellow-950/30! dark:text-yellow-100!',
    tip:    'border-emerald-600! bg-emerald-50! text-emerald-950! dark:bg-emerald-950/30! dark:text-emerald-100!',
    danger: 'border-red-600! bg-red-50! text-red-950! dark:bg-red-950/30! dark:text-red-100!',
  };
  return (
    <div className={`my-6 border-l-4 p-4 text-sm leading-relaxed ${colors[type]} opacity-100`}>
      <div className="flex gap-3">
        {icon && <span className="shrink-0 mt-0.5 opacity-100">{icon}</span>}
        <div className='opacity-100'>{children}</div>
      </div>
    </div>
  );
};

const DocH2 = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <h2
    id={id}
    className="text-2xl md:text-3xl font-black tracking-tighter italic font-serif mt-16 mb-2 scroll-mt-24 flex items-center gap-3"
  >
    {children}
  </h2>
);

const DocH3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-black tracking-tight uppercase mt-10 mb-4 opacity-90">
    {children}
  </h3>
);

const DocP = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm leading-relaxed mb-4 opacity-90">{children}</p>
);

const Mono = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-[var(--text-color)] text-[var(--bg-color)] px-1.5 py-0.5 font-mono text-xs rounded-sm break-words">
    {children}
  </code>
);

const CodeBlock = ({ code, label }: { code: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group my-6 w-full">
      {label && (
        <div className="flex items-center gap-2 bg-zinc-800 text-zinc-300 text-[10px] font-mono px-4 py-2 border-b border-black/20 dark:border-white/10 uppercase tracking-widest">
          <Terminal size={10} />
          {label}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 z-10 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
        title="Copy"
      >
        {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
      </button>
      <pre className="bg-black dark:bg-zinc-950 text-gray-300 p-5 pt-4 text-[11px] md:text-xs font-mono overflow-x-auto leading-relaxed shadow-lg w-full border border-black/20 dark:border-white/10">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const LiveEditor = ({
  initialConfig,
  preset = 'scale',
  mode = 'elements',
  height = 300,
  label = 'Try it — edit the config',
}: {
  initialConfig: string;
  preset?: string;
  mode?: 'elements' | 'text' | 'text-word';
  height?: number;
  label?: string;
}) => {
  const [code, setCode] = useState(initialConfig);
  const [parsed, setParsed] = useState<Record<string, unknown>>(() => {
    try { return new Function('return ' + initialConfig)(); } catch { return {}; }
  });
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState('init');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const p = new Function('return ' + code)();
      setParsed(p);
      setError(null);
      setRenderKey(code + Date.now());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePreset = (parsed as Record<string, unknown>).preset as string | undefined ?? preset;

  return (
    <div className="border border-[var(--border-color)] my-8 shadow-2xl">
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-2.5 text-zinc-300 text-[10px] font-mono uppercase tracking-widest border-b border-black/20 dark:border-white/10">
        <span className="flex items-center gap-2"><Terminal size={11} /> {label}</span>
        <div className="flex gap-4">
          <button onClick={handleCopy} className="hover:text-white transition-colors flex items-center gap-1">
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={() => setCode(initialConfig)} className="hover:text-white transition-colors flex items-center gap-1">
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-1/2 relative border-b lg:border-b-0 lg:border-r border-[var(--border-color)]">
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="w-full bg-zinc-950 text-gray-200 p-4 font-mono text-xs leading-relaxed outline-none resize-none"
            style={{ minHeight: height }}
          />
          {error && (
            <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-[10px] p-2 font-mono font-bold">
              ⚠ {error}
            </div>
          )}
        </div>

        <div
          className="lg:w-1/2 mono-grid flex items-center justify-center relative overflow-hidden bg-[var(--bg-color)]"
          style={{ minHeight: height }}
        >
          <div className="absolute top-2 right-3 text-[9px] uppercase font-bold tracking-widest opacity-60 flex items-center gap-1">
            <Play size={9} /> Live
          </div>
          {!error && (
            <Proximity key={renderKey} preset={activePreset as string} {...parsed}>
              {mode === 'elements' && (
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="prox-item w-12 h-12 bg-[var(--text-color)] rounded-sm" />
                  <div className="prox-item w-12 h-12 bg-[var(--text-color)] rounded-full" />
                  <div className="prox-item w-12 h-12 border-2 border-[var(--text-color)] rounded-sm" />
                  <div className="prox-item w-12 h-12 bg-[var(--text-color)] rotate-12" />
                </div>
              )}
              {mode === 'text' && (
                <ProximityText
                  text="PROXIMITY"
                  splitBy="letter"
                  preset={activePreset}
                  textClassName="text-4xl font-black tracking-tighter"
                  {...parsed}
                />
              )}
              {mode === 'text-word' && (
                <ProximityText
                  text="Move your cursor here now"
                  splitBy="word"
                  preset={activePreset}
                  textClassName="text-2xl font-black tracking-tighter"
                  {...parsed}
                />
              )}
            </Proximity>
          )}
        </div>
      </div>
    </div>
  );
};

const MentalModelVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 250, y: 150 });
  const rafRef = useRef<number>(0);
  const isInteractingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const items = [
      { x: 160, y: 150 }, { x: 250, y: 80 },
      { x: 340, y: 150 }, { x: 250, y: 220 },
      { x: 200, y: 100 }, { x: 300, y: 200 },
    ];

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
      const ink = isDark ? '#f0f0f0' : '#0c0c0c';
      const bg  = isDark ? '#0a0a0a' : '#fff';

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const reach = 120;

      // reach circle
      ctx.beginPath();
      ctx.arc(mx, my, reach, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(107,107,255,0.4)' : 'rgba(26,26,255,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // falloff rings
      [0.75, 0.5, 0.25].forEach(r => {
        ctx.beginPath();
        ctx.arc(mx, my, reach * r, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? `rgba(107,107,255,${0.1 + r * 0.1})` : `rgba(26,26,255,${0.15 + r * 0.15})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // cursor dot
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#6b6bff' : '#1a1aff';
      ctx.fill();

      items.forEach((item, i) => {
        const dx = mx - item.x;
        const dy = my - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const raw = Math.max(0, 1 - dist / reach);
        const intensity = Math.pow(raw, 2.4);

        const s = 1 + intensity * 0.6;
        const pull = intensity * 15;
        const px = item.x + (dx / Math.max(dist, 1)) * pull;
        const py = item.y + (dy / Math.max(dist, 1)) * pull;

        if (intensity > 0.01) {
          ctx.beginPath();
          ctx.moveTo(item.x, item.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = isDark
            ? `rgba(107,107,255,${intensity * 0.6})`
            : `rgba(26,26,255,${intensity * 0.6})`;
          ctx.lineWidth = intensity * 1.5;
          ctx.stroke();
        }

        const size = 18 * s;
        ctx.fillStyle = i % 2 === 0
          ? isDark ? `rgba(240,240,240,${0.5 + intensity * 0.5})` : `rgba(12,12,12,${0.5 + intensity * 0.5})`
          : isDark ? `rgba(107,107,255,${0.5 + intensity * 0.5})` : `rgba(26,26,255,${0.5 + intensity * 0.5})`;
        ctx.fillRect(px - size / 2, py - size / 2, size, size);

        if (intensity > 0.05) {
          ctx.fillStyle = isDark ? 'rgba(107,107,255,1)' : 'rgba(26,26,255,1)';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.fillText(`${(intensity * 100).toFixed(0)}%`, px + size / 2 + 5, py - size / 2);
        }
      });

      ctx.fillStyle = isDark ? 'rgba(240,240,240,0.7)' : 'rgba(12,12,12,0.7)';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText('← reach radius →', mx - 45, my + reach + 16);
      ctx.fillText('cursor', mx + 10, my - 10);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    const updateMouse = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseRef.current = {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      isInteractingRef.current = true;
      updateMouse(e.clientX, e.clientY);
    };

    const onMouseLeave = () => {
      isInteractingRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isInteractingRef.current = true;
        updateMouse(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      isInteractingRef.current = false;
    };

    let t = 0;
    const autoAnimate = () => {
      if (!isInteractingRef.current) {
        t += 0.015;
        mouseRef.current = {
          x: 250 + Math.cos(t) * 100,
          y: 150 + Math.sin(t * 0.7) * 70,
        };
      }
    };
    const autoId = setInterval(autoAnimate, 16);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchstart', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(autoId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchstart', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div className="border border-[var(--border-color)] overflow-hidden my-8 shadow-xl">
      <div className="bg-black/5 dark:bg-white/5 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest opacity-80 border-b border-[var(--border-color)] flex items-center gap-2">
        <Eye size={11} /> Touch or Move your cursor inside the box
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={300}
        className="w-full block bg-[var(--bg-color)] touch-none"
        style={{ maxHeight: 300, objectFit: 'contain' }}
      />
    </div>
  );
};

const ReachFalloffExplorer = () => {
  const [reach, setReach] = useState(2);
  const [falloff, setFalloff] = useState(2.4);

  return (
    <div className="border border-[var(--border-color)] my-8 shadow-xl">
      <div className="p-6 border-b border-[var(--border-color)] grid grid-cols-2 gap-8">
        <div>
          <label className="text-[10px] uppercase font-bold tracking-widest opacity-80 block mb-3">
            reach — {reach.toFixed(1)}
          </label>
          <input
            type="range" min={0.5} max={5} step={0.1} value={reach}
            onChange={e => setReach(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-[10px] opacity-70 mt-2">
            How far away the cursor is "felt". Higher = items react from further away.
          </p>
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold tracking-widest opacity-80 block mb-3">
            falloff — {falloff.toFixed(1)}
          </label>
          <input
            type="range" min={0.5} max={6} step={0.1} value={falloff}
            onChange={e => setFalloff(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-[10px] opacity-70 mt-2">
            How quickly intensity drops off. Low = gradual. High = sharp snap.
          </p>
        </div>
      </div>
      <div className="mono-grid p-10 flex items-center justify-center gap-6 min-h-[200px]">
        <Proximity
          key={`${reach}-${falloff}`}
          preset="scale-opacity"
          reach={reach}
          falloff={falloff}
          scale={[1, 1.8]}
          opacity={[0.2, 1]}
          duration={0.2}
        >
          {[0,1,2,3,4].map(i => (
            <div key={i} className="prox-item w-8 h-8 bg-[var(--text-color)] inline-block m-2" />
          ))}
        </Proximity>
      </div>
      <div className="px-6 py-3 bg-black/5 dark:bg-white/5 border-t border-[var(--border-color)] text-[10px] font-mono opacity-80">
        {`<Proximity preset="scale-opacity" reach={${reach}} falloff={${falloff}} />`}
      </div>
    </div>
  );
};

const PRESET_CATALOG = [
  { name: 'scale',    cat: 'transform', desc: 'Grows/shrinks' },
  { name: 'flexScale',cat: 'transform', desc: 'Scale with margin compensation' },
  { name: 'x',        cat: 'transform', desc: 'Moves horizontally' },
  { name: 'y',        cat: 'transform', desc: 'Moves vertically' },
  { name: 'rotate',   cat: 'transform', desc: 'Spins' },
  { name: 'skew',     cat: 'transform', desc: 'Shears' },
  { name: 'opacity',  cat: 'appear',    desc: 'Fades in/out' },
  { name: 'blur',     cat: 'appear',    desc: 'Blurs into focus' },
  { name: 'reveal',   cat: 'appear',    desc: 'Clips in from bottom' },
  { name: 'scroll',   cat: 'appear',    desc: 'Scroll-driven travel' },
  { name: 'magnetic', cat: 'physics',   desc: 'Attracts toward cursor' },
  { name: 'repel',    cat: 'physics',   desc: 'Pushes away' },
  { name: 'tilt',     cat: '3d',        desc: '3D tilt rotation' },
  { name: 'tiltCard', cat: '3d',        desc: 'Perspective card tilt' },
  { name: 'glow',     cat: 'style',     desc: 'Drop shadow glow' },
  { name: 'brightness',cat: 'style',    desc: 'CSS brightness filter' },
  { name: 'contrast', cat: 'style',     desc: 'CSS contrast filter' },
  { name: 'grayScale',cat: 'style',     desc: 'Black & white conversion' },
  { name: 'background',cat:'style',     desc: 'Background color shift' },
  { name: 'color',    cat: 'style',     desc: 'Text color shift' },
  { name: 'letterSpacing', cat: 'style', desc: 'Adjusts text tracking' },
  { name: 'borderRadius', cat: 'style', desc: 'Morphs corners' },
];

const CAT_COLORS: Record<string,string> = {
  transform: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  appear:    'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  physics:   'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
  '3d':      'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
  style:     'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20',
};

const PresetChainBuilder = () => {
  const [selected, setSelected] = useState<string[]>(['scale']);
  const combined = selected.join('-') || 'none';

  const toggle = (p: string) => {
    setSelected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div className="border border-[var(--border-color)] my-8 shadow-xl">
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-2/5 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] p-5">
          <div className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-4 flex items-center gap-2">
            <Layers size={11} /> Click to chain presets
          </div>
          {(['transform','appear','physics','3d','style'] as const).map(cat => (
            <div key={cat} className="mb-4">
              <div className="text-[9px] uppercase font-bold tracking-widest opacity-70 mb-2">{cat}</div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_CATALOG.filter(p => p.cat === cat).map(p => (
                  <button
                    key={p.name}
                    onClick={() => toggle(p.name)}
                    title={p.desc}
                    className={`px-2 py-1 text-[10px] font-mono border transition-all ${
                      selected.includes(p.name)
                        ? 'bg-[var(--text-color)] text-[var(--bg-color)] border-[var(--text-color)] font-bold'
                        : `border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5 ${CAT_COLORS[cat]}`
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:w-3/5 flex flex-col">
          <div className="flex-1 mono-grid flex items-center justify-center min-h-[250px]">
            <Proximity key={combined} preset={combined as string} reach={1.8}>
              <div className="flex gap-4 flex-wrap justify-center p-4">
                {[0,1,2,3].map(i => (
                  <div key={i} className="prox-item w-16 h-16 border-2 border-[var(--border-color)] bg-[var(--text-color)] flex items-center justify-center text-[var(--bg-color)] font-black text-lg shadow-lg">
                    {i+1}
                  </div>
                ))}
              </div>
            </Proximity>
          </div>
          <div className="border-t border-[var(--border-color)] p-4 font-mono text-[11px] bg-black/5 dark:bg-white/5 break-all">
            <span className="opacity-70">preset=</span>
            <span className="font-bold">"{combined}"</span>
            {selected.length === 0 && <span className="ml-3 text-red-500 font-bold text-[10px]">← select at least one preset</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

const MistakeCard = ({
  title,
  wrong,
  right,
  explanation,
}: {
  title: string;
  wrong: string;
  right: string;
  explanation: string;
}) => {
  const [showing, setShowing] = useState<'wrong' | 'right'>('wrong');
  return (
    <div className="border border-[var(--border-color)] my-6 overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5">
        <span className="font-bold text-sm">{title}</span>
        <div className="flex border border-[var(--border-color)] overflow-hidden text-[10px] font-bold uppercase tracking-widest">
          <button
            onClick={() => setShowing('wrong')}
            className={`px-3 py-1.5 transition-all ${showing === 'wrong' ? 'bg-red-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'}`}
          >
            ✗ Wrong
          </button>
          <button
            onClick={() => setShowing('right')}
            className={`px-3 py-1.5 border-l border-[var(--border-color)] transition-all ${showing === 'right' ? 'bg-green-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'}`}
          >
            ✓ Right
          </button>
        </div>
      </div>
      <pre className="bg-black dark:bg-zinc-950 text-gray-300 p-5 text-[11px] font-mono overflow-x-auto leading-relaxed border-b border-black/20 dark:border-white/10">
        <code>{showing === 'wrong' ? wrong : right}</code>
      </pre>
      <div className="p-4 text-xs opacity-90 leading-relaxed bg-[var(--bg-color)]">
        {explanation}
      </div>
    </div>
  );
};

const NeighborNearestDemo = () => {
  const [mode, setMode] = useState<'nearest'|'neighbor'|'both'>('both');

  const nearestP = mode === 'nearest' || mode === 'both' ? 'scale-magnetic-y-tiltCard' : '';
  const neighborP = mode === 'neighbor' || mode === 'both' ? 'repel' : '';

  return (
    <div className="border border-[var(--border-color)] my-8 shadow-xl">
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5 flex-wrap">
        <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Mode:</span>
        {(['nearest','neighbor','both'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${
              mode === m
                ? 'bg-[var(--text-color)] text-[var(--bg-color)] border-[var(--text-color)]'
                : 'border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="mono-grid p-12 flex items-center justify-center min-h-[220px]">
        <Proximity
          key={mode}
          nearestPreset={nearestP}
          neighborPreset={neighborP}
          scale={[1,1.5]}
          magnetic={[0, 0.5]}
          y={[0, -30]}
          repel={[0,0.5]}
          reach={2}
          lockAxis='x'
        >
          {[0,1,2,3,4,5,6].map(i => (
            <div key={i} className="prox-item w-10 h-10 bg-[var(--text-color)] inline-flex items-center justify-center text-[var(--bg-color)] text-xs font-black m-2 shadow-lg">
              {i+1}
            </div>
          ))}
        </Proximity>
      </div>
      <div className="p-4 border-t border-[var(--border-color)] text-[11px] font-mono font-bold bg-black/5 dark:bg-white/5 opacity-90 overflow-x-auto whitespace-nowrap">
        {mode === 'nearest'  && `nearestPreset="scale-magnetic" // only the closest item snaps`}
        {mode === 'neighbor' && `neighborPreset="repel"    // all others scatter`}
        {mode === 'both'     && `nearestPreset="scale-magnetic" neighborPreset="repel" // dock effect`}
      </div>
    </div>
  );
};

const EaseTester = () => {
  const [ease, setEase] = useState('bouncy');
  return (
    <div className="border border-[var(--border-color)] my-8 shadow-xl">
      <div className="p-4 border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5">
        <div className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-3">
          Click an ease — hover the boxes to feel the difference
        </div>
        <div className="flex flex-wrap gap-2">
          {EASES.map(e => (
            <button
              key={e}
              onClick={() => setEase(e)}
              className={`px-2 py-1 text-[10px] font-mono border transition-all ${
                ease === e
                  ? 'bg-[var(--text-color)] text-[var(--bg-color)] border-[var(--text-color)] font-bold'
                  : 'border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="mono-grid p-10 flex items-center justify-center min-h-[160px]">
        <Proximity key={ease} preset="scale-y" ease={ease} scale={[1,1.6]} y={[0,-20]} reach={2} duration={0.5}>
          {[0,1,2,3].map(i => (
            <div key={i} className="prox-item w-12 h-12 bg-[var(--text-color)] inline-block m-3 shadow-lg" />
          ))}
        </Proximity>
      </div>
      <div className="px-4 py-3 border-t border-[var(--border-color)] text-[11px] font-mono font-bold opacity-80">
        ease="{ease}"
      </div>
    </div>
  );
};

const API_ROWS = [
  ['preset',         'string',              '"scale"',     'Chain multiple physics presets with dash syntax.'],
  ['reach',          'number',              '2',           'Euclidean radius of influence. 1 = tight, 5 = huge.'],
  ['falloff',        'number',              '2.4',         'Steepness of the drop-off curve. Higher = snappier.'],
  ['duration',       'number',              '0.2',         'Tween speed on enter.'],
  ['resetDuration',  'number',              '0.4',         'Tween speed on leave.'],
  ['ease',           'EasePreset|string',   '"power1.out"','Built-in ease or any GSAP ease string.'],
  ['resetEase',      'EasePreset|string',   '"power2.out"','Ease used when cursor leaves.'],
  ['mode',           '"pointer"|"scroll"',  '"pointer"',   'Switch from cursor to scroll-driven mode.'],
  ['nearestPreset',  'string',              '—',           'Preset applied only to the closest element.'],
  ['neighborPreset', 'string',              '—',           'Preset applied to all non-nearest elements.'],
  ['global',         'boolean',             'false',       'Track cursor across the whole window.'],
  ['explicit',       'boolean',             'false',       'Physics only activate when cursor is strictly inside bounds.'],
  ['lockAxis',       '"x"|"y"|"both"',      '—',           'Constrain magnetic/repel movement to one axis.'],
  ['maxTravel',      'number|[x,y]',        'Infinity',    'Cap the max pixel offset.'],
  ['stagger',        'number',              '0.1',         'Delay between each element animating in scroll mode.'],
  ['disableOnMobile','boolean|string[]',    'false',       'Kill specific or all presets on touch devices.'],
  ['onCalculate',    'function',            '—',           'Custom physics hook: (intensity, dist, dx, dy, isNearest)'],
  ['onReset',        'function',            '—',           'Custom reset state hook: () => TweenVars'],
  ['selector',       'string',              '".prox-item"','CSS selector that targets animatable children.'],
  ['config',         'ProximityConfig',     '—',           'Pass all options as a single config object.'],
];

const EASES = [
  'smooth','heavy','sharp','fluid','bouncy','elastic',
  'jello','bounce','swing','spring','heavySpring',
  'anticipate','launch','drift','whiplash','expo',
];

const ScrollDemo = () => (
  <div className="my-8 py-20 px-4 bg-zinc-900 dark:bg-zinc-900 border border-[var(--border-color)] overflow-hidden shadow-2xl" style={{ perspective: 1200 }}>
    <p className="text-center text-[11px] uppercase font-bold tracking-widest text-zinc-400 mb-12">
      ↓ Scroll up and down fast to feel velocity effects
    </p>
    <Proximity
      mode="scroll"
      preset="tiltCard-y-opacity-scale-velocitySkew-velocityScale-parallax"
      config={{
        scroll: { start: 'top 95%', end: 'center 30%', scrub: true, once: false },
        y: [120, 0],
        opacity: [0, 1],
        scale: [0.8, 1],
        tiltCard: [0, 25],
        velocitySkew: [-20, 20],
        velocityScale: [0.8, 1.2],
        parallax: [0, 150],
        stagger: 0.1,
      }}
      className="flex flex-col md:flex-row gap-6 justify-center items-center"
    >
      {['SPEED', 'VELOCITY', 'PARALLAX'].map((word, i) => (
        <div key={word} data-speed={1 + i * 0.5} className="prox-item w-full md:w-44 h-52 bg-white/5 border border-white/10 text-white p-6 flex flex-col justify-between shadow-2xl">
          <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Speed {1 + i * 0.5}x</span>
          <span className="text-3xl font-black italic tracking-tighter">{word}</span>
        </div>
      ))}
    </Proximity>
  </div>
);

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('mental-model');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef   = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width:1024px)', () => {
      if (!containerRef.current || !sidebarRef.current) return;
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top+=85',
        end: 'bottom bottom',
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
  }, []);

  useEffect(() => {
      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            setShowFloatingBtn(window.scrollY > 300);
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
  
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
  
      SECTIONS.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (el) observer.observe(el);
      });
  
      return () => {
        window.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    },[]);

  const scrollToSection = useCallback((id: string) => {
    gsap.to(window, { duration: 1.2, scrollTo: { y: `#${id}`, offsetY: 100 }, ease: 'power3.inOut' });
    setIsSidebarOpen(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex relative items-start w-full bg-[var(--bg-color)] text-[var(--text-color)] border-t border-[var(--border-color)]"
    >
      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-[var(--text-color)] text-[var(--bg-color)] rounded-full shadow-2xl transition-all duration-500 lg:hidden ${showFloatingBtn && !isSidebarOpen ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}
      >
        <BookOpen size={20} />
      </button>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[var(--bg-color)] border-r border-[var(--border-color)] overflow-y-auto shrink-0
          transition-transform duration-300 ease-in-out
          lg:absolute lg:top-0 lg:left-0 lg:h-[calc(100vh-85px)] lg:translate-x-0 lg:transition-none
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        <div className="p-6 pb-4 flex justify-between items-center border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)] z-10">
          <h1 className="text-sm font-black uppercase tracking-tighter">Z-Proximity Docs</h1>
          <button className="lg:hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full" onClick={() => setIsSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="p-4 space-y-0.5">
          {SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`w-full text-left px-3 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2 ${
                activeSection === sec.id
                  ? 'bg-[var(--text-color)] text-[var(--bg-color)]'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'
              }`}
            >
              <span>{sec.icon}</span>
              {sec.title}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-4 border-t border-[var(--border-color)]">
          <div className="text-[9px] uppercase font-bold tracking-widest opacity-60 mb-3">Quick Copy</div>
          {[
            { label: 'Install', code: 'npm i z-proximity-engine gsap @gsap/react' },
            { label: 'Basic use', code: `<Proximity preset="scale" reach={2}>\n  <div className="prox-item">Hi</div>\n</Proximity>` },
          ].map(s => (
            <div key={s.label} className="mb-3">
              <div className="text-[9px] uppercase font-bold tracking-widest opacity-60 mb-1">{s.label}</div>
              <pre
                className="bg-black dark:bg-white text-gray-300 dark:text-black p-2 text-[9px] font-mono cursor-pointer hover:bg-zinc-900 transition-colors overflow-x-auto border border-black/20 dark:border-white/10"
                onClick={() => navigator.clipboard.writeText(s.code)}
                title="Click to copy"
              >
                {s.code}
              </pre>
            </div>
          ))}
        </div>
      </aside>

      <div className="hidden lg:block w-72 shrink-0 border-r border-[var(--border-color)]" />

      <main className="flex-1 min-w-0 w-full px-6 py-10 md:px-10 lg:px-14 pb-40 max-w-4xl mx-auto overflow-hidden">

        <section id="mental-model">
          <DocH2 id="mental-model">🧠 The Mental Model</DocH2>
          <p className="text-[10px] uppercase tracking-widest opacity-70 mb-6 font-bold">Before writing a single line of code — understand this</p>

          <DocP>
            ZProximity Engine does one thing: it <strong>measures the distance between your cursor and every element you care about</strong>,
            then converts that distance into a 0→1 intensity value. Everything else — scaling, blurring, color, physics — is just
            a function of that number.
          </DocP>

          <div className="grid md:grid-cols-3 gap-4 my-8">
            {[
              { icon: <MousePointer size={20} />, label: 'Cursor → Distance', desc: 'Every frame, we measure how far the cursor is from each .prox-item in pixels.' },
              { icon: <Cpu size={20} />, label: 'Distance → Intensity', desc: 'Distance is converted to 0.0–1.0 intensity using your reach and falloff settings.' },
              { icon: <Zap size={20} />, label: 'Intensity → Preset', desc: 'The intensity drives every visual property — scale, blur, color, position, rotation.' },
            ].map(s => (
              <div key={s.label} className="border border-[var(--border-color)] p-5 shadow-sm">
                <div className="mb-3 opacity-80">{s.icon}</div>
                <div className="text-[11px] font-black uppercase tracking-wider mb-2">{s.label}</div>
                <div className="text-[11px] opacity-80 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>

          <DocP>
            The intensity curve is <strong>exponential</strong>, not linear. This is why the effect feels organic — things don't
            mechanically slide at a fixed rate, they snap to life the closer you get, exactly like real magnetic fields.
          </DocP>

          <MentalModelVisualizer />

          <Callout type="tip" icon={<Sparkles size={14} />}>
            <strong>The "aha" moment:</strong> Every preset — <Mono>scale</Mono>, <Mono>blur</Mono>, <Mono>magnetic</Mono>,
            <Mono>cipher</Mono> — is just a different formula that takes intensity (0→1) and spits out a CSS/GSAP property.
            They all run on the same engine. You can chain unlimited presets together.
          </Callout>
        </section>

        <section id="installation">
          <DocH2>📦 Installation</DocH2>

          <CodeBlock code="npm install z-proximity-engine gsap @gsap/react" label="terminal" />

          <Callout type="warn" icon={<AlertTriangle size={14} />}>
            <strong>Peer dependencies required.</strong> ZProximity Engine uses GSAP as its animation core.
            You must install both <Mono>gsap</Mono> and <Mono>@gsap/react</Mono> separately — they are not bundled.
          </Callout>

          <DocH3>Two components, one purpose</DocH3>

          <div className="grid md:grid-cols-2 gap-4 my-6">
            <div className="border border-[var(--border-color)] p-5 shadow-sm">
              <div className="text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--text-color)] rounded-full" />
                Proximity
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed mb-4">
                The core wrapper. Put it around any elements — divs, images, cards, icons.
                Children with <Mono>.prox-item</Mono> class become reactive.
              </p>
              <CodeBlock code={`import { Proximity } from 'z-proximity-engine';

<Proximity preset="scale" reach={2}>
  <div className="prox-item">I react</div>
  <div>I don't react</div>
  <div className="prox-item">I react too</div>
</Proximity>`} />
            </div>
            <div className="border border-[var(--border-color)] p-5 shadow-sm">
              <div className="text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--text-color)] rounded-full" />
                ProximityText
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed mb-4">
                Automatically splits text into individual letters or words and makes each one reactive. No manual span-wrapping needed.
              </p>
              <CodeBlock code={`import { ProximityText } from 'z-proximity-engine';

<ProximityText
  text="Hello World"
  splitBy="letter"
  preset="scale-blur"
/>`} />
            </div>
          </div>
        </section>

        <section id="your-first-effect">
          <DocH2>⚡ Your First Effect</DocH2>
          <DocP>
            The simplest possible setup. Wrap your elements, add the <Mono>prox-item</Mono> class,
            pick a preset. That's genuinely it.
          </DocP>

          <LiveEditor
            preset="scale"
            initialConfig={`{
  preset: "scale",
  reach: 1.5,
  duration: 0.3,
  ease: "bouncy"
}`}
            label="Your first effect — edit anything"
          />

          <DocH3>How the selector works</DocH3>
          <DocP>
            By default, <Mono>Proximity</Mono> looks for children with the class <Mono>.prox-item</Mono>.
            You can override this with the <Mono>selector</Mono> prop to target any CSS selector inside the container.
          </DocP>
          <CodeBlock
            code={`// Default — use .prox-item class
<Proximity preset="scale">
  <div className="prox-item">Reacts</div>
</Proximity>

// Custom selector
<Proximity preset="scale" selector=".my-card">
  <div className="my-card">Also reacts</div>
</Proximity>

// Multiple selectors
<Proximity preset="scale" selector=".card, .icon, button">
  <div className="card">React</div>
  <button>Also reacts</button>
</Proximity>`}
          />
        </section>

        <section id="reach-falloff">
          <DocH2>📡 Reach & Falloff</DocH2>
          <DocP>
            These two numbers control the <em>shape</em> of your proximity field. Most devs tune them
            by feel — the explorer below lets you do exactly that.
          </DocP>

          <div className="grid md:grid-cols-2 gap-6 my-6">
            <div className="border border-[var(--border-color)] p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-wider mb-2">reach</div>
              <div className="text-[11px] opacity-80 leading-relaxed">
                Think of it as the <strong>radius</strong> of an invisible bubble around each element.
                The cursor must enter this bubble to trigger the effect. Measured in multiples of element size.
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                {[['0.8', 'Touch me'], ['2', 'Normal'], ['5', 'Feels me from far']].map(([v, l]) => (
                  <div key={v} className="border border-[var(--border-color)] p-2">
                    <div className="font-bold">{v}</div>
                    <div className="opacity-70 mt-1">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-[var(--border-color)] p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-wider mb-2">falloff</div>
              <div className="text-[11px] opacity-80 leading-relaxed">
                Controls how quickly the intensity drops off with distance. Low values feel <strong>gradual and dreamy</strong>.
                High values feel <strong>snappy and magnetic</strong>.
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                {[['0.8', 'Gradual'], ['2.4', 'Default'], ['5', 'Snappy']].map(([v, l]) => (
                  <div key={v} className="border border-[var(--border-color)] p-2">
                    <div className="font-bold">{v}</div>
                    <div className="opacity-70 mt-1">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ReachFalloffExplorer />
        </section>

        <section id="preset-chaining">
          <DocH2>🔗 Preset Chaining</DocH2>
          <DocP>
            The most powerful feature. Join any presets with a dash and they all run simultaneously.
            The engine computes them all in the same animation frame — zero performance penalty for combining.
          </DocP>

          <CodeBlock code={`// Single preset
preset="scale"

// Two combined
preset="scale-opacity"

// Full cinematic combo
preset="scale-blur-rotate-magnetic"

// As many as you want — they ALL run in one GSAP tick
preset="scale-blur-rotate-tilt-opacity-color-borderRadius"`} />

          <PresetChainBuilder />

          <DocH3>Override individual preset ranges</DocH3>
          <DocP>
            Each preset has sensible defaults, but you can override the <em>[from, to]</em> range for any of them:
          </DocP>
          <CodeBlock code={`<Proximity
  preset="scale-blur-rotate"
  scale={[1, 2.5]}       // default was [1, 1.5]
  blur={[20, 0]}         // heavy blur that clears on hover
  rotate={[-45, 0]}      // spins in from -45deg
  reach={2}
/>`} />

          <EaseTester />
        </section>

        <section id="styling-aesthetics">
          <DocH2>✨ Styling & Aesthetics</DocH2>
          <DocP>
            Physics aren't just for transforms. You can drive visual aesthetics—colors, shadows, filters, and border radii—directly from spatial proximity.
          </DocP>
          
          <div className="grid md:grid-cols-2 gap-6 my-6">
            <div className="border border-[var(--border-color)] p-8 flex flex-col items-center justify-center mono-grid min-h-[250px] shadow-xl relative group">
              <span className="absolute top-4 left-4 text-[9px] uppercase font-bold tracking-widest opacity-60">Glow & Color Shift</span>
              <Proximity preset="glow-color" glow={[0, 40]} color={["var(--text-color)", "#3b82f6"]} reach={2}>
                <div className="prox-item text-5xl font-black tracking-tighter">NEON</div>
              </Proximity>
            </div>
            <div className="border border-[var(--border-color)] p-8 flex flex-col items-center justify-center mono-grid min-h-[250px] shadow-xl relative group">
              <span className="absolute top-4 left-4 text-[9px] uppercase font-bold tracking-widest opacity-60">Border Radius & Background</span>
              <Proximity preset="borderRadius-rotate-background-scale" borderRadius={[0, 50]} background={["transparent", "var(--text-color)"]} rotate={[0, 90]} scale={[1, 1.2]} reach={2}>
                <div className="prox-item w-24 h-24 border-2 border-[var(--text-color)] flex items-center justify-center font-bold text-[var(--bg-color)]">
                </div>
              </Proximity>
            </div>
          </div>
          
          <CodeBlock code={`// 1. Color Shift & Drop Shadow Glow
<Proximity 
  preset="glow-color" 
  glow={[0, 30]} 
  color={["var(--text-color)", "#3b82f6"]}
>
  <div className="prox-item">NEON</div>
</Proximity>

// 2. Border Morphing & Background Color
<Proximity 
  preset="borderRadius-rotate-background" 
  borderRadius={[0, 50]} 
  background={["transparent", "var(--text-color)"]}
>
  <div className="prox-item w-24 h-24 border-2"></div>
</Proximity>`} />
        </section>

        <section id="common-mistakes">
          <DocH2>⚠️ Common Mistakes</DocH2>
          <DocP>
            These are the bugs that waste hours. Read them once, save yourself the pain.
          </DocP>

          <MistakeCard
            title="Forgetting .prox-item"
            wrong={`// Nothing happens — no .prox-item class!
<Proximity preset="scale" reach={2}>
  <div>Why isn't this working?</div>
  <button>Or this?</button>
</Proximity>`}
            right={`// Add .prox-item to every element you want to react
<Proximity preset="scale" reach={2}>
  <div className="prox-item">This works</div>
  <button className="prox-item">This too</button>
</Proximity>`}
            explanation="Proximity uses CSS class targeting. Only elements with .prox-item (or your custom selector) are registered. The rest are invisible to the engine."
          />

          <MistakeCard
            title="Using CSS transitions alongside Proximity"
            wrong={`/* In your CSS */
.prox-item {
  transition: transform 0.3s ease; /* CONFLICTS with GSAP */
}

/* Proximity + CSS transitions fight each other every frame */`}
            right={`/* Remove the CSS transition entirely */
.prox-item {
  /* No transition needed — GSAP handles ALL animation */
}

/* Control speed via Proximity props instead */
<Proximity preset="scale" duration={0.3} ease="bouncy" />`}
            explanation="CSS transitions and GSAP both try to animate the same properties simultaneously, causing jitter. GSAP wins the property but wastes CPU fighting the transition. Remove any CSS transitions on .prox-item elements."
          />

          <MistakeCard
            title="Nesting Proximity components wrongly"
            wrong={`// The inner Proximity steals mouse events from outer
<Proximity preset="scale" selector=".card">
  <Proximity preset="blur" selector=".card">
    <div className="card">Confused</div>
  </Proximity>
</Proximity>`}
            right={`// Use preset chaining instead of nesting
<Proximity preset="scale-blur" selector=".card">
  <div className="card">Perfect</div>
</Proximity>

// OR use targets for per-element config
<Proximity
  preset="scale"
  targets={[{ selector: ".card-inner", preset: "blur" }]}
>
  <div className="card prox-item">
    <div className="card-inner">Different physics</div>
  </div>
</Proximity>`}
            explanation="Proximity components track mouse events on their own container. Nesting creates conflicting event zones. Always use preset chaining (scale-blur) for multiple effects on the same elements."
          />

          <MistakeCard
            title="Wrong config object parity (props vs config)"
            wrong={`// Mixing prop-level and config-level settings — config wins!
<Proximity
  reach={5}                    // ← this gets IGNORED
  config={{ reach: 1 }}        // ← this wins, reach is 1
/>`}
            right={`// Use either props OR a config object, not both
// Option A: all props
<Proximity reach={5} preset="scale" ease="bouncy" />

// Option B: all in config
<Proximity config={{ reach: 5, preset: "scale", ease: "bouncy" }} />

// If mixing, config values always override direct props`}
            explanation="When you pass both a config object and direct props, config values always win. This is useful for state-driven configs, but can cause confusion when you expect a prop to take effect."
          />

          <MistakeCard
            title="Animating elements that aren't hardware accelerated"
            wrong={`// Animating width/height causes layout reflow every frame — SLOW
<Proximity preset="scale" onCalculate={(i) => ({
  width: 100 + i * 50,   // triggers layout
  height: 100 + i * 50,  // triggers layout
})} />`}
            right={`// Use transform: scale instead — GPU accelerated, no layout
<Proximity preset="scale" scale={[1, 1.5]} />

// Or with onCalculate, stick to transform/opacity/filter
<Proximity onCalculate={(i) => ({
  scaleX: 1 + i * 0.5,   // GPU only
  scaleY: 1 + i * 0.5,   // GPU only
  opacity: 0.5 + i * 0.5 // GPU only
})} />`}
            explanation="GSAP is fast, but the browser layout pipeline is not. Always animate transform (scale, rotate, x, y) and opacity/filter. Never animate width, height, top, left, padding or margin in the animation loop."
          />
        </section>

        <section id="text-magic">
          <DocH2>✍️ Text Magic</DocH2>
          <DocP>
            Manually wrapping every character in a span is one of the most tedious tasks in GSAP work.
            <Mono>ProximityText</Mono> does it for you — letters, words, or lines — all reactive, all accessible.
          </DocP>

          <div className="grid md:grid-cols-3 gap-4 my-6">
            {[
              { split: 'letter', desc: 'Each character is its own reactive target. Best for dramatic headline effects.' },
              { split: 'word',   desc: 'Each word is a reactive target. Great for body text and call-to-actions.' },
              { split: 'line',   desc: 'Each line is a reactive target. Best for scroll reveals with stagger.' },
            ].map(s => (
              <div key={s.split} className="border border-[var(--border-color)] p-4 shadow-sm">
                <Mono>splitBy="{s.split}"</Mono>
                <p className="text-[11px] opacity-80 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <LiveEditor
            preset="scale-opacity"
            mode="text"
            initialConfig={`{
  preset: "scale-opacity",
  splitBy: "letter",
  scale: [1, 1.8],
  opacity: [0.2, 1],
  reach: 1.5,
  ease: "bouncy",
  duration: 0.3
}`}
            label="Letter-level physics — edit preset and splitBy"
          />

          <LiveEditor
            preset="y-opacity"
            mode="text-word"
            height={250}
            initialConfig={`{
  preset: "y-opacity",
  splitBy: "word",
  y: [20, 0],
  opacity: [0.1, 1],
  reach: 2,
  ease: "elastic",
  duration: 0.5
}`}
            label="Word-level physics"
          />

          <DocH3>The cipher preset</DocH3>
          <DocP>
            <Mono>cipher</Mono> is text-only. It scrambles characters into random glyphs as your cursor
            approaches, then deciphers them as intensity peaks. Zero GSAP tricks — pure text manipulation
            on every frame.
          </DocP>

          <div className="border border-[var(--border-color)] mono-grid flex items-center justify-center p-16 my-6 shadow-xl">
            <ProximityText
              text="CLASSIFIED DATA"
              splitBy="letter"
              preset="cipher-scale-color"
              cipher={[0, 1]}
              scale={[0.8, 1]}
              color={["var(--text-color)", "#ef4444"]}
              reach={2}
              textClassName="text-3xl font-black tracking-widest"
            />
          </div>

          <CodeBlock code={`<ProximityText
  text="CLASSIFIED DATA"
  splitBy="letter"
  preset="cipher-scale-color"
  cipher={[0, 1]}
  scale={[0.8, 1]}
  color={["var(--text-color)", "#ef4444"]}
  reach={2}
  textClassName="text-3xl font-black tracking-widest"
/>`} />

          <DocH3>ignoreText — skip specific characters</DocH3>
          <CodeBlock code={`// Skip punctuation and special chars from animation
<ProximityText
  text="Hello, World!"
  splitBy="letter"
  preset="scale"
  ignoreText={[",", "!", " "]}
/>

// Use regex for patterns
<ProximityText
  text="Email me@domain.com"
  splitBy="letter"
  preset="blur"
  ignoreText={[/@/, /\\./]}
/>`} />

          <DocH3>Full Arabic & RTL Support</DocH3>
          <DocP>
            <Mono>ProximityText</Mono> seamlessly handles Arabic diacritics, ligatures (like Lam-Alef), and continuous cursive connections without breaking the font joining behavior.
          </DocP>
          <div className="border border-[var(--border-color)] mono-grid flex items-center justify-center p-10 my-6 shadow-xl">
            <ProximityText
              text="مرحباً بالعالم"
              splitBy="letter"
              preset="scale-y-blur"
              scale={[1, 1.5]}
              y={[0, -10]}
              blur={[0, 4]}
              reach={1.5}
              textClassName="text-5xl font-black font-sans tracking-normal"
              dir="rtl"
            />
          </div>
        </section>

        <section id="neighbor-nearest">
          <DocH2>🎯 Neighbor vs Nearest</DocH2>
          <DocP>
            This is the feature that separates a basic hover effect from something that feels alive.
            Instead of every element doing the same thing on hover, you split the behavior —
            the closest element does one thing, everything around it does something else.
          </DocP>

          <Callout type="tip" icon={<Heart size={14} />}>
            <strong>The macOS Dock effect</strong> — closest icon scales up (nearestPreset), neighboring icons spread apart (neighborPreset) — is exactly this feature. Two lines of code.
          </Callout>

          <NeighborNearestDemo />

          <CodeBlock code={`// The full dock pattern
<Proximity
  nearestPreset="scale-magnetic-y"   // closest element: grows + pulls to cursor
  neighborPreset="repel"      // all others: scatter
  scale={[1, 1.5]}
  magnetic={[0, 0.4]}
  repel={[0, 0.4]}
  blur={[0, 6]}
  reach={2.5}
>
  {icons.map(icon => (
    <div key={icon} className="prox-item w-12 h-12">
      {icon}
    </div>
  ))}
</Proximity>`} />

          <DocH3>Three layers of targeting</DocH3>

          <div className="overflow-x-auto border border-[var(--border-color)] my-6 shadow-sm">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-[var(--border-color)] uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="p-4">Prop</th>
                  <th className="p-4">Applies to</th>
                  <th className="p-4">Use case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                <tr><td className="p-4 font-mono font-bold">preset</td><td className="p-4">All elements in reach</td><td className="p-4 opacity-80">Uniform glow, opacity change on all elements</td></tr>
                <tr><td className="p-4 font-mono font-bold">nearestPreset</td><td className="p-4">Only the closest element</td><td className="p-4 opacity-80">Dock icon scale, magnetic pull on hovered item</td></tr>
                <tr><td className="p-4 font-mono font-bold">neighborPreset</td><td className="p-4">All other elements in reach</td><td className="p-4 opacity-80">Repel, dim, or blur surrounding elements</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="scroll-mode">
          <DocH2>📜 Scroll Mode</DocH2>
          <DocP>
            Switch from cursor tracking to viewport scroll tracking with a single prop.
            All the same presets, all the same physics — but now driven by how far the
            user has scrolled rather than where their mouse is.
          </DocP>

          <CodeBlock code={`// Switch to scroll mode
<Proximity mode="scroll" preset="y-opacity" config={{
  scroll: {
    start: "top 90%",   // trigger when element top hits 90% down the viewport
    end: "center 40%",  // complete when element center hits 40% down
    scrub: true,        // link animation directly to scroll position
    once: true,         // only animate in, don't reverse on scroll back
    stagger: 0.15,      // delay between each element animating
  },
  y: [60, 0],
  opacity: [0, 1],
}}>
  <div className="prox-item">Animates in on scroll</div>
  <div className="prox-item">With a 150ms delay</div>
  <div className="prox-item">And another 150ms delay</div>
</Proximity>`} />

          <ScrollDemo />

          <DocH3>Velocity & Parallax</DocH3>
          <DocP>
            Add high-end Awwwards-style scrolling with <Mono>parallax</Mono>, <Mono>velocitySkew</Mono>, and <Mono>velocityScale</Mono>. 
            The engine automatically calculates scroll velocity and transforms it into physical distortion.
          </DocP>

          <CodeBlock code={`<Proximity
  mode="scroll"
  preset="parallax-velocitySkew-velocityScale"
  config={{
    scroll: { start: 'top bottom', end: 'bottom top', scrub: true },
    parallax: [0, 150],        // Element moves 150px against the scroll
    velocitySkew: [-20, 20],   // Skews based on scroll speed
    velocityScale: [0.8, 1.2]  // Squashes and stretches based on velocity
  }}
>
  {/* Adding data-speed multiplies the parallax effect for this specific item! */}
  <div className="prox-item" data-speed="1.5">Faster</div>
  <div className="prox-item" data-speed="0.8">Slower</div>
</Proximity>`} />

          <DocH3>scrub vs trigger mode</DocH3>
          <div className="grid md:grid-cols-2 gap-4 my-6">
            <div className="border border-[var(--border-color)] p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-wider mb-2">scrub: true (or number)</div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Animation is directly tied to scroll position. Scroll down = animate forward.
                Scroll up = animate backward. Perfect for parallax and progress effects.
                The number value adds lag (e.g. <Mono>scrub: 0.5</Mono> = 500ms delay).
              </p>
            </div>
            <div className="border border-[var(--border-color)] p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-wider mb-2">scrub: false (trigger mode)</div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Animation plays once when the scroll position hits the trigger point.
                Uses <Mono>duration</Mono> and <Mono>ease</Mono> for the tween.
                Combine with <Mono>once: true</Mono> to prevent re-triggering.
              </p>
            </div>
          </div>
        </section>

        <section id="custom-physics">
          <DocH2>🔬 Custom Physics</DocH2>
          <DocP>
            When no preset combination achieves what you need, <Mono>onCalculate</Mono> gives you
            raw access to the engine's internals every single animation frame.
          </DocP>

          <CodeBlock code={`<Proximity
  reach={2}
  onCalculate={(intensity, distance, dx, dy, isNearest) => {
    // intensity: 0–1, how strong the effect is
    // distance:  pixels from cursor to element center
    // dx, dy:    direction vector from element to cursor
    // isNearest: true if this is the element closest to cursor

    return {
      // Return any valid GSAP properties
      scaleX: 1 + intensity * 0.4,
      scaleY: 1 - intensity * 0.1,   // squash effect
      filter: \`hue-rotate(\${intensity * 180}deg)\`,
      y: isNearest ? -20 : 0,         // nearest item pops up
      rotation: dy * 0.05,            // tilt based on cursor direction
    };
  }}
  onReset={() => ({
    // Called when cursor leaves — return the "rest" state
    scaleX: 1, scaleY: 1,
    filter: 'hue-rotate(0deg)',
    y: 0, rotation: 0,
  })}
>
  <div className="prox-item">Custom physics</div>
</Proximity>`} />

          <LiveEditor
            preset=""
            initialConfig={`{
  reach: 1.8,
  onCalculate: (intensity, dist, dx, dy) => ({
    scaleX: 1 + intensity * 0.6,
    scaleY: 1 - intensity * 0.15,
    filter: \`hue-rotate(\${intensity * 200}deg) brightness(\${1 + intensity * 0.4})\`,
    rotation: dy * 0.03,
  }),
  onReset: () => ({
    scaleX: 1, scaleY: 1,
    filter: "hue-rotate(0deg) brightness(1)",
    rotation: 0,
  })
}`}
            label="Custom physics — try editing onCalculate"
          />

          <DocH3>Per-element config with targets</DocH3>
          <DocP>
            Give different elements completely different physics using the <Mono>targets</Mono> prop.
            Each target override can have its own preset, duration, ease — everything.
          </DocP>
          <CodeBlock code={`<Proximity
  preset="opacity"    // default for everyone
  opacity={[0.3, 1]}
  targets={[
    {
      selector: ".card-primary",
      preset: "scale-magnetic",
      scale: [1, 1.4],
      magnetic: [0, 0.6],
      duration: 0.2,
      ease: "bouncy",
    },
    {
      selector: ".card-secondary",
      preset: "blur-y",
      blur: [0, 8],
      y: [0, -10],
      duration: 0.5,
      ease: "fluid",
    },
  ]}
>
  <div className="card-primary prox-item">Primary — snappy and magnetic</div>
  <div className="card-secondary prox-item">Secondary — slow blur rise</div>
  <div className="prox-item">Fallback — just opacity</div>
</Proximity>`} />
        </section>

        <section id="performance">
          <DocH2>🚀 Performance</DocH2>
          <DocP>
            ZProximity is built from the ground up for 120fps. Here's what happens under the hood
            so you understand why it stays fast — and what can make it slow.
          </DocP>

          <div className="grid md:grid-cols-2 gap-4 my-8">
            {[
              {
                title: '🏎 GSAP Ticker (not React)',
                desc: 'All physics calculations happen in a GSAP ticker — completely outside React\'s render cycle. Zero re-renders on mouse move.',
              },
              {
                title: '⚡ quickTo cache',
                desc: 'On init, a quickTo function is pre-compiled for every property on every element. No property lookup on each frame.',
              },
              {
                title: '🗺 Spatial grid',
                desc: 'Elements are bucketed into a 150px spatial hash grid. Only elements near the cursor are checked each frame — not all of them.',
              },
              {
                title: '👁 IntersectionObserver',
                desc: 'Off-screen elements are automatically suspended. No CPU wasted on elements you can\'t see.',
              },
              {
                title: '🎯 Precision guard',
                desc: 'If intensity changes less than 0.002 between frames, no animation is fired. Keeps idle cost at near-zero.',
              },
              {
                title: '🧹 will-change management',
                desc: 'will-change: transform is applied only when an element enters the influence zone, and removed when it returns to rest. Prevents GPU memory bloat.',
              },
            ].map(s => (
              <div key={s.title} className="border border-[var(--border-color)] p-4 shadow-sm">
                <div className="text-[11px] font-black uppercase tracking-wider mb-2">{s.title}</div>
                <div className="text-[11px] opacity-80 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>

          <DocH3>Things that WILL hurt performance</DocH3>

          <Callout type="danger" icon={<AlertTriangle size={14} />}>
            <ul className="space-y-2 text-[12px]">
              <li><strong>Animating layout properties:</strong> Never animate <Mono>width</Mono>, <Mono>height</Mono>, <Mono>top</Mono>, <Mono>left</Mono>, <Mono>padding</Mono>, or <Mono>margin</Mono> in <Mono>onCalculate</Mono>. Use <Mono>scaleX/Y</Mono> instead of width/height, and <Mono>x/y</Mono> instead of top/left.</li>
              <li><strong>100+ elements with complex filter presets:</strong> Each <Mono>blur</Mono>, <Mono>brightness</Mono>, or <Mono>glow</Mono> triggers a compositing layer per element. Cap at ~50 for filter effects.</li>
              <li><strong>CSS transitions on .prox-item:</strong> They fight GSAP every frame. Remove them entirely.</li>
              <li><strong>Very low precision values:</strong> <Mono>precision={`{0.00001}`}</Mono> means every sub-pixel mouse movement fires animation. Keep it above 0.001.</li>
            </ul>
          </Callout>

          <DocH3>Mobile strategy</DocH3>
          <CodeBlock code={`// Disable everything on touch devices
<Proximity preset="scale-blur-tilt" disableOnMobile={true} />

// Disable only heavy presets, keep lightweight ones
<Proximity
  preset="scale-blur-tilt"
  disableOnMobile={["blur", "tilt"]}  // scale still works on mobile
/>`} />
        </section>

        <section id="api-reference">
          <DocH2>📖 API Reference</DocH2>
          <DocP>Complete reference for all props on the <Mono>Proximity</Mono> component.</DocP>

          <div className="overflow-x-auto border border-[var(--border-color)] my-6 shadow-sm">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-[var(--border-color)]">
                <tr>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">Prop</th>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">Type</th>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">Default</th>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {API_ROWS.map(([prop, type, def, desc]) => (
                  <tr key={prop} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono font-bold text-[11px] whitespace-nowrap">{prop}</td>
                    <td className="p-3 font-mono text-[10px] opacity-70 whitespace-nowrap">{type}</td>
                    <td className="p-3 font-mono text-[10px] opacity-80">{def}</td>
                    <td className="p-3 text-[11px] opacity-90 leading-relaxed">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DocH3>Preset bounds reference</DocH3>
          <DocP>Every preset accepts a <Mono>[from, to]</Mono> tuple to override its range.</DocP>

          <div className="overflow-x-auto border border-[var(--border-color)] my-6 shadow-sm">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-[var(--border-color)]">
                <tr>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">Preset</th>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">Default [from, to]</th>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">What changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {[
                  ['scale',         '[1, 1.5]',           'transform: scale()'],
                  ['flexScale',     '[1, 1.5]',           'transform: scale() + margin offset'],
                  ['x',             '[0, 30]',            'transform: translateX() in px'],
                  ['y',             '[0, -30]',           'transform: translateY() in px'],
                  ['rotate',        '[0, 90]',            'transform: rotate() in degrees'],
                  ['skew',          '[0, 20]',            'transform: skewX() in degrees'],
                  ['opacity',       '[0.2, 1]',           'opacity'],
                  ['blur',          '[8, 0]',             'filter: blur() in px'],
                  ['reveal',        '[110, 0]',           'clip-path inset + translateY in %'],
                  ['scroll',        '[0, 100]',           'scroll-driven offset travel'],
                  ['magnetic',      '[0, 0.1]',           'pull strength multiplier'],
                  ['repel',         '[0, 0.4]',           'push strength multiplier'],
                  ['tilt',          '[0, 30]',            'rotationX/Y in degrees'],
                  ['tiltCard',      '[0, 15]',            'perspective rotationX/Y'],
                  ['weight',        '[100, 900]',         'font-variation-settings wght axis'],
                  ['cipher',        '[0, 1]',             'scramble intensity 0=clear 1=full'],
                  ['glow',          '[0, 20]',            'filter: drop-shadow() spread in px'],
                  ['brightness',    '[0.6, 1.2]',         'filter: brightness()'],
                  ['contrast',      '[0.8, 1.4]',         'filter: contrast()'],
                  ['borderRadius',  '[0, 50]',            'border-radius in %'],
                  ['letterSpacing', '[-0.05, 0.2]',       'letter-spacing in em'],
                  ['grayScale',     '[1, 0]',             'filter: grayscale()'],
                  ['color',         '["#888", "#fff"]',   'text color interpolation'],
                  ['background',    '["transparent","rgba(255,255,255,0.1)"]', 'background-color interpolation'],
                  ['parallax',      '[0, 100]',           'scroll-driven parallax vertical travel'],
                  ['velocitySkew',  '[-15, 15]',          'scroll-velocity based skewing'],
                  ['velocityScale', '[0.95, 1.05]',       'scroll-velocity based squash & stretch'],
                ].map(([p, d, w]) => (
                  <tr key={p} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono font-bold">{p}</td>
                    <td className="p-3 font-mono text-[10px] opacity-70">{d}</td>
                    <td className="p-3 text-[11px] opacity-90">{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DocH3>Built-in ease names</DocH3>
          <div className="flex flex-wrap gap-2 p-5 border border-[var(--border-color)] my-6 shadow-sm">
            {[
              'smooth','heavy','sharp','fluid','bouncy','elastic','jello','bounce',
              'swing','vibrate','robot','ghost','expo','circus','glitch','slowmo',
              'spring','heavySpring','anticipate','launch','drift','whiplash',
            ].map(e => (
              <span key={e} className="text-[10px] font-mono bg-[var(--text-color)] text-[var(--bg-color)] px-2 py-0.5">{e}</span>
            ))}
          </div>
          <p className="text-[11px] opacity-90 leading-relaxed">
            These are shorthand aliases for GSAP eases, tuned specifically for UI physics response.
            You can also pass any raw GSAP ease string like <Mono>"back.out(2.5)"</Mono> or <Mono>"elastic.out(1, 0.3)"</Mono>.
          </p>

          <DocH3>ProximityText additional props</DocH3>
          <div className="overflow-x-auto border border-[var(--border-color)] my-6 shadow-sm">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-[var(--border-color)]">
                <tr>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">Prop</th>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">Type</th>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">Default</th>
                  <th className="p-3 font-black text-[10px] uppercase tracking-widest">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {[
                  ['text',           'string',                    '—',        'The text content to split and animate.'],
                  ['splitBy',        '"letter"|"word"|"line"',    '"letter"', 'How to divide the text into reactive units.'],
                  ['textClassName',  'string',                    '""',       'Class applied to every split span element.'],
                  ['fontFamily',     'string',                    '(global)', 'Override font family for this text.'],
                  ['lineHeight',     'number',                    '1.2',      'Line height of the text container.'],
                  ['letterSpacing',  'number',                    '0',        'Letter spacing in em units.'],
                  ['wordSpacing',    'number',                    '0.5',      'Gap between words in em units.'],
                  ['clipFix',        'string',                    '"0.2em"',  'Padding added to prevent clip during scale/bounce.'],
                  ['ignoreText',     '(string|RegExp)[]',         '—',        'Characters or patterns to skip from animation.'],
                  ['dir',            '"ltr"|"rtl"|"auto"',        '"auto"',   'Directionality. Automatically supports Arabic parsing.'],
                ].map(([prop, type, def, desc]) => (
                  <tr key={prop} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono font-bold text-[11px]">{prop}</td>
                    <td className="p-3 font-mono text-[10px] opacity-70">{type}</td>
                    <td className="p-3 font-mono text-[10px] opacity-80">{def}</td>
                    <td className="p-3 text-[11px] opacity-90 leading-relaxed">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-16 p-10 border border-[var(--border-color)] mono-grid relative overflow-hidden shadow-2xl">
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-6 text-center">
              You've read the whole thing. You deserve a reward.
            </div>
            <div className="flex items-center justify-center">
              <Proximity
                onCalculate={(intensity, dist, dx, dy) => ({
                  scaleX: 1 + intensity * 0.4,
                  scaleY: 1 - intensity * 0.08,
                  filter: `hue-rotate(${intensity * 240}deg) brightness(${1 + intensity * 0.3}) drop-shadow(0 0 ${intensity * 20}px var(--text-color))`,
                  rotation: (dx / Math.max(Math.abs(dx), 1)) * intensity * 8,
                  y: -intensity * 12,
                })}
                onReset={() => ({
                  scaleX: 1, scaleY: 1,
                  filter: 'hue-rotate(0deg) brightness(1) drop-shadow(0 0 0px transparent)',
                  rotation: 0, y: 0,
                })}
                reach={2.5}
              >
                <ProximityText
                  preset='reveal'
                  text="NOW GO BUILD SOMETHING WILD"
                  mode="scroll"
                  splitBy="word"
                  textClassName="text-xl md:text-3xl font-black tracking-tighter text-center"
                  wordSpacing={0.5}
                  selector=".prox-part"
                  config={{
                      scroll: { once: false }
                    }}
                />
              </Proximity>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}