# 🚀 ZProximity Engine

### **The physics of attraction for your UI.**

`ZProximity` is a high-performance React motion engine designed to bridge the gap between complex mathematical physics and organic UI design. Create reactive, buttery-smooth interactions that respond to user proximity with a single declarative prop.

[**✨ View Live Playground**](https://z-proximity-engine.vercel.app/)

---

## 🎨 Why ZProximity?

Most proximity effects require manual event listeners, heavy math, and complex cleanup logic that kills performance. **ZProximity** abstracts this into a performance-first architecture:

- **🚀 GSAP Power:** Optimized with `quickSetter` to bypass React's render cycle for 60/120fps+ updates.
- **🧠 Exponential Decay:** Uses advanced math (not linear distance) to create organic, "magnetic" feels.
- **🎭 String-Based Presets:** Combine effects like `scale-blur-rotate-weight` instantly with the order you like.
- **🔡 Text-First:** Built-in intelligent splitting for characters, words, or lines.

---

## 📦 Installation

```bash
npm install z-proximity-engine gsap @gsap/react
```
---

## 🚀 Quick Start

### 1. Basic Text Interaction
Transform static text into a reactive, magnetic element.

```jsx
import { ProximityText } from 'z-proximity-engine';

const MyComponent = () => (
  <ProximityText 
    text="BEYOND THE VOID"
    preset="scale-blur-opacity"
    config={{
      reach: 1.5,
      duration: 1,
      ease: "elastic"
    }}
    style={{ fontSize: '4rem', fontWeight: '900' }}
  />
);
```

### 2. Element Groups (The "Dock" Effect)
Apply proximity to any group of React elements (cards, icons, buttons).

```jsx
import { Proximity } from 'z-proximity-engine';

const Dock = () => (
  <Proximity 
    selector=".item" 
    preset="y-scale"
    config={{ y: [0, -50], scale: [1, 1.5] }}
  >
    <div className="item">🚀</div>
    <div className="item">✨</div>
    <div className="item">🔥</div>
  </Proximity>
);
```

---

## 🛠 Features Deep-Dive

### **The Preset System**
Don't write CSS logic. Chain your desired effects in the `preset` prop string. Order doesn't matter; performance is guaranteed.

| Preset | Effect |
| :--- | :--- |
| `scale` | Changes element size |
| `y` | Moves element on the Y-axis |
| `opacity` | Smoothly fades elements in/out |
| `blur` | Transitions between sharp and blurred |
| `rotate` | Rotates elements based on proximity |
| `weight` | Animates Variable Font weight (requires variable font) |

### **The "Escape Hatch" (Custom Logic)**
For advanced users, use the `onCalculate` callback to map proximity intensity to *anything* (audio, custom SVG paths, etc).

```jsx
<Proximity
  onCalculate={(intensity, distance) => ({
    backgroundColor: `rgba(170, 59, 255, ${intensity})`,
    x: Math.sin(distance) * 10
  })}
>
  <div>Custom Logic</div>
</Proximity>
```

---

## ⚙️ API Reference

### `ProximityProps` & `ProximityTextProps`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `preset` | `string` | `""` | Dash-separated effects (e.g., `"scale-y-blur"`) |
| `reach` | `number` | `2` | Radius of influence (Higher = further reach) |
| `falloff` | `number` | `2.4` | How quickly the effect fades (Exponential power) |
| `duration` | `number` | `0.2` | Speed of the "attraction" animation |
| `resetDuration`| `number` | `0.4` | Speed of the "return to home" animation |
| `ease` | `EasePreset` | `"power1.out"` | Custom easing (smooth, bouncy, elastic, etc.) |
| `global` | `boolean` | `false` | If true, tracks mouse even outside the container |

---

## ♿ Accessibility & Performance
- [x] **Reduced Motion:** Automatically respects `prefers-reduced-motion` settings and disables animations.
- [x] **Smart Throttling:** Internal logic prevents unnecessary GSAP overwrites if the movement delta is below 1%.
- [x] **Zero Layout Thrashing:** Uses CSS Variables and transforms to ensure animations happen on the GPU.

- [ ] **Auto-Arabic Support:** Intelligent word-based grouping for cursive scripts to maintain typography integrity.

- [ ] **Z-SVG Engine:** Directly manipulating SVG paths and points via proximity.

- [x] **NPM Official Release:** A lightweight, tree-shakable package.
      
---
## 🤝 Contributing
This is a Public Build. If you are a GSAP wizard or a Math enthusiast, your PRs are welcome!

This engine is built for the community. If you have a math-based preset or a performance optimization, PRs are welcome!

1. Star the repo ⭐
2. Open an issue for feature requests.
3. Submit a PR with your creative additions.

---

## 📄 License
MIT © [Yousef Zedan](https://github.com/yousef-zedan)
