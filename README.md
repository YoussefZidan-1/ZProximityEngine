# 🚀 ZProximity Engine v1.5.0

### **The Physics of Attraction for the Modern Web.**

`ZProximity` is a high-performance React motion engine designed to bridge the gap between complex mathematical physics and organic UI design. Create reactive, buttery-smooth interactions that respond to user proximity with a single declarative prop.

[**✨ View Live Playground**](https://z-proximity-engine.vercel.app/) • [**📦 NPM Package**](https://www.npmjs.com/package/z-proximity-engine)

---

## 🎨 Why ZProximity?

Most proximity effects require manual event listeners and heavy math that kills performance. **ZProximity** abstracts this into a performance-first architecture:

- **🚀 GSAP Power:** Optimized with `quickSetter` to bypass React's render cycle for 120fps+ updates.
- **🧠 Exponential Decay:** Uses advanced math (not linear distance) for an organic, "magnetic" feel.
- **🎭 String-Based Presets:** Chain effects like `scale-blur-rotate-weight` instantly.
- **🔡 Text-First:** Intelligent splitting for characters, words, or lines.
- **⏳ Micro-Timing:** v1.5.0 introduces per-property timeline control.

---

## 📦 Installation

```bash
npm install z-proximity-engine gsap @gsap/react
```

---

## 🚀 Quick Start

### 1. The "Cipher" Reveal (Text)
Transform static text into a reactive, scrambling hacker-style element.

```jsx
import { ProximityText } from 'z-proximity-engine';

const MyComponent = () => (
  <ProximityText 
    text="TOP SECRET"
    preset="cipher-scale-opacity"
    config={{
      cipher: [1, 0], // Scrambled at distance, clear on hover
      reach: 1.5,
      ease: "sharp"
    }}
  />
);
```

### 2. The "Interactive Dock" (Elements)
Apply physics to any group of React elements (cards, icons, buttons).

```jsx
import { Proximity } from 'z-proximity-engine';

const Dock = () => (
  <Proximity 
    selector=".item" 
    nearestPreset="scale-y" 
    neighborPreset="repel"
    config={{ y: [0, -50], scale: [1, 1.5] }}
  >
    <div className="item">🚀</div>
    <div className="item">✨</div>
    <div className="item">🔥</div>
  </Proximity>
);
```

---

## 🛠 Features & Abilities

### **1. The Preset Library**
ZProximity comes with 13 built-in presets that can be combined using dash-syntax (e.g., `preset="scale-blur-tilt"`).

| Category | Preset | Description |
| :--- | :--- | :--- |
| **Transform** | `scale`, `x`, `y`, `rotate`, `skew` | Standard 2D hardware-accelerated transforms. |
| **Appearance** | `opacity`, `blur` | Smooth visibility and depth-of-field transitions. |
| **Physics** | `magnetic`, `repel` | Elements pull toward or push away from the cursor. |
| **3D Space** | `tilt`, `tiltCard` | Realistic 3D rotation following the pointer angle. |
| **Specialist** | `weight`, `cipher` | Animates Variable Font weights or "Hacker" text scrambling. |

---

### **2. ⏳ Timeline Overrides (New)**
You no longer have to use a global duration. Give every property its own timing for a staggered, high-end feel.

```jsx
config={{
  timeline: {
    blur: { duration: 0.1 },                // Instant response
    scale: { duration: 0.8, ease: "bouncy" }, // Rubbery lag
    rotate: { delay: 0.1, duration: 1.5 }    // Trailing effect
  }
}}
```

---

### **3. 🎯 Split Focus Logic (New)**
The engine can distinguish between the element you are touching and its neighbors.
- **`nearestPreset`**: Applied to the element closest to the cursor.
- **`neighborPreset`**: Applied to surrounding elements to create "space."

---

### **4. 🛡️ Movement Constraints**
- **`maxTravel`**: Clamp the maximum pixels an element can move (essential for `magnetic` and `repel`).
- **`explicit`**: If `true`, the effect only triggers when the mouse is physically inside the container’s bounding box.
- **`global`**: If `true`, tracks the mouse across the entire window, regardless of where the container is.

---

### **5. 🔡 Advanced Text Control**
`ProximityText` offers granular control over typography:
- **`splitBy`**: Split by `"letter"`, `"word"`, or `"line"`.
- **`ignoreText`**: An array of strings or Regex (e.g., `["&", /@/ ]`) that the engine will skip animating.
- **`clipFix`**: Adds invisible padding to prevent "cutoff" edges on bouncy or scaled text.

---

## ⚙️ API Reference

### `ProximityConfig`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `reach` | `number` | `2` | Radius of influence (Higher = further reach). |
| `falloff` | `number` | `2.4` | Power of the exponential decay (Curve smoothness). |
| `duration` | `number` | `0.2` | Entry animation speed. |
| `resetDuration`| `number` | `0.4` | "Return to home" animation speed. |
| `ease` | `string` | `"power1.out"` | Custom easing (smooth, bouncy, elastic, jello, etc.). |
| `maxTravel` | `number` | `Infinity` | Clamps the movement in pixels. |
| `onCalculate` | `function` | `null` | The "Escape Hatch" for custom math mapping. |

---

## ♿ Accessibility & Performance
- [x] **Reduced Motion:** Automatically detects `prefers-reduced-motion` and kills all animations.
- [x] **Zero Layout Thrashing:** Uses `quickSetter` to modify transforms/filters on the GPU layer.
- [x] **Smart Throttling:** Skips updates if the movement delta is below 0.001%.
- [x] **Mutation Aware:** Automatically re-initializes if the DOM structure changes.

---

## 🤝 Contributing
Built by **Yousef Zedan**. This is an open-source project. If you are a GSAP wizard or a Math enthusiast, your PRs are welcome!

1. Star the repo ⭐
2. Submit a PR with your creative additions.

---

## 📄 License
MIT © [Yousef Zedan](https://github.com/yousef-zedan)