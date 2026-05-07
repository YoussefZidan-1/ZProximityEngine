import React, { useState, useEffect, useMemo } from 'react';
import { Proximity, ProximityText } from '../lib';
import { 
  Terminal, Plus, Minus, Zap, Type, 
  MousePointer2, RefreshCw, AlertCircle, Code2 
} from 'lucide-react';

const INITIAL_PROX = `<Proximity
  preset="scale-magnetic"
  reach={2.5}
  scale={[1, 1.5]}
  magnetic={[0, 0.4]}
  ease="bouncy"
>
  <div className="prox-item">1</div>
  <div className="prox-item">2</div>
  <div className="prox-item">3</div>
</Proximity>`;

const INITIAL_TEXT = `<ProximityText
  text="VOID & SOUL"
  preset="cipher-opacity-weight"
  reach={2}
  splitBy="word"
  cipher={[0, 1]}
  textClassName="text-5xl font-black italic tracking-tighter"
/>`;

export default function Gamebox() {
  const [code, setCode] = useState(INITIAL_PROX);
  const [error, setError] = useState<string | null>(null);

  // Safe prop evaluator for numbers, arrays, objects, and strings
  const parseProps = (codeString: string) => {
    const props: any = {};
    const regex = /([a-zA-Z0-9]+)=({[\s\S]*?}|"[\s\S]*?")/g;
    let match;

    while ((match = regex.exec(codeString)) !== null) {
      const key = match[1];
      const rawValue = match[2];
      try {
        if (rawValue.startsWith('{')) {
          const expression = rawValue.slice(1, -1).trim();
          props[key] = new Function(`return (${expression})`)();
        } else {
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
      const isText = code.includes('<ProximityText');
      const type = isText ? 'ProximityText' : 'Proximity';

      // 1. Extract Props from the opening tag
      const openingTagMatch = code.match(/<[a-zA-Z]+([\s\S]*?)>/);
      const propsString = openingTagMatch ? openingTagMatch[1] : "";
      const props = parseProps(propsString);

      // 2. Extract Children (Numbers inside the divs)
      let children: string[] = [];
      if (!isText) {
        // Find everything between > and < inside the prox-item divs
        const itemRegex = /<div[^>]*prox-item[^>]*>([\s\S]*?)<\/div>/g;
        let itemMatch;
        while ((itemMatch = itemRegex.exec(code)) !== null) {
          children.push(itemMatch[1].trim());
        }
      }

      setError(null);
      return { type, props, children };
    } catch (e: any) {
      setError(e.message || "Parsing error: Check your JSX structure.");
      return null;
    }
  }, [code]);

  const updateItems = (action: 'add' | 'remove') => {
    if (!parsedData || parsedData.type !== 'Proximity') return;
    
    let newItems = [...parsedData.children];
    if (action === 'add') {
      newItems.push((newItems.length + 1).toString());
    } else {
      newItems.pop();
    }

    // Rebuild the code string
    const propString = Object.entries(parsedData.props)
      .map(([k, v]) => `  ${k}={${JSON.stringify(v)}}`)
      .join('\n');

    const itemString = newItems
      .map(num => `  <div className="prox-item">${num}</div>`)
      .join('\n');

    setCode(`<Proximity\n${propString}\n>\n${itemString}\n</Proximity>`);
  };

  return (
    <section id="gamebox" className="w-full border-b border-[var(--border-color)] bg-[var(--bg-color)]">
      {/* UI Header - Preserved from original */}
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
            className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-[var(--border-color)] transition-all flex items-center gap-2 ${parsedData?.type === 'Proximity' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5'}`}
          >
            <MousePointer2 size={14} /> &lt;Proximity /&gt;
          </button>
          <button 
            onClick={() => setCode(INITIAL_TEXT)}
            className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-[var(--border-color)] transition-all flex items-center gap-2 ${parsedData?.type === 'ProximityText' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'hover:bg-black/5'}`}
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
            {parsedData?.type === "Proximity" && (
              <div className="flex border border-[var(--border-color)] bg-[var(--bg-color)] shadow-xl overflow-hidden">
                <button onClick={() => updateItems('add')} className="px-4 py-3 hover:bg-black/5 border-r border-[var(--border-color)] transition-all" title="Add Item">
                  <Plus size={16} />
                </button>
                <button onClick={() => updateItems('remove')} className="px-4 py-3 hover:bg-black/5 transition-all" title="Remove Item">
                  <Minus size={16} />
                </button>
              </div>
            )}
            <button 
              onClick={() => setCode(parsedData?.type === 'Proximity' ? INITIAL_PROX : INITIAL_TEXT)}
              className="p-3 border border-[var(--border-color)] bg-[var(--bg-color)] shadow-xl hover:bg-black/5 transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-12">
            {!error && parsedData ? (
              parsedData.type === "Proximity" ? (
                <Proximity {...parsedData.props} key={code}>
                  <div className="flex flex-wrap justify-center gap-6">
                    {parsedData.children.map((num, i) => (
                      <div key={i} className="prox-item w-24 h-24 bg-[var(--text-color)] text-[var(--bg-color)] rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl">
                        {num}
                      </div>
                    ))}
                  </div>
                </Proximity>
              ) : (
                <ProximityText {...parsedData.props} key={code} />
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