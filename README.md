<div align="center">
  <img src="public/og-image.jpg" alt="ZProximity Engine" width="100%" style="border-radius: 8px; margin-bottom: 20px;" />

  # 🚀 ZProximity Engine
  **The Physics of Attraction for the Modern Web.**
  
  [![NPM Downloads](https://img.shields.io/npm/dt/z-proximity-engine?color=black&style=for-the-badge)](https://www.npmjs.com/package/z-proximity-engine)
  [![NPM Version](https://img.shields.io/npm/v/z-proximity-engine?color=black&style=for-the-badge)](https://www.npmjs.com/package/z-proximity-engine)
  [![Bundle Size](https://img.shields.io/bundlephobia/minzip/z-proximity-engine?color=black&label=Core%20Weight&style=for-the-badge)](https://bundlephobia.com/package/z-proximity-engine)
  [![License](https://img.shields.io/npm/l/z-proximity-engine?color=black&style=for-the-badge)](#license)

> A high-performance React animation library for creating proximity-based interactions, magnetic cursor effects, and scroll-driven animations with GSAP. Perfect alternative to Framer Motion and React Spring for spatial interactions.

[**✨ Live Demo**](https://z-proximity-engine.vercel.app/) • [**📦 NPM**](https://www.npmjs.com/package/z-proximity-engine) • [**📖 Documentation**](https://z-proximity-engine.vercel.app/#implementation) • [**🎮 Interactive Playground**](https://z-proximity-engine.vercel.app/#gamebox)
</div>




---

## 🎯 Why ZProximity Engine?

### Performance First
- ⚡ **120+ FPS**: Runs at native refresh rates
- 📦 **8.7KB Core**: Minimal bundle impact
- 🚀 **GSAP Powered**: Industry-standard animation engine
- 🎭 **Zero Re-renders**: Animations bypass React's render cycle

### Developer Experience
- 💪 **TypeScript**: Full type safety
- 🎨 **30+ Presets**: Scale, magnetic, blur, cipher, and more
- 🔗 **Chainable**: Combine unlimited effects with dash syntax
- 📱 **Mobile Optimized**: Smart performance on touch devices

### Use Cases
- 🎯 Magnetic dock interfaces (macOS-style)
- ✨ Interactive landing pages
- 📜 Scroll-driven storytelling
- 🎮 Game-like UI interactions
- 🔮 Futuristic dashboard effects

---

## 📦 Installation

```bash
npm install z-proximity-engine gsap @gsap/react
```

### Peer Dependencies
```bash
npm install react@^18.0.0 react-dom@^18.0.0 gsap@^3.15.0 @gsap/react@^2.1.2
```

---

## 🚀 Quick Start

### 1. Basic Hover Effect (3 lines)

```tsx
import { Proximity } from 'z-proximity-engine';

export const HoverCards = () => (
  <Proximity preset="scale-blur" reach={2}>
    <div className="prox-item">Card 1</div>
    <div className="prox-item">Card 2</div>
    <div className="prox-item">Card 3</div>
  </Proximity>
);
```

### 2. Text Animations

```tsx
import { ProximityText } from 'z-proximity-engine';

export const Hero = () => (
  <ProximityText 
    text="HOVER ME"
    preset="scale-opacity-cipher"
    splitBy="letter"
    reach={1.5}
  />
);
```

### 3. Scroll Reveal

```tsx
export const Features = () => (
  <Proximity
    mode="scroll"
    preset="reveal-opacity"
    config={{
      scroll: { start: "top 90%", once: true },
      stagger: 0.2
    }}
  >
    <div className="prox-item">Feature 1</div>
    <div className="prox-item">Feature 2</div>
  </Proximity>
);
```

---

## 🎨 Animation Presets

### Transform
`scale` | `flexScale` | `x` | `y` | `rotate` | `skew`

### Appearance
`opacity` | `blur` | `reveal` | `glow` | `brightness`

### Physics
`magnetic` | `repel` | `tilt` | `tiltCard`

### Typography
`weight` | `cipher` | `letterSpacing` | `color`

### Combine with Dash Syntax
```tsx
preset="scale-blur-magnetic-opacity"
```

---

## 🏗️ Real-World Examples

### macOS Dock Effect
```tsx
<Proximity 
  nearestPreset="scale-magnetic" // Closest icon grows & pulls
  neighborPreset="repel"         // Others push away
  config={{ reach: 2.5, lockAxis: 'x' }}
>
  {icons.map(icon => (
    <div key={icon} className="prox-item dock-icon">
      {icon}
    </div>
  ))}
</Proximity>
```

### Cipher Decryption
```tsx
<ProximityText 
  text="CLASSIFIED"
  preset="cipher-scale"
  config={{ 
    cipher: [0, 1],  // Scrambled → Clear
    reach: 2 
  }}
/>
```

### Magnetic Button
```tsx
<Proximity preset="magnetic-scale" reach={1.5}>
  <button className="prox-item">Click Me</button>
</Proximity>
```

---

## 📊 Performance Benchmarks

| Metric | Value |
|--------|-------|
| Core Bundle Size | 8KB (gzipped) |
| First Contentful Paint | < 1s |
| Time to Interactive | < 1.5s |
| Animation FPS | 120+ |
| Supported Elements | 100+ simultaneous |

---

## 🔧 API Reference

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `preset` | `string` | - | Chain effects with dashes |
| `reach` | `number` | `2` | Influence radius |
| `falloff` | `number` | `2.4` | Curve steepness |
| `duration` | `number` | `0.2` | Animation speed |
| `ease` | `string` | `"power1.out"` | GSAP easing |
| `mode` | `"pointer" \| "scroll"` | `"pointer"` | Trigger type |

[**📖 Full API Documentation**](https://z-proximity-engine.vercel.app/#api-reference)

---

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-preset`)
3. Commit your changes (`git commit -m 'Add amazing preset'`)
4. Push to the branch (`git push origin feature/amazing-preset`)
5. Open a Pull Request

---

## 📝 License

MIT © [Youssef Zidan](https://github.com/YoussefZidan-1)

---

## 🔗 Links

- [🌐 Official Website](https://z-proximity-engine.vercel.app/)
- [📦 NPM Package](https://www.npmjs.com/package/z-proximity-engine)
- [💬 GitHub Discussions](https://github.com/YoussefZidan-1/ZProximityEngine/discussions)
- [🐛 Issue Tracker](https://github.com/YoussefZidan-1/ZProximityEngine/issues)
- [👨‍💻 Author Portfolio](https://yzportfolio.vercel.app)
- [💼 LinkedIn](https://www.linkedin.com/in/yousef-zedan-6a275a400/)

---

## 🏆 Alternatives Comparison

| Feature | ZProximity | Framer Motion | React Spring |
|---------|-----------|---------------|--------------|
| Proximity Detection | ✅ Built-in | ❌ Manual | ❌ Manual |
| Bundle Size | 8.7KB | ~50KB | ~15KB |
| GSAP Integration | ✅ Native | ⚠️ Possible | ❌ No |
| Scroll Animations | ✅ Built-in | ✅ Built-in | ⚠️ External |
| TypeScript | ✅ Full | ✅ Full | ✅ Full |
| Learning Curve | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

**Made with ⚡ by [Youssef Zidan](https://github.com/YoussefZidan-1)**

*If this library helped you, please ⭐ star the repo!*

---

### Keywords
`react animation`, `proximity detection`, `magnetic cursor`, `hover effects`, `scroll animations`, `gsap react`, `motion design`, `interactive ui`, `spatial interactions`, `cursor effects`, `animation library`, `react gsap`, `framer motion alternative`, `react spring alternative`, `proximity-based animations`, `distance-based effects`