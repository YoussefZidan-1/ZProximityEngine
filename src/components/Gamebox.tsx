import { useState, useMemo, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Proximity, ProximityText } from '../lib';
import { 
  Zap, Type, MousePointer2, RefreshCw, AlertCircle, Code2 
} from 'lucide-react';

const INITIAL_PROX = `<Proximity
  preset="scale-magnetic"
  reach={2.5}
  scale={[1, 1.5]}
  magnetic={[0, 0.4]}
  ease="bouncy"
>
  <div class="flex flex-wrap justify-center gap-6">
    <div class="prox-item w-24 h-24 bg-[var(--text-color)] text-[var(--bg-color)] rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl">1</div>
    <div class="prox-item w-24 h-24 bg-[var(--text-color)] text-[var(--bg-color)] rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl">2</div>
    <div class="prox-item w-24 h-24 bg-[var(--text-color)] text-[var(--bg-color)] rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl">3</div>
  </div>
</Proximity>`;

const INITIAL_TEXT = `<ProximityText
  text="VOID & SOUL"
  preset="cipher-opacity-weight"
  reach={2}
  splitBy="word"
  cipher={[0, 1]}
  textClassName="text-5xl font-black italic tracking-tighter"
  style={{ color: 'var(--text-color)' }}
/>`;

export default function Gamebox() {
  const [code, setCode] = useState(INITIAL_PROX);
  const [debouncedCode, setDebouncedCode] = useState(INITIAL_PROX);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedCode(code);
      }, 500);
      return () => clearTimeout(timer);
    }, [code]);
  // Safely evaluates numbers, arrays, strings, and objects (handles double braces safely)
  const parseProps = (codeString: string) => {
    const props: any = {};
    const regex = /([a-zA-Z0-9_]+)\s*=\s*({[\s\S]*?}|"[\s\S]*?"|'[\s\S]*?')/g;
    let match;

    while ((match = regex.exec(codeString)) !== null) {
      const key = match[1];
      let rawValue = match[2];

      // Safe fallback: If the regex cuts off a double-brace style={{...}}, find the end
      if (rawValue.startsWith('{{') && !rawValue.endsWith('}}')) {
        const remainingPart = codeString.slice(regex.lastIndex);
        const secondBraceIndex = remainingPart.indexOf('}');
        if (secondBraceIndex !== -1) {
          rawValue += remainingPart.slice(0, secondBraceIndex + 1);
          regex.lastIndex += secondBraceIndex + 1;
        }
      }

      try {
        if (rawValue.startsWith('{')) {
          const expression = rawValue.slice(1, -1).trim();
          // Evaluate standard JS objects/numbers/arrays safely locally
          props[key] = new Function(`return (${expression})`)();
        } else {
          // Remove wrapping quotes for standard strings
          props[key] = rawValue.slice(1, -1);
        }
      } catch (e) {
        throw new Error(`Syntax error in prop: ${key}`);
      }
    }
    return props;
  };

  const parsedData = useMemo(() => {
    try {
      const isText = debouncedCode.includes('<ProximityText');
      const type = isText ? 'ProximityText' : 'Proximity';

      let propsString = '';
      let innerHTML = '';

      if (isText) {
        const textMatch = debouncedCode.match(/<ProximityText([\s\S]*?)\/?>/);
        if (textMatch) propsString = textMatch[1];
      } else {
        // Extract everything inside the Proximity tags
        const proxMatch = debouncedCode.match(/<Proximity([\s\S]*?)>([\s\S]*?)<\/Proximity>/);
        if (proxMatch) {
          propsString = proxMatch[1];
          // 1. Convert React's className to standard HTML class
          const rawHTML = proxMatch[2].replace(/className=/g, 'class=');
          // 2. SANITIZE: Strip out malicious <script> tags or onerror= attacks
          innerHTML = DOMPurify.sanitize(rawHTML, {
            ALLOWED_TAGS: ['div', 'span', 'img', 'svg', 'path', 'button', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'br'],
            ALLOWED_ATTR: ['class', 'id', 'src', 'alt', 'href', 'style', 'd', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
          });
        } else {
          throw new Error("Missing <Proximity> or </Proximity> tags.");
        }
      }

      const props = parseProps(propsString);
      setError(null);
      return { type, props, innerHTML };
    } catch (e: any) {
      setError(e.message || "Parsing error: Check your JSX structure.");
      return null;
    }
  }, [debouncedCode]);

  return (
    <section id="gamebox" className="w-full border-b border-[var(--border-color)] bg-[var(--bg-color)]">
      <div className="flex flex-col md:flex-row items-center justify-between p-10 border-b border-[var(--border-color)] gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-[var(--text-color)] text-[var(--bg-color)] p-3 rounded-sm">
            <Zap size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50 block mb-1">04 / Sandbox</span>
            <h2 className="text-2xl font-black font-sans italic tracking-tighter">The Gamebox</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCode(INITIAL_PROX)}
            className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-[var(--border-color)] transition-all flex items-center gap-2 ${parsedData?.type === 'Proximity' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            <MousePointer2 size={14} /> &lt;Proximity /&gt;
          </button>
          <button 
            onClick={() => setCode(INITIAL_TEXT)}
            className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-[var(--border-color)] transition-all flex items-center gap-2 ${parsedData?.type === 'ProximityText' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            <Type size={14} /> &lt;ProximityText /&gt;
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Codespace */}
        <div className="lg:w-1/2 flex flex-col border-r border-[var(--border-color)] bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-color)]">
            <div className="flex items-center gap-2">
              <Code2 size={14} className="opacity-40" />
              <span className="text-[10px] font-mono uppercase font-bold opacity-40">Live Component Editor</span>
            </div>
            {error && <span className="text-[9px] text-red-500 font-bold tracking-widest uppercase">Syntax Error</span>}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 p-10 font-mono text-[12px] bg-transparent outline-none resize-none leading-relaxed text-[var(--text-color)]"
          />
        </div>

        {/* Viewport */}
        <div className="lg:w-1/2 flex flex-col relative mono-grid min-h-[450px]">
          <div className="absolute top-8 left-8 z-10 flex gap-2">
            <button 
              onClick={() => setCode(parsedData?.type === 'Proximity' ? INITIAL_PROX : INITIAL_TEXT)}
              className="p-3 border border-[var(--border-color)] bg-[var(--bg-color)] shadow-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              title="Reset Code"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-12 w-full">
            {!error && parsedData ? (
              parsedData.type === "Proximity" ? (
                <Proximity {...parsedData.props} key={debouncedCode}>
                  <div 
                    className="w-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: parsedData.innerHTML }} 
                  />
                </Proximity>
              ) : (
                <ProximityText {...parsedData.props} key={debouncedCode} />
              )
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 p-8 rounded max-w-xs text-center">
                <AlertCircle className="text-red-500 mx-auto mb-3" />
                <p className="text-red-500 text-[11px] font-mono leading-relaxed">{error}</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-[var(--border-color)] text-center bg-[var(--bg-color)]">
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-30">
              Pointer-Driven Simulation
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}