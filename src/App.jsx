import React, { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { ProximityText } from "./lib/ProximityText";
import { Proximity } from "./lib/Proximity";
const PresetCard = lazy(() => import("./components/PresetCard").then(module => ({ default: module.PresetCard })));
import {
  Type, Maximize, Move, Layers, Copy, Check, MousePointer2,
  Sparkles, Eye, EyeOff, LayoutGrid, CaseUpper, Code2, BookOpen, Fingerprint, Settings, Globe, Wand2, ChevronDown, ListOrdered, Replace, Hash
} from "lucide-react";

const easeOptions =["smooth", "heavy", "sharp", "fluid", "bouncy", "elastic", "jello", "bounce", "swing", "vibrate", "robot", "ghost", "expo", "circus", "glitch", "slowmo"];

const DocSection = ({ icon: Icon, title, description, children, code }) => {
  const[showCode, setShowCode] = useState(false);
  const[copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ backgroundColor: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: "20px", padding: "clamp(15px, 5vw, 30px)", marginBottom: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", gap: "30px", alignItems: "start" }}>
      <div style={{ textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fff", marginBottom: "12px", fontWeight: "bold" }}><Icon size={20} color="#10b981" /> {title}</div>
        <p style={{ color: "#888", fontSize: "14px", lineHeight: "1.6", marginBottom: "0" }}>{description}</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
          <button onClick={() => setShowCode(!showCode)} style={{ background: "transparent", border: "1px solid #333", color: "#fff", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", transition: "0.3s" }}><ChevronDown size={14} style={{ transform: showCode ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }} /> {showCode ? "Hide Code" : "Show Code"}</button>
          {showCode && <button onClick={handleCopy} style={{ background: copied ? "#10b981" : "#1a1a1a", border: "none", color: copied ? "#fff" : "#aaa", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", transition: "0.3s" }}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy Snippet"}</button>}
        </div>
        <div style={{ maxHeight: showCode ? "500px" : "0", overflow: "hidden", transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)", marginTop: showCode ? "15px" : "0" }}><div style={{ backgroundColor: "#050505", border: "1px solid #1a1a1a", padding: "16px", borderRadius: "12px", fontFamily: "monospace", fontSize: "12px", color: "#a8b2d1", whiteSpace: "pre-wrap", lineHeight: "1.5", overflowX: "auto" }}>{code}</div></div>
      </div>
      <div style={{ backgroundColor: "#050505", border: "1px solid #151515", borderRadius: "16px", height: "300px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "20px" }}>{children}</div>
    </div>
  );
};

const App = () => {
  const[mode, setMode] = useState("text");
  const [activePresets, setActivePresets] = useState({ scale: false, y: true, x: false, opacity: true, blur: true, rotate: false, weight: false, skew: false, magnetic: false, repel: false, cipher: false, tilt: false, tiltCard: false });

  const[settings, setSettings] = useState({
    text: "Beyond\nThe\nVoid", elementCount: 8, splitBy: "line", fontSize: 5, lineHeight: 1.1, letterSpacing: 0, 
    wordSpacing: 0.25, reach: 1.5, falloff: 2.4, duration: 2, resetDuration: 2, ease: "elastic", resetEase: "elastic",
    scale:[1, 1.2], y:[0, -30], x:[0, 30], opacity:[0, 1], blur: [20, 0], rotate:[0, 15], weight:[100, 800],
    skew:[0, 20], magnetic:[0, 0.2], repel:[0, 0.4], cipher:[0, 1], tilt:[0, 40], tiltCard:[0, 25], explicit: false, maxTravel: 100,
    focusMode: false, nearestPreset: "scale-y-blur-opacity", neighborPreset: "repel",
    timeline: {} 
  });

  const[copied, setCopied] = useState(false);
  const[selectedTimelineId, setSelectedTimelineId] = useState("");

  const generatedPresetString = useMemo(() => Object.keys(activePresets).filter((key) => activePresets[key]).join("-"), [activePresets]);

  useEffect(() => {
    const activeKeys = Object.keys(activePresets).filter(k => activePresets[k]);
    if (!activeKeys.includes(selectedTimelineId)) {
      setSelectedTimelineId(activeKeys[0] || "");
    }
  },[activePresets, selectedTimelineId]);

  const config = useMemo(() => {
    const cleanTimeline = {};
    Object.keys(settings.timeline).forEach(key => {
      if (activePresets[key] || settings.nearestPreset.includes(key) || settings.neighborPreset.includes(key)) {
         const tl = settings.timeline[key];
         if (tl && (tl.duration !== undefined || tl.delay !== undefined || tl.ease || tl.resetEase)) {
            cleanTimeline[key] = tl;
         }
      }
    });

    return {
      reach: settings.reach,
      falloff: settings.falloff,
      scale: settings.scale, y: settings.y, x: settings.x, opacity: settings.opacity, blur: settings.blur, rotate: settings.rotate, 
      weight: settings.weight, skew: settings.skew, magnetic: settings.magnetic, repel: settings.repel, cipher: settings.cipher, tilt: settings.tilt, tiltCard: settings.tiltCard,
      ease: settings.ease, resetEase: settings.resetEase, duration: settings.duration, resetDuration: settings.resetDuration,
      explicit: settings.explicit, maxTravel: settings.maxTravel === 200 ? undefined : settings.maxTravel,
      timeline: Object.keys(cleanTimeline).length > 0 ? cleanTimeline : undefined
    };
  },[settings, activePresets]);

  const togglePreset = (key) => setActivePresets((prev) => ({ ...prev, [key]: !prev[key] }));
  const updateRange = (key, index, val) => { const newRange = [...settings[key]]; newRange[index] = val; setSettings({ ...settings,[key]: newRange }); };
  
  const updateTimeline = (preset, field, val) => {
    setSettings(prev => ({
      ...prev,
      timeline: { ...prev.timeline,[preset]: { ...(prev.timeline[preset] || {}), [field]: val } }
    }));
  };

  const copyCode = () => {
    let propsString = settings.focusMode 
      ? `nearestPreset="${settings.nearestPreset}" neighborPreset="${settings.neighborPreset}"`
      : `preset="${generatedPresetString}"`;

    const code = mode === "text"
        ? `<ProximityText text="${settings.text}" splitBy="${settings.splitBy}" ${propsString} config={${JSON.stringify(config, null, 2)}} />`
        : `<Proximity ${propsString} config={${JSON.stringify(config, null, 2)}}>{/* Elements */}</Proximity>`;
    navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#e0e0e0", fontFamily: "'Georama', sans-serif", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@200..800&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", backgroundColor: "#0c0c0c", padding: "4px", borderRadius: "12px", border: "1px solid #1a1a1a", marginBottom: "30px" }}>
        <button onClick={() => setMode("text")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: mode === "text" ? "#fff" : "transparent", color: mode === "text" ? "#000" : "#fff", transition: "0.3s" }}><CaseUpper size={16} /> TEXT</button>
        <button onClick={() => setMode("elements")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: mode === "elements" ? "#fff" : "transparent", color: mode === "elements" ? "#000" : "#fff", transition: "0.3s" }}><LayoutGrid size={16} /> ELS</button>
      </div>

      <header style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px", opacity: 0.5 }}><Sparkles size={16} /><h1 style={{ fontSize: "10px", letterSpacing: "4px", margin: 0, fontWeight: "normal", color: "#fff" }}>ZPROXIMITY ENGINE</h1></header>

      <div style={{ width: "100%", maxWidth: "1000px", minHeight: "500px", backgroundColor: "#070707", borderRadius: "24px", border: "1px solid #151515", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: "30px", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: settings.focusMode ? "#10b981" : "#888", zIndex: 10 }}>
          <MousePointer2 size={12} /> {settings.focusMode ? "FOCUS MODE ACTIVE" : (generatedPresetString || "NO PRESETS ACTIVE")}
        </div>
        
        {mode === "text" ? (
          <ProximityText 
            key={settings.text + settings.splitBy} 
            text={settings.text.split("\\n").join("\n")} 
            splitBy={settings.splitBy} 
            preset={settings.focusMode ? "" : generatedPresetString} 
            nearestPreset={settings.focusMode ? settings.nearestPreset : ""}
            neighborPreset={settings.focusMode ? settings.neighborPreset : ""}
            config={config} 
            style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${settings.fontSize}rem`, fontWeight: "800", textAlign: "center" }} 
          />
        ) : (
          <Proximity 
            key={"elements" + settings.elementCount} 
            selector=".dock-icon" 
            preset={settings.focusMode ? "" : generatedPresetString} 
            nearestPreset={settings.focusMode ? settings.nearestPreset : ""}
            neighborPreset={settings.focusMode ? settings.neighborPreset : ""}
            config={config} 
            style={{ width: "100%", height: "100%", display: "flex", gap: "15px", alignItems: "center", justifyContent: "center", padding: "20px", flexWrap: "wrap" }}
          >
            {Array.from({ length: settings.elementCount }).map((_, i) => <div key={i} className="dock-icon" style={{ width: "100px", height: "100px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />)}
          </Proximity>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: "1000px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        
        {/* CARD 1: CORE STRUCTURE */}
        <div style={{ backgroundColor: "#0c0c0c", borderRadius: "20px", padding: "25px", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fff", fontSize: "12px", marginBottom: "20px" }}><Type size={16} /> CORE STRUCTURE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {mode === "text" ? (
              <>
                <input type="text" value={settings.text} onChange={(e) => setSettings({ ...settings, text: e.target.value })} style={{ backgroundColor: "#151515", border: "1px solid #222", color: "#fff", padding: "12px", borderRadius: "10px", fontFamily: "inherit", marginBottom: "5px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#888" }}><span>FONT SIZE</span> <span>{settings.fontSize}rem</span></div>
                <input type="range" min="1" max="15" step="0.5" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })} style={{ marginBottom: "10px" }}/>
                <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>{["letter", "word", "line"].map((s) => <button key={s} onClick={() => setSettings({ ...settings, splitBy: s })} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #222", fontSize: "10px", fontWeight: "bold", backgroundColor: settings.splitBy === s ? "#fff" : "transparent", color: settings.splitBy === s ? "#000" : "#888", cursor: "pointer" }}>{s.toUpperCase()}</button>)}</div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#fff" }}><span>ELEMENT COUNT</span> <span>{settings.elementCount}</span></div>
                <input type="range" min="1" max="100" step="1" value={settings.elementCount} onChange={(e) => setSettings({ ...settings, elementCount: parseInt(e.target.value) })} />
              </>
            )}
          </div>
        </div>

        {/* CARD 2: GLOBAL MOTION */}
        <div style={{ backgroundColor: "#0c0c0c", borderRadius: "20px", padding: "25px", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#999", fontSize: "12px", marginBottom: "20px" }}><Maximize size={16} /> GLOBAL MOTION</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#888" }}>EXPLICIT MODE</span>
                <button onClick={() => setSettings({...settings, explicit: !settings.explicit})} style={{ backgroundColor: settings.explicit ? "#10b981" : "#222", border: "none", color: "#fff", padding: "4px 12px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", transition: "0.3s" }}>{settings.explicit ? "ON" : "OFF"}</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span>REACH</span> <span>{settings.reach}</span></div>
            <input type="range" min="0" max="50" step="0.1" value={settings.reach} onChange={(e) => setSettings({ ...settings, reach: parseFloat(e.target.value) })} />
            
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span>MAX TRAVEL (Clamp)</span> <span>{settings.maxTravel === 200 ? "INF" : `${settings.maxTravel}px`}</span></div>
            <input type="range" min="0" max="200" step="5" value={settings.maxTravel} onChange={(e) => setSettings({ ...settings, maxTravel: parseInt(e.target.value) })} />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span>DURATION</span> <span>{settings.duration}s</span></div>
            <input type="range" min="0" max="10" step="0.1" value={settings.duration} onChange={(e) => setSettings({ ...settings, duration: parseFloat(e.target.value) })} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span>RESET DUR</span> <span>{settings.resetDuration}s</span></div>
            <input type="range" min="0" max="10" step="0.1" value={settings.resetDuration} onChange={(e) => setSettings({ ...settings, resetDuration: parseFloat(e.target.value) })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "5px" }}>
              <select value={settings.ease} onChange={(e) => setSettings({ ...settings, ease: e.target.value })} style={{ backgroundColor: "#151515", border: "1px solid #222", color: "#fff", padding: "8px", borderRadius: "8px", fontFamily: "inherit", fontSize: "10px" }}>{easeOptions.map((e) => <option key={e} value={e}>{e}</option>)}</select>
              <select value={settings.resetEase} onChange={(e) => setSettings({ ...settings, resetEase: e.target.value })} style={{ backgroundColor: "#151515", border: "1px solid #222", color: "#fff", padding: "8px", borderRadius: "8px", fontFamily: "inherit", fontSize: "10px" }}>{easeOptions.map((e) => <option key={e} value={e}>{e} (Res)</option>)}</select>
            </div>
          </div>
        </div>

        {/* CARD 3: TIMELINE OVERRIDES */}
        <div style={{ backgroundColor: "#0c0c0c", borderRadius: "20px", padding: "25px", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#999", fontSize: "12px", marginBottom: "20px" }}><ListOrdered size={16} /> TIMELINE OVERRIDES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            <select 
               value={selectedTimelineId} 
               onChange={(e) => setSelectedTimelineId(e.target.value)} 
               style={{ backgroundColor: "#151515", border: "1px solid #222", color: selectedTimelineId ? "#10b981" : "#888", padding: "10px", borderRadius: "8px", fontFamily: "inherit", fontSize: "11px", fontWeight: "bold", width: "100%", outline: "none" }}
            >
              {Object.keys(activePresets).filter(k => activePresets[k]).length === 0 && <option value="">No Active Presets</option>}
              {Object.keys(activePresets).filter(k => activePresets[k]).map(k => <option key={k} value={k}>{k.toUpperCase()} PRESET</option>)}
            </select>

            {selectedTimelineId && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                   <span>DURATION</span> 
                   <span style={{ color: settings.timeline[selectedTimelineId]?.duration !== undefined ? "#10b981" : "#888" }}>
                      {settings.timeline[selectedTimelineId]?.duration !== undefined ? `${settings.timeline[selectedTimelineId].duration}s` : "Global"}
                   </span>
                </div>
                <input type="range" min="0" max="5" step="0.1" value={settings.timeline[selectedTimelineId]?.duration ?? settings.duration} onChange={(e) => updateTimeline(selectedTimelineId, "duration", parseFloat(e.target.value))} />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                   <span>DELAY</span> 
                   <span style={{ color: settings.timeline[selectedTimelineId]?.delay ? "#10b981" : "#888" }}>
                      {settings.timeline[selectedTimelineId]?.delay ?? 0}s
                   </span>
                </div>
                <input type="range" min="0" max="2" step="0.05" value={settings.timeline[selectedTimelineId]?.delay ?? 0} onChange={(e) => updateTimeline(selectedTimelineId, "delay", parseFloat(e.target.value))} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "5px" }}>
                  <select value={settings.timeline[selectedTimelineId]?.ease || ""} onChange={(e) => updateTimeline(selectedTimelineId, "ease", e.target.value)} style={{ backgroundColor: "#151515", border: "1px solid #222", color: settings.timeline[selectedTimelineId]?.ease ? "#10b981" : "#fff", padding: "8px", borderRadius: "8px", fontFamily: "inherit", fontSize: "10px" }}>
                    <option value="">Global Ease</option>
                    {easeOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <select value={settings.timeline[selectedTimelineId]?.resetEase || ""} onChange={(e) => updateTimeline(selectedTimelineId, "resetEase", e.target.value)} style={{ backgroundColor: "#151515", border: "1px solid #222", color: settings.timeline[selectedTimelineId]?.resetEase ? "#10b981" : "#fff", padding: "8px", borderRadius: "8px", fontFamily: "inherit", fontSize: "10px" }}>
                    <option value="">Global Res</option>
                    {easeOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <button 
                  onClick={() => { const newTl = { ...settings.timeline }; delete newTl[selectedTimelineId]; setSettings({ ...settings, timeline: newTl }); }}
                  style={{ background: "transparent", border: "1px dashed #333", color: "#888", padding: "6px", borderRadius: "6px", cursor: "pointer", fontSize: "10px", marginTop: "5px", transition: "0.2s" }}
                >
                  RESET TO GLOBAL
                </button>
              </>
            )}
          </div>
        </div>

        {/* CARD 4: FOCUS MODE */}
        <div style={{ backgroundColor: "#0c0c0c", borderRadius: "20px", padding: "25px", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#10b981", fontSize: "12px", marginBottom: "20px" }}><Replace size={16} /> FOCUS & NEIGHBORS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#888" }}>ENABLE SPLIT FOCUS</span>
                <button onClick={() => setSettings({...settings, focusMode: !settings.focusMode})} style={{ backgroundColor: settings.focusMode ? "#10b981" : "#222", border: "none", color: "#fff", padding: "4px 12px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", transition: "0.3s" }}>{settings.focusMode ? "ON" : "OFF"}</button>
            </div>

            {settings.focusMode ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#888" }}><span>NEAREST PRESET</span></div>
                <input type="text" value={settings.nearestPreset} onChange={(e) => setSettings({ ...settings, nearestPreset: e.target.value })} style={{ backgroundColor: "#151515", border: "1px solid #222", color: "#fff", padding: "10px", borderRadius: "8px", fontFamily: "inherit", fontSize: "11px", marginBottom: "5px" }} placeholder="e.g. scale-y-blur" />
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#888" }}><span>NEIGHBOR PRESET</span></div>
                <input type="text" value={settings.neighborPreset} onChange={(e) => setSettings({ ...settings, neighborPreset: e.target.value })} style={{ backgroundColor: "#151515", border: "1px solid #222", color: "#fff", padding: "10px", borderRadius: "8px", fontFamily: "inherit", fontSize: "11px" }} placeholder="e.g. repel-blur" />
                
                <p style={{ fontSize: "10px", color: "#666", marginTop: "5px", lineHeight: "1.4" }}>
                  The engine automatically crossfades these mathematical boundaries. You can still adjust values in the grid below!
                </p>
              </>
            ) : (
              <p style={{ fontSize: "11px", color: "#555", lineHeight: "1.5" }}>
                  Override the standard global engine string. Apply one preset specifically to the hovered element, and a completely different preset to the surrounding neighbors.
              </p>
            )}
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
            <PresetCard id="cipher" label="Cipher (Hacker)" icon={Hash} min="0" max="1" step="0.1" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="magnetic" label="Magnetic" icon={Fingerprint} min="0" max="1" step="0.1" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="repel" label="Repel (Space)" icon={Replace} min="0" max="2" step="0.1" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="tilt" label="Tilt" icon={Layers} min="0" max="100" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
            <PresetCard id="tiltCard" label="TiltCard" icon={Layers} min="0" max="100" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
          </div>
        </Suspense>
      </div>

      <button onClick={copyCode} style={{ padding: "16px 40px", borderRadius: "100px", border: "none", backgroundColor: copied ? "#10b981" : "#fff", color: copied ? "#fff" : "#000", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", transition: "0.4s", transform: `scale(${copied ? 1.05 : 1})`, boxShadow: "0 20px 40px rgba(255,255,255,0.1)", marginBottom: "80px" }}>{copied ? <Check size={20} /> : <Copy size={20} />} {copied ? "COPIED!" : "COPY ENGINE CODE"}</button>

      <div style={{ width: "100%", maxWidth: "1000px", borderTop: "1px solid #1a1a1a", paddingTop: "60px", paddingBottom: "100px" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}><BookOpen size={28} color="#10b981" /><h2 style={{ fontSize: "24px", margin: 0, fontWeight: "bold", color: "#fff", textAlign: "left" }}>Interactive Documentation</h2></header>

        {/* CIPHER DEMO 1: HACKER DECODE */}
        <DocSection 
          icon={Hash} 
          title="Cipher Decode" 
          description="Scrambled by default, but reveals the truth when the cursor gets close. It never stops flickering until fully revealed." 
          code={`<ProximityText\n  text="HOVER TO DECRYPT"\n  preset="cipher-scale"\n  config={{\n    cipher: [1, 0], // Base is 1 (Scrambled), Hover is 0 (Clear)\n    scale: [1, 1.2]\n  }}\n/>`}
        >
          <ProximityText 
            text="HOVER TO DECRYPT" 
            splitBy="letter" 
            preset="cipher-scale" 
            config={{ cipher: [1, 0], scale: [1, 1.2] }}
            style={{ fontSize: "2rem", fontWeight: "900", color: "#fff", letterSpacing: "0.1em" }} 
          />
        </DocSection>

        {/* CIPHER DEMO 2: MATRIX HOVER */}
        <DocSection 
          icon={Hash} 
          title="Matrix Hover" 
          description="A pure cyber-aesthetic. Normal at a distance, heavily scrambled when hovered." 
          code={`<ProximityText\n  text="ENTER THE MATRIX"\n  preset="cipher-blur"\n  config={{\n    cipher: [0, 1], // Base is 0 (Clear), Hover is 1 (Scrambled)\n    blur: [0, 4]\n  }}\n/>`}
        >
          <ProximityText 
            text="ENTER THE MATRIX" 
            splitBy="letter" 
            preset="cipher-blur" 
            config={{ cipher: [0, 1], blur: [0, 4] }}
            style={{ fontSize: "2rem", fontWeight: "900", color: "#10b981", letterSpacing: "0.1em" }} 
          />
        </DocSection>

        <DocSection 
          icon={Replace} 
          title="Focus Mode & Give Space" 
          description="Built entirely with strings! nearestPreset scales and unblurs the hovered element, while neighborPreset repels the adjacent ones, leaving them blurry." 
          code={`<Proximity\n  selector=".focus-box"\n  reach={3} falloff={1.5} maxTravel={30}\n  nearestPreset="scale-y-blur-opacity"\n  neighborPreset="repel"\n  config={{\n    blur: [8, 0], // Starts blurry, becomes clear\n    opacity:[0.4, 1],\n    y:[0, -20],\n    scale:[1, 1.5]\n  }}\n>\n  {/* Boxes */}\n</Proximity>`}
        >
          <Proximity 
            selector=".focus-box" reach={3} falloff={1.5} maxTravel={30}
            nearestPreset="scale-y-blur-opacity"
            neighborPreset="repel"
            config={{
              blur:[8, 0], opacity:[0.4, 1], y: [0, -20], scale:[1, 1.5], repel:[0, 0.4]
            }}
            style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center" }}
          >
             {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="focus-box" style={{ width: "40px", height: "40px", backgroundColor: "#10b981", borderRadius: "8px" }} />
             ))}
          </Proximity>
        </DocSection>

        <DocSection 
          icon={ListOrdered} 
          title="Timeline Staggering" 
          description="Give presets their own duration, delay, or ease! Watch how the Blur clears instantly, Scale lags slightly, and Rotate lags far behind." 
          code={`<ProximityText\n  text="LAYERED EFFECTS"\n  preset="blur-scale-rotate"\n  config={{\n    timeline: {\n      blur: { duration: 0.1 },                // Instant response\n      scale: { duration: 0.8 },               // Slower, rubbery\n      rotate: { duration: 1.5, delay: 0.05 }  // Heavy, trailing delay\n    }\n  }}\n/>`}
        >
          <ProximityText 
            text="LAYERED ⌛" 
            splitBy="word" 
            preset="blur-scale-rotate" 
            config={{
              blur:[15, 0], scale:[1, 1.4], rotate:[0, 20],
              timeline: { blur: { duration: 0.1 }, scale: { duration: 0.8, ease: "elastic" }, rotate: { duration: 1.5, delay: 0.05, ease: "bouncy" } }
            }} 
            style={{ fontSize: "3rem", fontWeight: "900", color: "#10b981" }} 
          />
        </DocSection>

        <DocSection icon={Code2} title="String Presets" description="Combine animations instantly." code={'<ProximityText preset="scale-blur-opacity-y" />'}><ProximityText text="ORDER NO MATTER" splitBy="word" preset="scale-blur-opacity-y" style={{ fontSize: "2.5rem", fontWeight: "900", color: "#fff"}} /></DocSection>
        <DocSection icon={Fingerprint} title="Explicit Triggering" description="Only react when cursor is physically inside bounding box." code={'<Proximity explicit={true} preset="tiltCard" />'}><Proximity explicit={true} preset="tiltCard" config={{ tiltCard:[0, 30] }} selector=".explicit-demo" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="explicit-demo" style={{ width: "150px", height: "150px", backgroundColor: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "20px", fontWeight: "bold" }}>Strict Box</div></Proximity></DocSection>
        <DocSection icon={Fingerprint} title="ignoreText" description="Keep specific parts static using Strings or Regex." code={'<ProximityText ignoreText={["Static", "&"]} />'}><ProximityText text="Static & Reactive" splitBy="word" preset="y-scale" ignoreText={["Static", "&"]} style={{ fontSize: "3rem", fontWeight: "900", color: "#fff" }} /></DocSection>
        <DocSection icon={Layers} title="excludeElements" description="Bypass specific DOM nodes in a group selector." code={'<Proximity excludeElements=".skip-me" />'}><Proximity preset="rotate" excludeElements=".doc-skip" selector=".doc-item" style={{ display: "flex", gap: "20px" }}><div className="doc-item" style={{ width: "80px", height: "80px", backgroundColor: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", fontWeight: "bold" }}>Spin</div><div className="doc-item doc-skip" style={{ width: "80px", height: "80px", backgroundColor: "#151515", border: "1px dashed #444", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", fontWeight: "bold" }}>Skip</div><div className="doc-item" style={{ width: "80px", height: "80px", backgroundColor: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", fontWeight: "bold" }}>Spin</div></Proximity></DocSection>
        <DocSection icon={Fingerprint} title="Magnetic Pull" description="Elements physically move toward cursor." code={'<Proximity preset="magnetic" config={{ maxTravel: 50 }} />'}><Proximity selector=".mag-box" preset="magnetic" config={{ magnetic:[0, 0.4], maxTravel: 50 }} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="mag-box" style={{ width: "80px", height: "80px", backgroundColor: "#fff", borderRadius: "50%" }} /></Proximity></DocSection>
        <DocSection icon={Layers} title="Card Tilt Physics" description="Normalized 3D rotation following mouse." code={'<Proximity preset="tiltCard" />'}><Proximity selector=".tilt-card-demo" preset="tiltCard" config={{ tiltCard:[0, 25] }} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="tilt-card-demo" style={{ width: "150px", height: "200px", backgroundColor: "#fff", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: "bold" }}>Card</div></Proximity></DocSection>
        <DocSection icon={Globe} title="Global Tracking" description="Track pointer across the entire window." code={'<Proximity global={true} />'}><Proximity global={true} preset="scale-blur" reach={5} selector=".global-eye" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="global-eye" style={{ fontSize: "50px" }}>👀</div></Proximity></DocSection>
      </div>
    </main>
  );
};

export default App;