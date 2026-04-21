import React from "react";
import { Eye, EyeOff } from "lucide-react";

export const PresetCard = ({ id, label, icon: Icon, min, max, step = 1, activePresets, settings, togglePreset, updateRange }) => (
  <div
    style={{
      backgroundColor: activePresets[id] ? "#111" : "#080808",
      border: `1px solid ${activePresets[id] ? "#333" : "#1a1a1a"}`,
      borderRadius: "16px",
      padding: "15px",
      transition: "0.3s",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: activePresets[id] ? "15px" : "0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: activePresets[id] ? "#fff" : "#444",
        }}
      >
        <Icon size={16} />
        <span
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      <button
        aria-label="Toggle preset"
        onClick={() => togglePreset(id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: activePresets[id] ? "#10b981" : "#444",
        }}
      >
        {activePresets[id] ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
    {activePresets[id] && (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "9px",
              color: "#555",
              marginBottom: "4px",
            }}
          >
            <span>BASE</span> <span>{settings[id][0]}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={settings[id][0]}
            onChange={(e) => updateRange(id, 0, parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#555" }}
            aria-label={`${label} Base Value`}
          />
        </div>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "9px",
              color: "#aaa",
              marginBottom: "4px",
            }}
          >
            <span>FINAL</span> <span>{settings[id][1]}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={settings[id][1]}
            onChange={(e) => updateRange(id, 1, parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#fff" }}
            aria-label={`${label} Final Value`}
          />
        </div>
      </div>
    )}
  </div>
);