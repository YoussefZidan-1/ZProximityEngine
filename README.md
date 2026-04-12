# 🚀 ZProximity Engine

**A high-performance React engine for proximity-based interactive motion design.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-MVP-orange.svg)
![React](https://img.shields.io/badge/built%20with-React-61dafb.svg)
![GSAP](https://img.shields.io/badge/powered%20by-GSAP-ff0000.svg)

`ZProximity` is a specialized motion engine designed to bridge the gap between complex mathematical physics and beautiful UI design. It allows developers to create organic, reactive animations (scale, blur, rotation, weight, etc.) that respond to user proximity with a single prop.

[**✨ View Live Playground**]([YOUR_PLAYGROUND_URL_HERE]) | [**📦 Coming Soon to NPM**](#)

---

## 🎨 The Concept

Most proximity effects require heavy math, manual event listeners, and complex cleanup logic. `ZProximity` abstracts this complexity into a declarative React API. 

By utilizing **Exponential Decay** math and **GSAP's `quickSetter`** for high-performance DOM updates, the engine ensures buttery-smooth 60fps animations even with large numbers of interactive elements.

> **"Don't just animate. React."**

---

## ✨ Key Features

- **🚀 High Performance:** Built on GSAP, optimized with `quickSetter` to minimize layout thrashing.
- **🎭 Preset System:** Rapidly apply styles like `scale-blur-rotate` or `blur-scale-weight-rotate-y` without writing custom logic write the preset name with the order you like.
- **🔓 The "Escape Hatch":** Full control via `onCalculate` and `onReset` callbacks for advanced users who want to map proximity to custom logic (e.g., audio frequencies or scroll position).
- **🛠️ Visual Playground:** A built-in editor to tweak parameters in real-time and export your configuration instantly.
- **🔡 Intelligent Text Splitting:** Built-in support for splitting text into characters, words, or lines for granular control.

---

## 🚀 Quick Start (Preview)

*Note: Currently available as part of the Playground source code. NPM package is in development.*

```jsx
import { ProximityText } from "./proximity-engine/ProximityText";
import { Proximity } from "./proximity-engine/Proximity";

function App() {
  return (
    <ProximityText 
      text="Beyond the Void"
      preset="scale-blur-rotate"
      config={{
        ease: "elastic",
        duration: 0.2
      }}
      style={{ fontSize: '5rem', fontWeight: '800' }}
    />
  );
}
```

---

## 🛠 Roadmap

We are currently in the **MVP (Minimum Viable Product)** stage. Here is what we are building next:

- [ ] **TypeScript Support** (Full type safety for all configs and props) 🛡️
- [ ] **Touch & Mobile Mode** (Optimized interaction for touch devices) 📱
- [ ] **Scroll-Proximity** (Trigger animations based on scroll depth) 📜
- [ ] **Reduced Motion Support** (Respecting user accessibility settings) ♿
- [ ] **NPM Release** (Official package deployment) 📦

---

## 🤝 Contributing

I am building this in public! If you are a math enthusiast, a GSAP wizard, or a React expert, I would love your help.

1. **Star this repo** if you find it useful! ⭐
2. **Open an Issue** to report bugs or suggest features.
3. **Submit a Pull Request** to help improve the engine.

Your feedback is what will turn this MVP into a professional industry standard.

---

## 👨‍💻 Author

**Yousef Zedan**
*Exploring the intersection of Art, Music, and Code.*

<p align="center">
  <a href="https://yzportfolio.vercel.app" target="blank">
    <img src="https://img.icons8.com/ios/50/B4BEFE/internet--v1.png" alt="Portfolio" height="50" width="50" />
  </a>
  <a href="mailto:zedstudios.devs@gmail.com" target="blank">
    <img src="https://img.icons8.com/ios/50/B4BEFE/gmail-new.png" alt="Gmail" height="50" width="50" />
  </a>
  <a href="https://linkedin.com/in/yousef-zedan-6a275a400" target="blank">
    <img src="https://img.icons8.com/ios/50/B4BEFE/linkedin.png" alt="LinkedIn" height="50" width="50" />
  </a>
  <a href="https://wa.me/201130765715" target="blank">
    <img src="https://img.icons8.com/ios/50/B4BEFE/whatsapp--v1.png" alt="WhatsApp" height="50" width="50" />
  </a>
  <a href="https://x.com/YousefZeda59629" target="blank">
    <img src="https://img.icons8.com/ios/50/B4BEFE/twitterx--v2.png" alt="X" height="50" width="50" />
  </a>
  <a href="https://www.instagram.com/yousef__zedan1/" target="blank">
    <img src="https://img.icons8.com/ios/50/B4BEFE/instagram-new--v1.png" alt="Instagram" height="50" width="50" />
  </a>
</p>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```
