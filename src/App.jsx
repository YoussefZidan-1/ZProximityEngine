import React, { useState, useMemo, lazy, Suspense } from "react";
import { ProximityText } from "./lib/ProximityText";
import { Proximity } from "./lib/Proximity";
const PresetCard = lazy(() => import("./components/PresetCard").then(module => ({ default: module.PresetCard })));
import {
  Type, Maximize, Move, Layers, Copy, Check, MousePointer2,
  Sparkles, Eye, EyeOff, LayoutGrid, CaseUpper, Code2, BookOpen, Fingerprint, Settings, Globe, Wand2, ChevronDown
} from "lucide-react";

// Ease Options
const easeOptions =[
  "smooth", "heavy", "sharp", "fluid", "bouncy", "elastic", 
  "jello", "bounce", "swing", "vibrate", "robot", "ghost", 
  "expo", "circus", "glitch", "slowmo",
];

// --- DOCUMENTATION HELPER COMPONENTS ---
const DocSection = ({ icon: Icon, title, description, children, code }) => {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      backgroundColor: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: "20px", padding: "clamp(15px, 5vw, 30px)", 
      marginBottom: "20px", display: "grid", 
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", 
      gap: "30px", alignItems: "start"
    }}>
      <div style={{ textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fff", marginBottom: "12px", fontWeight: "bold" }}>
          <Icon size={20} color="#10b981" /> {title}
        </div>
        <p style={{ color: "#888", fontSize: "14px", lineHeight: "1.6", marginBottom: "0" }}>
          {description}
        </p>
        
        <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
          <button 
            onClick={() => setShowCode(!showCode)} 
            style={{ background: "transparent", border: "1px solid #333", color: "#fff", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", transition: "0.3s" }}
          >
            <ChevronDown size={14} style={{ transform: showCode ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }} /> 
            {showCode ? "Hide Code" : "Show Code"}
          </button>
          
          {showCode && (
            <button 
              onClick={handleCopy} 
              style={{ background: copied ? "#10b981" : "#1a1a1a", border: "none", color: copied ? "#fff" : "#aaa", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", transition: "0.3s" }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy Snippet"}
            </button>
          )}
        </div>

        <div style={{ 
          maxHeight: showCode ? "500px" : "0", 
          overflow: "hidden", 
          transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          marginTop: showCode ? "15px" : "0"
        }}>
          <div style={{
            backgroundColor: "#050505", border: "1px solid #1a1a1a", padding: "16px", borderRadius: "12px", 
            fontFamily: "monospace", fontSize: "12px", color: "#a8b2d1", whiteSpace: "pre-wrap",
            lineHeight: "1.5", overflowX: "auto"
          }}>
            {code}
          </div>
        </div>
      </div>
      
      <div style={{
        backgroundColor: "#050505", border: "1px solid #151515", borderRadius: "16px", height: "300px",
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "20px"
      }}>
        {children}
      </div>
    </div>
  );
};

const App = () => {
  const[mode, setMode] = useState("text");
  const [activePresets, setActivePresets] = useState({ scale: false, y: true, x: false, opacity: true, blur: true, rotate: false, weight: false, skew: false, magnetic: false, tilt: false, tiltCard: false });

  const[settings, setSettings] = useState({
    text: "Beyond\nThe\nVoid", elementCount: 12, splitBy: "line", fontSize: 5, lineHeight: 1.1, letterSpacing: 0, 
    wordSpacing: 0.25, reach: 1, falloff: 2.4, duration: 2, resetDuration: 2, ease: "elastic", resetEase: "elastic",
    scale: [1, 1.2], y:[0, -30], x:[0, 30], opacity:[0, 1], blur: [20, 0], rotate: [0, 15], weight:[100, 800],
    skew:[0, 20], magnetic:[0, 0.2], tilt:[0, 40], tiltCard:[0, 20]
  });

  const [copied, setCopied] = useState(false);

  const generatedPresetString = useMemo(() => Object.keys(activePresets).filter((key) => activePresets[key]).join("-"), [activePresets]);

  const config = useMemo(() => ({
    scale: settings.scale, y: settings.y, x: settings.x, opacity: settings.opacity, blur: settings.blur, rotate: settings.rotate, 
    weight: settings.weight, skew: settings.skew, magnetic: settings.magnetic, tilt: settings.tilt, tiltCard: settings.tiltCard,
    ease: settings.ease, resetEase: settings.resetEase, duration: settings.duration, resetDuration: settings.resetDuration,
  }), [settings]);

  const togglePreset = (key) => setActivePresets((prev) => ({ ...prev, [key]: !prev[key] }));
  const updateRange = (key, index, val) => { const newRange = [...settings[key]]; newRange[index] = val; setSettings({ ...settings, [key]: newRange }); };

  const copyCode = () => {
    const code = mode === "text"
        ? `<ProximityText \n  text="${settings.text}" \n  splitBy="${settings.splitBy}" \n  lineHeight={${settings.lineHeight}} \n  letterSpacing={${settings.letterSpacing}} \n  wordSpacing={${settings.wordSpacing}} \n  preset="${generatedPresetString}" \n  config={${JSON.stringify(config, null, 2)}} \n/>`
        : `<Proximity \n  preset="${generatedPresetString}" \n  config={${JSON.stringify(config, null, 2)}}\n>\n  {/* Elements */}\n</Proximity>`;
    navigator.clipboard.writeText(code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#e0e0e0", fontFamily: "'Georama', sans-serif", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@200..800&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", backgroundColor: "#0c0c0c", padding: "4px", borderRadius: "12px", border: "1px solid #1a1a1a", marginBottom: "30px" }}>
        <button aria-label="set Text Mode" onClick={() => setMode("text")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: mode === "text" ? "#fff" : "transparent", color: mode === "text" ? "#000" : "#fff", transition: "0.3s" }}><CaseUpper size={16} /> TEXT</button>
        <button aria-label="set Elements Mode" onClick={() => setMode("elements")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: mode === "elements" ? "#fff" : "transparent", color: mode === "elements" ? "#000" : "#fff", transition: "0.3s" }}><LayoutGrid size={16} /> ELS</button>
      </div>

      <header style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px", opacity: 0.5 }}>
        <Sparkles size={16} />
        <h1 style={{ fontSize: "10px", letterSpacing: "4px", margin: 0, fontWeight: "normal", color: "#fff" }}>ZPROXIMITY ENGINE</h1>
      </header>

      <div style={{ width: "100%", maxWidth: "1000px", minHeight: "500px", backgroundColor: "#070707", borderRadius: "24px", border: "1px solid #151515", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: "30px", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: "#888", zIndex: 10 }}><MousePointer2 size={12} /> {generatedPresetString || "NO PRESETS ACTIVE"}</div>
        {mode === "text" ? (
          <ProximityText
            key={settings.text + settings.splitBy + generatedPresetString + JSON.stringify(config) + settings.lineHeight + settings.letterSpacing + settings.wordSpacing}
            text={settings.text.split("\\n").join("\n")} splitBy={settings.splitBy} lineHeight={settings.lineHeight} letterSpacing={settings.letterSpacing} wordSpacing={settings.wordSpacing} preset={generatedPresetString} reach={settings.reach} falloff={settings.falloff} config={config}
            style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${settings.fontSize}rem`, fontWeight: "800", textAlign: "center" }}
          />
        ) : (
          <Proximity
            key={"elements" + settings.elementCount + generatedPresetString + JSON.stringify(config)}
            selector=".dock-icon" preset={generatedPresetString} reach={settings.reach} falloff={settings.falloff} config={config}
            style={{ width: "100%", height: "100%", display: "flex", gap: "15px", alignItems: "center", justifyContent: "center", padding: "20px", flexWrap: "wrap" }}
          >
            {Array.from({ length: settings.elementCount }).map((_, i) => <div key={i} className="dock-icon" style={{ width: "50px", height: "50px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />)}
          </Proximity>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: "1000px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div style={{ backgroundColor: "#0c0c0c", borderRadius: "20px", padding: "25px", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fff", fontSize: "12px", marginBottom: "20px" }}><Type size={16} /> CORE STRUCTURE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {mode === "text" ? (
              <>
                <input type="text" value={settings.text} onChange={(e) => setSettings({ ...settings, text: e.target.value })} style={{ backgroundColor: "#151515", border: "1px solid #222", color: "#fff", padding: "12px", borderRadius: "10px", fontFamily: "inherit", marginBottom: "5px" }} />
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#888" }}><span>FONT SIZE</span> <span>{settings.fontSize}rem</span></div>
                <input type="range" min="1" max="15" step="0.5" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })} style={{ marginBottom: "10px" }}/>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#888" }}><span>LINE HEIGHT</span> <span>{settings.lineHeight}</span></div>
                <input type="range" min="0.5" max="3" step="0.1" value={settings.lineHeight} onChange={(e) => setSettings({ ...settings, lineHeight: parseFloat(e.target.value) })} style={{ marginBottom: "10px" }}/>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#888" }}><span>LETTER GAP</span> <span>{settings.letterSpacing}em</span></div>
                <input type="range" min="-0.2" max="1" step="0.01" value={settings.letterSpacing} onChange={(e) => setSettings({ ...settings, letterSpacing: parseFloat(e.target.value) })} style={{ marginBottom: "10px" }}/>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#888" }}><span>WORD GAP</span> <span>{settings.wordSpacing}em</span></div>
                <input type="range" min="0" max="3" step="0.05" value={settings.wordSpacing} onChange={(e) => setSettings({ ...settings, wordSpacing: parseFloat(e.target.value) })} style={{ marginBottom: "10px" }}/>

                <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                  {["letter", "word", "line"].map((s) => <button key={s} onClick={() => setSettings({ ...settings, splitBy: s })} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #222", fontSize: "10px", fontWeight: "bold", backgroundColor: settings.splitBy === s ? "#fff" : "transparent", color: settings.splitBy === s ? "#000" : "#888", cursor: "pointer" }}>{s.toUpperCase()}</button>)}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#fff" }}><span>ELEMENT COUNT</span> <span>{settings.elementCount}</span></div>
                <input type="range" min="1" max="100" step="1" value={settings.elementCount} onChange={(e) => setSettings({ ...settings, elementCount: parseInt(e.target.value) })} />
              </>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: "#0c0c0c", borderRadius: "20px", padding: "25px", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#999", fontSize: "12px", marginBottom: "20px" }}><Maximize size={16} /> GLOBAL MOTION</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span>REACH</span> <span>{settings.reach}</span></div>
            <input type="range" min="0" max="50" step="0.1" value={settings.reach} onChange={(e) => setSettings({ ...settings, reach: parseFloat(e.target.value) })} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span>DURATION</span> <span>{settings.duration}s</span></div>
            <input type="range" min="0" max="10" step="0.1" value={settings.duration} onChange={(e) => setSettings({ ...settings, duration: parseFloat(e.target.value) })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "5px" }}>
              <select value={settings.ease} onChange={(e) => setSettings({ ...settings, ease: e.target.value })} style={{ backgroundColor: "#151515", border: "1px solid #222", color: "#fff", padding: "8px", borderRadius: "8px", fontFamily: "inherit", fontSize: "10px" }}>{easeOptions.map((e) => <option key={e} value={e}>{e}</option>)}</select>
              <select value={settings.resetEase} onChange={(e) => setSettings({ ...settings, resetEase: e.target.value })} style={{ backgroundColor: "#151515", border: "1px solid #222", color: "#fff", padding: "8px", borderRadius: "8px", fontFamily: "inherit", fontSize: "10px" }}>{easeOptions.map((e) => <option key={e} value={e}>{e} (Res)</option>)}</select>
            </div>
          </div>
        </div>

        <Suspense fallback={<div style={{ color: "#888" }}>Loading...</div>}>
          <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
            <PresetCard id="scale" label="Scale" icon={Maximize} min="0.1" max="4" step="0.1" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="y" label="Y Offset" icon={Move} min="-200" max="200" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="x" label="X Offset" icon={Move} min="-200" max="200" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="opacity" label="Opacity" icon={Eye} min="0" max="1" step="0.1" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="blur" label="Blur" icon={Layers} min="0" max="50" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="rotate" label="Rotate" icon={Maximize} min="-360" max="360" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="weight" label="Weight" icon={Type} min="100" max="900" step="100" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="skew" label="Skew" icon={Type} min="-90" max="90" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="magnetic" label="Magnetic" icon={Fingerprint} min="0" max="1" step="0.1" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="tilt" label="Tilt" icon={Layers} min="0" max="100" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="tiltCard" label="TiltCard" icon={Layers} min="0" max="100" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
          </div>
        </Suspense>
      </div>

      <button onClick={copyCode} style={{ padding: "16px 40px", borderRadius: "100px", border: "none", backgroundColor: copied ? "#10b981" : "#fff", color: copied ? "#fff" : "#000", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", transition: "0.4s", transform: `scale(${copied ? 1.05 : 1})`, boxShadow: "0 20px 40px rgba(255,255,255,0.1)", marginBottom: "80px" }}>
        {copied ? <Check size={20} /> : <Copy size={20} />} {copied ? "COPIED!" : "COPY ENGINE CODE"}
      </button>

      <div style={{ width: "100%", maxWidth: "1000px", borderTop: "1px solid #1a1a1a", paddingTop: "60px", paddingBottom: "100px" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <BookOpen size={28} color="#10b981" />
          <h2 style={{ fontSize: "24px", margin: 0, fontWeight: "bold", color: "#fff", textAlign: "left" }}>Interactive Documentation</h2>
        </header>

        <DocSection icon={Code2} title="String Presets (Order Independent)" description="Combine multiple animations instantly by passing a dash-separated string. 'scale-blur' is identical to 'blur-scale'." code={'<ProximityText \n  text="ORDER NO MATTER"\n  preset="scale-blur-opacity-y"\n/>'}>
          <ProximityText text="ORDER NO MATTER" splitBy="word" preset="scale-blur-opacity-y" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: "900", color: "#fff" }} />
        </DocSection>

        <DocSection icon={Settings} title="Fast Props vs Config Object" description="Pass configurations like reach or ease directly as props, or use the config object for deep overrides." code={'<ProximityText \n  text="FAST PROPS"\n  preset="scale"\n  duration={2} \n  ease="elastic"\n  config={{ scale:[1, 2] }}\n/>'}>
          <ProximityText text="FAST PROPS" preset="scale" duration={2} ease="elastic" config={{ scale: [1, 2] }} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: "900", color: "#fff" }} />
        </DocSection>

        <DocSection icon={Fingerprint} title="ignoreText (Precision Control)" description="Pass an array of Strings or Regular Expressions to ignoreText to keep specific parts static." code={'<ProximityText \n  text="Static & Reactive"\n  splitBy="word"\n  preset="y-scale"\n  ignoreText={["Static", "&"]} \n/>'}>
          <ProximityText text="Static & Reactive" splitBy="word" preset="y-scale" ignoreText={["Static", "&"]} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: "900", color: "#fff" }} />
        </DocSection>

        <DocSection icon={Layers} title="excludeElements (DOM Node Ignore)" description="Pass a CSS selector to excludeElements to bypass specific items in a group." code={'<Proximity \n  preset="rotate"\n  excludeElements=".skip-me"\n>\n  <div className="item">Spin</div>\n  <div className="item skip-me">Skip me</div>\n  <div className="item">Spin</div>\n</Proximity>'}>
          <Proximity preset="rotate" excludeElements=".doc-skip" selector=".doc-item" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }}>
             <div className="doc-item" style={{ width: "80px", height: "80px", backgroundColor: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", fontWeight: "bold", fontSize: "12px" }}>Spin</div>
             <div className="doc-item doc-skip" style={{ width: "80px", height: "80px", backgroundColor: "#151515", border: "1px dashed #444", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", fontWeight: "bold", fontSize: "12px" }}>Skip Me</div>
             <div className="doc-item" style={{ width: "80px", height: "80px", backgroundColor: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", fontWeight: "bold", fontSize: "12px" }}>Spin</div>
          </Proximity>
        </DocSection>

        <DocSection icon={Globe} title="Global Tracking (global={true})" description="Setting global={true} tracks the pointer across the entire window—even when not hovering the component." code={'<Proximity \n  global={true} \n  preset="scale" \n  reach={5}\n>\n  <div className="item">👀</div>\n</Proximity>'}>
          <Proximity global={true} preset="scale-blur" reach={5} selector=".global-eye" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
             <div className="global-eye" style={{ fontSize: "50px", pointerEvents: "none" }}>👀</div>
          </Proximity>
        </DocSection>

        <DocSection icon={Wand2} title="The Escape Hatch (Custom Logic)" description="Use onCalculate to return any GSAP object based on real-time proximity intensity." code={'<Proximity \n  onCalculate={(intensity) => ({\n    borderRadius: `${intensity * 50}%`,\n    backgroundColor: `rgba(16, 185, 129, ${intensity})`\n  })}\n>\n  <div className="custom-item">Hover Me</div>\n</Proximity>'}>
          <Proximity selector=".morph-box" reach={1.5} onCalculate={(intensity) => ({ borderRadius: `${intensity * 50}%`, backgroundColor: `rgba(16, 185, 129, ${Math.max(0.1, intensity)})`, scale: 1 + (intensity * 0.5) })} onReset={() => ({ borderRadius: "10%", backgroundColor: "rgba(255,255,255,0.1)", scale: 1 })} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
             <div className="morph-box" style={{ width: "120px", height: "120px", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold" }}>Hover Me</div>
          </Proximity>
        </DocSection>
      </div>
    </main>
  );
};

export default App;