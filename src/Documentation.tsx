import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Proximity, ProximityText, ProximityConfig  } from './lib';
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
      ↓ Scroll up and down fast to see independent scroll behaviors
    </p>
    <Proximity
      mode="scroll"
      config={{
        scroll: { 
          start: 'top 95%', 
          end: 'bottom 10%', 
          scrub: 1.2, 
          once: false,
          envelope: [0.25, 0.75],
          velocityMap: {
            blur: [0, 8]
          }
        },
        targets: [
          {
            selector: ".item-reveal",
            preset: "y-opacity",
            y: [100, 0],
            opacity: [0, 1]
          },
          {
            selector: ".item-tilt",
            preset: "tiltCard-velocitySkew",
            tiltCard: [0, 25],
            velocitySkew: [-15, 15],
            opacity: [0.3, 1]
          },
          {
            selector: ".item-parallax",
            preset: "scale-parallax",
            scale: [0.8, 1.15],
            parallax: [0, 120],
            opacity: [0.3, 1]
          }
        ]
      }}
      className="flex flex-col md:flex-row gap-6 justify-center items-center"
    >
      {/* Box 1: Vertically slides and fades in */}
      <div className="prox-item item-reveal w-full md:w-44 h-52 bg-white/5 border border-white/10 text-white p-6 flex flex-col justify-between shadow-2xl">
        <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Card 1 / Reveal</span>
        <span className="text-3xl font-black italic tracking-tighter">REVEAL Y</span>
      </div>

      {/* Box 2: Tilts dynamically based on scroll speed */}
      <div className="prox-item item-tilt w-full md:w-44 h-52 bg-white/5 border border-white/10 text-white p-6 flex flex-col justify-between shadow-2xl">
        <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Card 2 / Speed Tilt</span>
        <span className="text-3xl font-black italic tracking-tighter">VELO TILT</span>
      </div>

      {/* Box 3: Performs a vertical parallax slide */}
      <div className="prox-item item-parallax w-full md:w-44 h-52 bg-white/5 border border-white/10 text-white p-6 flex flex-col justify-between shadow-2xl" data-speed="1.5">
        <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Card 3 / Speed 1.5x</span>
        <span className="text-3xl font-black italic tracking-tighter">PARALLAX</span>
      </div>
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
  }, []);

  const scrollToSection = useCallback((id: string) => {
    gsap.to(window, { duration: 1.2, scrollTo: { y: `#${id}`, offsetY: 100 }, ease: 'power3.inOut' });
    setIsSidebarOpen(false);
  }, []);

  // Standard Group-Trigger Stagger Props for Documentation blocks
  const groupRevealConfig: ProximityConfig = {
    scroll: { triggerMode: "group" as const, start: "top 90%", scrub: false },
    stagger: 0.1,
    y: [40, 0],
    opacity: [0, 1]
  };

  return (
    <div
      ref={containerRef}
      className="flex relative items-start w-full bg-[var(--bg-color)] text-[var(--text-color)] border-t border-[var(--border-color)]"
    >
      {/* Sticky Scroll Progress tracker on top of documentation wrapper */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 z-30">
        <Proximity
          mode="scroll"
          preset="background"
          config={{
            scroll: { start: "top top", end: "bottom bottom", scrub: true },
            background: ["transparent", "var(--text-color)"]
          }}
          className="h-full w-full"
        />
      </div>

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
        
        {/* Viewport Center Focal lens tracker directly mapped to sidebar items */}
        <Proximity
          mode="scroll"
          preset="scale-brightness"
          config={{
            scroll: { mode: "lens", lensCenter: [0.5, 0.5], lensRadius: 0.4, scrub: 1.2 },
            scale: [0.9, 1.05],
            brightness: [0.5, 1.1]
          }}
          className="p-4 space-y-0.5 flex flex-col"
        >
          {SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`prox-item w-full text-left px-3 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2 rounded-sm ${
                activeSection === sec.id
                  ? 'bg-[var(--text-color)] text-[var(--bg-color)] font-black'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span>{sec.icon}</span>
              {sec.title}
            </button>
          ))}
        </Proximity>

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

        {/* ==============================================
            Immersive Staggered Sections Wrapped in Proximity Group Trigger Mode
            ============================================== */}

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="mental-model"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>🧠 The Mental Model</DocH2>
            <p className="text-[10px] uppercase tracking-widest opacity-70 mb-6 font-bold">Before writing a single line of code — understand this</p>
          </div>

          <div className="prox-item">
            <DocP>
              ZProximity Engine does one thing: it <strong>measures the distance between your cursor and every element you care about</strong>,
              then converts that distance into a 0→1 intensity value. Everything else — scaling, blurring, color, physics — is just
              a function of that number.
            </DocP>
          </div>

          <div className="prox-item grid md:grid-cols-3 gap-4 my-8">
            {[
              { icon: <MousePointer size={20} />, label: 'Cursor → Distance', desc: 'Every frame, we measure how far the cursor is from each .prox-item in pixels.' },
              { icon: <Cpu size={20} />, label: 'Distance → Intensity', desc: 'Distance is converted to 0.0–1.0 intensity using your reach and falloff settings.' },
              { icon: <Zap size={20} />, label: 'Intensity → Preset', desc: 'The intensity drives every visual property — scale, blur, color, position, rotation.' },
            ].map(s => (
              <div key={s.label} className="border border-[var(--border-color)] p-5 shadow-sm bg-black/5 dark:bg-white/5">
                <div className="mb-3 opacity-80">{s.icon}</div>
                <div className="text-[11px] font-black uppercase tracking-wider mb-2">{s.label}</div>
                <div className="text-[11px] opacity-80 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>

          <div className="prox-item">
            <DocP>
              The intensity curve is <strong>exponential</strong>, not linear. This is why the effect feels organic — things don't
              mechanically slide at a fixed rate, they snap to life the closer you get, exactly like real magnetic fields.
            </DocP>
          </div>

          <div className="prox-item">
            <MentalModelVisualizer />
          </div>

          <div className="prox-item">
            <Callout type="tip" icon={<Sparkles size={14} />}>
              <strong>The "aha" moment:</strong> Every preset — <Mono>scale</Mono>, <Mono>blur</Mono>, <Mono>magnetic</Mono>,
              <Mono>cipher</Mono> — is just a different formula that takes intensity (0→1) and spits out a CSS/GSAP property.
              They all run on the same engine. You can chain unlimited presets together.
            </Callout>
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="installation"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>📦 Installation</DocH2>
          </div>
          <div className="prox-item">
            <CodeBlock code="npm install z-proximity-engine gsap @gsap/react" label="terminal" />
          </div>
          <div className="prox-item">
            <Callout type="warn" icon={<AlertTriangle size={14} />}>
              <strong>Peer dependencies required.</strong> ZProximity Engine uses GSAP as its animation core.
              You must install both <Mono>gsap</Mono> and <Mono>@gsap/react</Mono> separately — they are not bundled.
            </Callout>
          </div>
          <div className="prox-item">
            <DocH3>Two components, one purpose</DocH3>
          </div>
          <div className="prox-item grid md:grid-cols-2 gap-4 my-6">
            <div className="border border-[var(--border-color)] p-5 shadow-sm bg-black/5 dark:bg-white/5">
              <div className="text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--text-color)] rounded-full" />
                Proximity
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed mb-4">
                The core wrapper. Put it around any elements — divs, images, cards, icons.
                Children with <Mono>.prox-item</Mono> class become reactive.
              </p>
              <CodeBlock code={`import { Proximity } from 'z-proximity-engine';\n\n<Proximity preset="scale" reach={2}>\n  <div className="prox-item">I react</div>\n  <div>I don't react</div>\n  <div className="prox-item">I react too</div>\n</Proximity>`} />
            </div>
            <div className="border border-[var(--border-color)] p-5 shadow-sm bg-black/5 dark:bg-white/5">
              <div className="text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--text-color)] rounded-full" />
                ProximityText
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed mb-4">
                Automatically splits text into individual letters or words and makes each one reactive. No manual span-wrapping needed.
              </p>
              <CodeBlock code={`import { ProximityText } from 'z-proximity-engine';\n\n<ProximityText\n  text="Hello World"\n  splitBy="letter"\n  preset="scale-blur"\n/>`} />
            </div>
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="your-first-effect"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>⚡ Your First Effect</DocH2>
            <DocP>
              The simplest possible setup. Wrap your elements, add the <Mono>prox-item</Mono> class,
              pick a preset. That's genuinely it.
            </DocP>
          </div>
          <div className="prox-item">
            <LiveEditor
              preset="scale"
              initialConfig={`{\n  preset: "scale",\n  reach: 1.5,\n  duration: 0.3,\n  ease: "bouncy"\n}`}
              label="Your first effect — edit anything"
            />
          </div>
          <div className="prox-item">
            <DocH3>How the selector works</DocH3>
            <DocP>
              By default, <Mono>Proximity</Mono> looks for children with the class <Mono>.prox-item</Mono>.
              You can override this with the <Mono>selector</Mono> prop to target any CSS selector inside the container.
            </DocP>
          </div>
          <div className="prox-item">
            <CodeBlock
              code={`// Default — use .prox-item class\n<Proximity preset="scale">\n  <div className="prox-item">Reacts</div>\n</Proximity>\n\n// Custom selector\n<Proximity preset="scale" selector=".my-card">\n  <div className="my-card">Also reacts</div>\n</Proximity>\n\n// Multiple selectors\n<Proximity preset="scale" selector=".card, .icon, button">\n  <div className="card">React</div>\n  <button>Also reacts</button>\n</Proximity>`}
            />
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="reach-falloff"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>📡 Reach & Falloff</DocH2>
            <DocP>
              These two numbers control the <em>shape</em> of your proximity field. Most devs tune them
              by feel — the explorer below lets you do exactly that.
            </DocP>
          </div>
          <div className="prox-item grid md:grid-cols-2 gap-6 my-6">
            <div className="border border-[var(--border-color)] p-5 shadow-sm bg-black/5 dark:bg-white/5">
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
            <div className="border border-[var(--border-color)] p-5 shadow-sm bg-black/5 dark:bg-white/5">
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
          <div className="prox-item">
            <ReachFalloffExplorer />
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="preset-chaining"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>🔗 Preset Chaining</DocH2>
            <DocP>
              The most powerful feature. Join any presets with a dash and they all run simultaneously.
              The engine computes them all in the same animation frame — zero performance penalty for combining.
            </DocP>
          </div>
          <div className="prox-item">
            <CodeBlock code={`// Single preset\npreset="scale"\n\n// Two combined\npreset="scale-opacity"\n\n// Full cinematic combo\npreset="scale-blur-rotate-magnetic"\n\n// As many as you want — they ALL run in one GSAP tick\npreset="scale-blur-rotate-tilt-opacity-color-borderRadius"`} />
          </div>
          <div className="prox-item">
            <PresetChainBuilder />
          </div>
          <div className="prox-item">
            <DocH3>Override individual preset ranges</DocH3>
            <DocP>
              Each preset has sensible defaults, but you can override the <em>[from, to]</em> range for any of them:
            </DocP>
          </div>
          <div className="prox-item">
            <CodeBlock code={`<Proximity\n  preset="scale-blur-rotate"\n  scale={[1, 2.5]}       // default was [1, 1.5]\n  blur={[20, 0]}         // heavy blur that clears on hover\n  rotate={[-45, 0]}      // spins in from -45deg\n  reach={2}\n/>`} />
          </div>
          <div className="prox-item">
            <EaseTester />
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="styling-aesthetics"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>✨ Styling & Aesthetics</DocH2>
            <DocP>
              Physics aren't just for transforms. You can drive visual aesthetics—colors, shadows, filters, and border radii—directly from spatial proximity.
            </DocP>
          </div>
          <div className="prox-item grid md:grid-cols-2 gap-6 my-6">
            <div className="border border-[var(--border-color)] p-8 flex flex-col items-center justify-center mono-grid min-h-[250px] shadow-xl relative group bg-black/5 dark:bg-white/5">
              <span className="absolute top-4 left-4 text-[9px] uppercase font-bold tracking-widest opacity-60">Glow & Color Shift</span>
              <Proximity preset="glow-color" glow={[0, 40]} color={["var(--text-color)", "#3b82f6"]} reach={2}>
                <div className="prox-item text-5xl font-black tracking-tighter">NEON</div>
              </Proximity>
            </div>
            <div className="border border-[var(--border-color)] p-8 flex flex-col items-center justify-center mono-grid min-h-[250px] shadow-xl relative group bg-black/5 dark:bg-white/5">
              <span className="absolute top-4 left-4 text-[9px] uppercase font-bold tracking-widest opacity-60">Border Radius & Background</span>
              <Proximity preset="borderRadius-rotate-background-scale" borderRadius={[0, 50]} background={["transparent", "var(--text-color)"]} rotate={[0, 90]} scale={[1, 1.2]} reach={2}>
                <div className="prox-item w-24 h-24 border-2 border-[var(--text-color)] flex items-center justify-center font-bold text-[var(--bg-color)]">
                </div>
              </Proximity>
            </div>
          </div>
          <div className="prox-item">
            <CodeBlock code={`// 1. Color Shift & Drop Shadow Glow\n<Proximity \n  preset="glow-color" \n  glow={[0, 30]} \n  color={["var(--text-color)", "#3b82f6"]}\n>\n  <div className="prox-item">NEON</div>\n</Proximity>\n\n// 2. Border Morphing & Background Color\n<Proximity \n  preset="borderRadius-rotate-background" \n  borderRadius={[0, 50]} \n  background={["transparent", "var(--text-color)"]}\n>\n  <div className="prox-item w-24 h-24 border-2"></div>\n</Proximity>`} />
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="common-mistakes"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>⚠️ Common Mistakes</DocH2>
            <DocP>
              These are the bugs that waste hours. Read them once, save yourself the pain.
            </DocP>
          </div>
          <div className="prox-item">
            <MistakeCard
              title="Forgetting .prox-item"
              wrong={`// Nothing happens — no .prox-item class!\n<Proximity preset="scale" reach={2}>\n  <div>Why isn't this working?</div>\n  <button>Or this?</button>\n</Proximity>`}
              right={`// Add .prox-item to every element you want to react\n<Proximity preset="scale" reach={2}>\n  <div className="prox-item">This works</div>\n  <button className="prox-item">This too</button>\n</Proximity>`}
              explanation="Proximity uses CSS class targeting. Only elements with .prox-item (or your custom selector) are registered. The rest are invisible to the engine."
            />
          </div>
          <div className="prox-item">
            <MistakeCard
              title="Using CSS transitions alongside Proximity"
              wrong={`/* In your CSS */\n.prox-item {\n  transition: transform 0.3s ease; /* CONFLICTS with GSAP */\n}\n\n/* Proximity + CSS transitions fight each other every frame */`}
              right={`/* Remove the CSS transition entirely */\n.prox-item {\n  /* No transition needed — GSAP handles ALL animation */\n}\n\n/* Control speed via Proximity props instead */\n<Proximity preset="scale" duration={0.3} ease="bouncy" />`}
              explanation="CSS transitions and GSAP both try to animate the same properties simultaneously, causing jitter. GSAP wins the property but wastes CPU fighting the transition. Remove any CSS transitions on .prox-item elements."
            />
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="text-magic"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>✍️ Text Magic</DocH2>
            <DocP>
              Manually wrapping every character in a span is one of the most tedious tasks in GSAP work.
              <Mono>ProximityText</Mono> does it for you — letters, words, or lines — all reactive, all accessible.
            </DocP>
          </div>
          <div className="prox-item grid md:grid-cols-3 gap-4 my-6">
            {[
              { split: 'letter', desc: 'Each character is its own reactive target. Best for dramatic headline effects.' },
              { split: 'word',   desc: 'Each word is a reactive target. Great for body text and call-to-actions.' },
              { split: 'line',   desc: 'Each line is a reactive target. Best for scroll reveals with stagger.' },
            ].map(s => (
              <div key={s.split} className="border border-[var(--border-color)] p-4 shadow-sm bg-black/5 dark:bg-white/5">
                <Mono>splitBy="{s.split}"</Mono>
                <p className="text-[11px] opacity-80 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="prox-item">
            <LiveEditor
              preset="scale-opacity"
              mode="text"
              initialConfig={`{\n  preset: "scale-opacity",\n  splitBy: "letter",\n  scale: [1, 1.8],\n  opacity: [0.2, 1],\n  reach: 1.5,\n  ease: "bouncy",\n  duration: 0.3\n}`}
              label="Letter-level physics — edit preset and splitBy"
            />
          </div>
          <div className="prox-item">
            <LiveEditor
              preset="y-opacity"
              mode="text-word"
              height={250}
              initialConfig={`{\n  preset: "y-opacity",\n  splitBy: "word",\n  y: [20, 0],\n  opacity: [0.1, 1],\n  reach: 2,\n  ease: "elastic",\n  duration: 0.5\n}`}
              label="Word-level physics"
            />
          </div>
          <div className="prox-item">
            <DocH3>Full Arabic & RTL Support</DocH3>
            <DocP>
              <Mono>ProximityText</Mono> seamlessly handles Arabic diacritics, ligatures (like Lam-Alef), and continuous cursive connections without breaking the font joining behavior.
            </DocP>
          </div>
          <div className="prox-item border border-[var(--border-color)] mono-grid flex items-center justify-center p-10 my-6 shadow-xl bg-black/5 dark:bg-white/5">
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
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="neighbor-nearest"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>🎯 Neighbor vs Nearest</DocH2>
            <DocP>
              This is the feature that separates a basic hover effect from something that feels alive.
              Instead of every element doing the same thing on hover, you split the behavior —
              the closest element does one thing, everything around it does something else.
            </DocP>
          </div>
          <div className="prox-item">
            <Callout type="tip" icon={<Heart size={14} />}>
              <strong>The macOS Dock effect</strong> — closest icon scales up (nearestPreset), neighboring icons spread apart (neighborPreset) — is exactly this feature. Two lines of code.
            </Callout>
          </div>
          <div className="prox-item">
            <NeighborNearestDemo />
          </div>
          <div className="prox-item">
            <CodeBlock code={`// The full dock pattern\n<Proximity\n  nearestPreset="scale-magnetic-y"   // closest element: grows + pulls to cursor\n  neighborPreset="repel"      // all others: scatter\n  scale={[1, 1.5]}\n  magnetic={[0, 0.4]}\n  repel={[0, 0.4]}\n  blur={[0, 6]}\n  reach={2.5}\n>\n  {icons.map(icon => (\n    <div key={icon} className="prox-item w-12 h-12">\n      {icon}\n    </div>\n  ))}\n</Proximity>`} />
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="scroll-mode"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>📜 Scroll Mode</DocH2>
            <DocP>
              Switch from cursor tracking to viewport scroll tracking with a single prop.
              All the same presets, all the same physics — but now driven by how far the
              user has scrolled rather than where their mouse is.
            </DocP>
          </div>
          <div className="prox-item">
            <CodeBlock code={`// Switch to scroll mode
<Proximity mode="scroll" preset="y-opacity" config={{
  scroll: {
    start: "top 90%",   // trigger when element top hits 90% down the viewport
    end: "bottom 10%",  // complete when element bottom hits 10%
    scrub: 1.2,         // smooth scrubbing (removes scroll shaking)
    once: false,        // animate in and out
    envelope: [0.25, 0.75], // hold 100% state for the middle 50% of the scroll
  },
  y: [60, 0],
  opacity: [0, 1],
}}>
  <div className="prox-item">Animates in on scroll</div>
  <div className="prox-item">With a 150ms delay</div>
  <div className="prox-item">And another 150ms delay</div>
</Proximity>`} />
          </div>
          <div className="prox-item">
            <ScrollDemo />
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="custom-physics"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>🔬 Custom Physics</DocH2>
            <DocP>
              When no preset combination achieves what you need, <Mono>onCalculate</Mono> gives you
              raw access to the engine's internals every single animation frame.
            </DocP>
          </div>
          <div className="prox-item">
            <CodeBlock code={`<Proximity\n  reach={2}\n  onCalculate={(intensity, distance, dx, dy, isNearest) => {\n    return {\n      scaleX: 1 + intensity * 0.4,\n      scaleY: 1 - intensity * 0.1,   // squash effect\n      filter: \`hue-rotate(\${intensity * 180}deg)\`,\n      y: isNearest ? -20 : 0,\n      rotation: dy * 0.05,\n    };\n  }}\n  onReset={() => ({\n    scaleX: 1, scaleY: 1,\n    filter: 'hue-rotate(0deg)',\n    y: 0, rotation: 0,\n  })}\n>\n  <div className="prox-item">Custom physics</div>\n</Proximity>`} />
          </div>
          <div className="prox-item">
            <LiveEditor
              preset=""
              initialConfig={`{\n  reach: 1.8,\n  onCalculate: (intensity, dist, dx, dy) => ({\n    scaleX: 1 + intensity * 0.6,\n    scaleY: 1 - intensity * 0.15,\n    filter: \`hue-rotate(\${intensity * 200}deg) brightness(\${1 + intensity * 0.4})\`,\n    rotation: dy * 0.03,\n  }),\n  onReset: () => ({\n    scaleX: 1, scaleY: 1,\n    filter: "hue-rotate(0deg) brightness(1)",\n    rotation: 0,\n  })\n}`}
              label="Custom physics — try editing onCalculate"
            />
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="performance"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>🚀 Performance</DocH2>
            <DocP>
              ZProximity is built from the ground up for 120fps. Here's what happens under the hood
              so you understand why it stays fast — and what can make it slow.
            </DocP>
          </div>
          <div className="prox-item grid md:grid-cols-2 gap-4 my-8">
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
            ].map(s => (
              <div key={s.title} className="border border-[var(--border-color)] p-4 shadow-sm bg-black/5 dark:bg-white/5">
                <div className="text-[11px] font-black uppercase tracking-wider mb-2">{s.title}</div>
                <div className="text-[11px] opacity-80 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </Proximity>

        <Proximity
          mode="scroll"
          preset="reveal-y-opacity"
          config={groupRevealConfig}
          id="api-reference"
          className="scroll-mt-24 mb-20 flex flex-col"
        >
          <div className="prox-item">
            <DocH2>📖 API Reference</DocH2>
            <DocP>Complete reference for all props on the <Mono>Proximity</Mono> component.</DocP>
          </div>
          <div className="prox-item overflow-x-auto border border-[var(--border-color)] my-6 shadow-sm">
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
        </Proximity>

      </main>
    </div>
  );
}