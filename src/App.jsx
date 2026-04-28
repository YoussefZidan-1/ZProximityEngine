import React, { useState, useMemo, lazy, Suspense } from "react";
import { ProximityText } from "./lib/ProximityText";
import { Proximity } from "./lib/Proximity";
const PresetCard = lazy(() => import("./components/PresetCard").then(module => ({ default: module.PresetCard })));
import {
  Type,
  Maximize,
  Move,
  Layers,
  Copy,
  Check,
  MousePointer2,
  Sparkles,
  Eye,
  EyeOff,
  LayoutGrid,
  CaseUpper,
} from "lucide-react";

// Moved outside the component to prevent recreation on every render
const easeOptions =[
  "smooth",
  "heavy",
  "sharp",
  "fluid",
  "bouncy",
  "elastic",
  "jello",
  "bounce",
  "swing",
  "vibrate",
  "robot",
  "ghost",
  "expo",
  "circus",
  "glitch",
  "slowmo",
];

const App = () => {
  const [mode, setMode] = useState("text");
  const[activePresets, setActivePresets] = useState({
    scale: false,
    y: true,
    opacity: true,
    blur: true,
    rotate: false,
    weight: false,
  });

  const[settings, setSettings] = useState({
    text: "Beyond\nThe\nVoid",
    elementCount: 12,
    splitBy: "line",
    fontSize: 5,
    lineHeight: 1.1,
    letterSpacing: 0,
    wordSpacing: 0.25,
    reach: 1,
    falloff: 2.4,
    duration: 2,
    resetDuration: 2,
    ease: "elastic",
    resetEase: "elastic",
    scale: [1, 1.2],
    y: [0, -30],
    opacity: [0, 1],
    blur: [20, 0],
    rotate: [0, 15],
    weight: [100, 800],
  });

  const [copied, setCopied] = useState(false);

  const generatedPresetString = useMemo(() => {
    return Object.keys(activePresets)
      .filter((key) => activePresets[key])
      .join("-");
  }, [activePresets]);

  const config = useMemo(
    () => ({
      scale: settings.scale,
      y: settings.y,
      opacity: settings.opacity,
      blur: settings.blur,
      rotate: settings.rotate,
      weight: settings.weight,
      ease: settings.ease,
      resetEase: settings.resetEase,
      duration: settings.duration,
      resetDuration: settings.resetDuration,
    }),
    [settings],
  );

  const togglePreset = (key) =>
    setActivePresets((prev) => ({ ...prev, [key]: !prev[key] }));
    
  const updateRange = (key, index, val) => {
    const newRange = [...settings[key]];
    newRange[index] = val;
    setSettings({ ...settings, [key]: newRange });
  };

  const copyCode = () => {
    const code =
      mode === "text"
        ? `<ProximityText text="${settings.text}" lineHeight={${settings.lineHeight}} letterSpacing={${settings.letterSpacing}} wordSpacing={${settings.wordSpacing}} preset="${generatedPresetString}" config={${JSON.stringify(config, null, 2)}} />`
        : `<Proximity preset="${generatedPresetString}" config={${JSON.stringify(config, null, 2)}}>{/* Elements */}</Proximity>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main
      style={{
        backgroundColor: "#000",
        minHeight: "100vh",
        color: "#e0e0e0",
        fontFamily: "'Georama', sans-serif",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@200..800&display=swap"
        rel="stylesheet"
      />

      {/* Mode Toggle */}
      <div
        style={{
          display: "flex",
          backgroundColor: "#0c0c0c",
          padding: "4px",
          borderRadius: "12px",
          border: "1px solid #1a1a1a",
          marginBottom: "30px",
        }}
      >
        <button
          aria-label="set Text Mode"
          onClick={() => setMode("text")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            backgroundColor: mode === "text" ? "#fff" : "transparent",
            color: mode === "text" ? "#000" : "#fff",
            transition: "0.3s",
          }}
        >
          <CaseUpper size={16} /> TEXT
        </button>
        <button
          aria-label="set Elements Mode"
          onClick={() => setMode("elements")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            backgroundColor: mode === "elements" ? "#fff" : "transparent",
            color: mode === "elements" ? "#000" : "#fff",
            transition: "0.3s",
          }}
        >
          <LayoutGrid size={16} /> ELS
        </button>
      </div>

      <header // Semantic HTML
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "30px",
          opacity: 0.5,
        }}
      >
        <Sparkles size={16} />
        <h1 style={{ fontSize: "10px", letterSpacing: "4px", margin: 0, fontWeight: "normal", color: "#fff" }}>
          ZPROXIMITY ENGINE
        </h1>
      </header>

      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          height: "650px",
          backgroundColor: "#070707",
          borderRadius: "24px",
          border: "1px solid #151515",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          marginBottom: "30px",
          boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "10px",
            color: "#888",
          }}
        >
          <MousePointer2 size={12} />{" "}
          {generatedPresetString || "NO PRESETS ACTIVE"}
        </div>

        {mode === "text" ? (
          <ProximityText
            key={
              settings.text +
              settings.splitBy +
              generatedPresetString +
              settings.fontSize +
              settings.lineHeight +
              settings.letterSpacing +
              settings.wordSpacing +
              JSON.stringify(config)
            }
            text={settings.text.split("\\n").join("\n")}
            splitBy={settings.splitBy}
            lineHeight={settings.lineHeight}
            letterSpacing={settings.letterSpacing}
            wordSpacing={settings.wordSpacing}
            preset={generatedPresetString}
            reach={settings.reach}
            falloff={settings.falloff}
            config={config}
            style={{
              fontSize: `${settings.fontSize}rem`,
              fontWeight: "800",
              textAlign: "center",
            }}
          />
        ) : (
          <Proximity
            key={
              "elements" +
              settings.elementCount +
              generatedPresetString +
              settings.duration +
              JSON.stringify(config)
            }
            selector=".dock-icon"
            preset={generatedPresetString}
            reach={settings.reach}
            falloff={settings.falloff}
            config={config}
            style={{
              display: "flex",
              gap: "15px",
              alignItems: "flex-end",
              padding: "20px",
            }}
          >
            {Array.from({ length: settings.elementCount }).map((_, i) => (
              <div
                key={i}
                className="dock-icon"
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              />
            ))}
          </Proximity>
        )}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {/* CORE STRUCTURE */}
        <div
          style={{
            backgroundColor: "#0c0c0c",
            borderRadius: "20px",
            padding: "25px",
            border: "1px solid #1a1a1a",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#fff",
              fontSize: "12px",
              marginBottom: "20px",
            }}
          >
            <Type size={16} /> CORE STRUCTURE
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {mode === "text" ? (
              <>
                <input
                  type="text"
                  aria-label="Text to animate"
                  value={settings.text}
                  onChange={(e) =>
                    setSettings({ ...settings, text: e.target.value })
                  }
                  style={{
                    backgroundColor: "#151515",
                    border: "1px solid #222",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "10px",
                    fontFamily: "inherit",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#fff",
                  }}
                >
                  <span>FONT SIZE</span> <span>{settings.fontSize}rem</span>
                </div>
                <input
                  type="range"
                  aria-label="Font Size"
                  min="1"
                  max="15"
                  step="0.5"
                  value={settings.fontSize}
                  onChange={(e) =>
                    setSettings({ ...settings, fontSize: e.target.value })
                  }
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#fff",
                  }}
                >
                  <span>LINE HEIGHT</span> <span>{settings.lineHeight}</span>
                </div>
                <input
                  type="range"
                  aria-label="Line Height"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      lineHeight: parseFloat(e.target.value),
                    })
                  }
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#fff",
                  }}
                >
                  <span>LETTER GAP</span>{" "}
                  <span>{settings.letterSpacing}em</span>
                </div>
                <input
                  type="range"
                  aria-label="Letter Gap"
                  min="-0.1"
                  max="1"
                  step="0.01"
                  value={settings.letterSpacing}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      letterSpacing: parseFloat(e.target.value),
                    })
                  }
                />
                <div style={{ display: "flex", gap: "5px" }}>
                  {["letter", "word", "line"].map((s) => (
                    <button
                      aria-label="split by button"
                      key={s}
                      onClick={() => setSettings({ ...settings, splitBy: s })}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid #222",
                        fontSize: "10px",
                        fontWeight: "bold",
                        backgroundColor:
                          settings.splitBy === s ? "#fff" : "transparent",
                        color: settings.splitBy === s ? "#000" : "#888",
                        cursor: "pointer",
                      }}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#fff",
                  }}
                >
                  <span>ELEMENT COUNT</span>{" "}
                  <span>{settings.elementCount}</span>
                </div>
                <input
                  type="range"
                  aria-label="Element Count"
                  min="1"
                  max="30"
                  step="1"
                  value={settings.elementCount}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      elementCount: parseInt(e.target.value),
                    })
                  }
                />
              </>
            )}
          </div>
        </div>

        {/* GLOBAL MOTION */}
        <div
          style={{
            backgroundColor: "#0c0c0c",
            borderRadius: "20px",
            padding: "25px",
            border: "1px solid #1a1a1a",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#999",
              fontSize: "12px",
              marginBottom: "20px",
            }}
          >
            <Maximize size={16} /> GLOBAL MOTION
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
              }}
            >
              <span>REACH</span> <span>{settings.reach}</span>
            </div>
            <input
              type="range"
              aria-label="Reach Radius"
              min="0"
              max="50"
              step="0.1"
              value={settings.reach}
              onChange={(e) =>
                setSettings({ ...settings, reach: parseFloat(e.target.value) })
              }
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
              }}
            >
              <span>DURATION</span> <span>{settings.duration}s</span>
            </div>
            <input
              type="range"
              aria-label="Animation Duration"
              min="0"
              max="10"
              step="0.1"
              value={settings.duration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  duration: parseFloat(e.target.value),
                })
              }
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
              }}
            >
              <span>RESET DUR</span> <span>{settings.resetDuration}s</span>
            </div>
            <input
              type="range"
              aria-label="Reset Duration"
              min="0"
              max="10"
              step="0.1"
              value={settings.resetDuration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  resetDuration: parseFloat(e.target.value),
                })
              }
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "5px",
              }}
            >
              <select
                aria-label="Easing Function"
                value={settings.ease}
                onChange={(e) =>
                  setSettings({ ...settings, ease: e.target.value })
                }
                style={{
                  backgroundColor: "#151515",
                  border: "1px solid #222",
                  color: "#fff",
                  padding: "8px",
                  borderRadius: "8px",
                  fontFamily: "inherit",
                  fontSize: "10px",
                }}
              >
                {easeOptions.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <select
                aria-label="Reset Easing Function"
                value={settings.resetEase}
                onChange={(e) =>
                  setSettings({ ...settings, resetEase: e.target.value })
                }
                style={{
                  backgroundColor: "#151515",
                  border: "1px solid #222",
                  color: "#fff",
                  padding: "8px",
                  borderRadius: "8px",
                  fontFamily: "inherit",
                  fontSize: "10px",
                }}
              >
                {easeOptions.map((e) => (
                  <option key={e} value={e}>
                    {e} (Res)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* PRESET CARDS */}
        <Suspense fallback={<div style={{ color: "#888" }}>Loading Settings...</div>}>
        <div
          style={{
            gridColumn: "1 / -1",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >
          <PresetCard id="scale" label="Scale" icon={Maximize} min="0.1" max="4" step="0.1" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
          <PresetCard id="y" label="Y Offset" icon={Move} min="-200" max="200" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
          <PresetCard id="opacity" label="Opacity" icon={Eye} min="0" max="1" step="0.1" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
          <PresetCard id="blur" label="Blur" icon={Layers} min="0" max="50" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
          <PresetCard id="rotate" label="Rotate" icon={Maximize} min="-360" max="360" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
          <PresetCard id="weight" label="Weight" icon={Type} min="100" max="900" step="100" activePresets={activePresets} settings={settings} togglePreset={togglePreset} updateRange={updateRange} />
        </div>
      </Suspense>
      </div>
      <button
        aria-label="copyCode"
        onClick={copyCode}
        style={{
          marginTop: "50px",
          padding: "16px 40px",
          borderRadius: "100px",
          border: "none",
          backgroundColor: copied ? "#10b981" : "#fff",
          color: copied ? "#fff" : "#000",
          fontWeight: "900",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          transition: "0.4s",
          transform: `scale(${copied ? 1.05 : 1})`,
          boxShadow: "0 20px 40px rgba(255,255,255,0.1)",
        }}
      >
        {copied ? <Check size={20} /> : <Copy size={20} />}
        {copied ? "COPIED!" : "COPY ENGINE CODE"}
      </button>
    </main>
  );
};

export default App;