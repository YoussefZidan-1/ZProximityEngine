import React, { useRef, useMemo, ReactNode, CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type EasePreset = 
  | "smooth" | "heavy" | "sharp" | "fluid" | "bouncy" | "elastic" 
  | "jello" | "bounce" | "swing" | "vibrate" | "robot" | "ghost" 
  | "expo" | "circus" | "glitch" | "slowmo" | (string & {});

export type ProximityPreset = 
  | "scale" | "y" | "x" | "opacity" | "blur" | "rotate" | "weight" | "skew" | "magnetic" | "tilt" | "tiltCard" | "repel" | "cipher" | "reveal"
  | (string & {});

export type ProximityMode = "pointer" | "scroll";

export interface ProximityTimelineConfig {
  duration?: number;
  resetDuration?: number;
  delay?: number;
  resetDelay?: number;
  ease?: EasePreset;
  resetEase?: EasePreset;
}

export interface ProximityConfig {
  mode?: ProximityMode;
  scrollFocus?: "top" | "center" | "middle" | "bottom" | number;
  scrollStart?: string;
  scrollEnd?: string;
  reach?: number; falloff?: number; duration?: number; resetDuration?: number;
  global?: boolean; explicit?: boolean; 
  preset?: ProximityPreset; 
  nearestPreset?: ProximityPreset; 
  neighborPreset?: ProximityPreset;
  ease?: EasePreset; resetEase?: EasePreset;
  maxTravel?: number;
  timeline?: Record<string, ProximityTimelineConfig>;
  scale?:[number, number]; y?:[number, number]; x?:[number, number]; opacity?:[number, number];
  blur?:[number, number]; rotate?:[number, number]; weight?:[number, number];
  skew?:[number, number]; magnetic?:[number, number]; tilt?:[number, number]; tiltCard?:[number, number]; repel?: [number, number];
  cipher?:[number, number]; reveal?: [number, number];
  onCalculate?: (intensity: number, distance: number, dx: number, dy: number, isNearest: boolean) => gsap.TweenVars;
  onReset?: () => gsap.TweenVars;
}

export interface ProximityProps extends ProximityConfig {
  children: ReactNode; selector?: string; config?: ProximityConfig;
  ignoreSelectors?: string[]; excludeElements?: string; className?: string; style?: CSSProperties;
}

const PRESET_DEFAULTS: Record<string, [number, number]> = {
  scale:[1, 1.5], y: [0, -30], x:[0, 30], opacity:[0.2, 1], blur: [8, 0], rotate:[0, 90], weight:[100, 900],
  skew:[0, 20], magnetic:[0, 0.1], tilt:[0, 30], tiltCard:[0, 15], repel: [0, 0.4], cipher: [0, 1], reveal:[110, 0]
};

const EASE_MAP: Record<string, string> = {
  smooth: "power1.inOut", heavy: "power4.out", sharp: "expo.out", fluid: "circ.inOut",
  bouncy: "back.out(1.7)", elastic: "elastic.out(1, 0.3)", jello: "elastic.out(1.5, 0.2)",
  bounce: "bounce.out", swing: "back.inOut(3)", vibrate: "rough({ strength: 2, points: 20, template: 'none', taper: 'none', randomize: true })",
  robot: "steps(8)", ghost: "slow(0.6, 0.8, false)", expo: "expo.inOut", circus: "back.out(4)",
  glitch: "rough({ template: 'none', strength: 3, points: 50, taper: 'both', randomize: true })", slowmo: "slow(0.7, 0.7, false)"
};

const calculatePresetValues = (
  activePresetString: string, allPresetsString: string, intensity: number, userConfig: Record<string, [number, number] | undefined>, 
  dx: number, dy: number, w: number, h: number, isReset: boolean = false, maxTravel?: number
): Record<string, gsap.TweenVars> => {
  const activeProps = new Set(activePresetString.split("-").filter(Boolean));
  const allProps = Array.from(new Set(allPresetsString.split("-").filter(Boolean)));
  const result: Record<string, gsap.TweenVars> = {};

  const clampTravel = (val: number) => {
    if (maxTravel === undefined || maxTravel === Infinity) return val;
    return Math.max(-maxTravel, Math.min(val, maxTravel));
  };

  allProps.forEach((prop) => {
    const bounds = userConfig[prop] || PRESET_DEFAULTS[prop];
    if (!bounds) return;
    const isActive = activeProps.has(prop);
    const useBase = isReset || !isActive;
    const currentIntensity = useBase ? 0 : intensity;
    const[base, max] = bounds;
    const currentValue = base + (max - base) * currentIntensity;
    result[prop] = {}; 
    if (prop === "blur") result[prop].filter = `blur(${currentValue}px)`;
    else if (prop === "weight") {
      const weightVal = Math.round(currentValue);
      result[prop].fontWeight = weightVal; 
      result[prop].fontVariationSettings = `'wght' ${weightVal}`;
    } 
    else if (prop === "rotate") result[prop].rotation = currentValue;
    else if (prop === "skew") result[prop].skewX = currentValue;
    else if (prop === "cipher") result[prop].proxCipher = currentValue;
    else if (prop === "reveal") {
        result[prop].y = `${currentValue}%`;
        result[prop].clipPath = `inset(0% 0% ${currentValue}% 0%)`;
    }
    else if (prop === "magnetic") {
        const pullX = dx * currentIntensity * max;
        const pullY = dy * currentIntensity * max;
        result[prop].x = useBase ? 0 : clampTravel(pullX);
        result[prop].y = useBase ? 0 : clampTravel(pullY);
        result[prop].rotation = useBase ? 0 : clampTravel(pullX) * 0.05;
    }
    else if (prop === "repel") {
        const pushX = -dx * currentIntensity * max;
        const pushY = -dy * currentIntensity * max;
        result[prop].x = useBase ? 0 : clampTravel(pushX);
        result[prop].y = useBase ? 0 : clampTravel(pushY);
    }
    else if (prop === "tilt") {
        result[prop].rotateX = useBase ? 0 : clampTravel(-dy * currentIntensity * (max / 10));
        result[prop].rotateY = useBase ? 0 : clampTravel(dx * currentIntensity * (max / 10));
        result[prop].transformPerspective = 1000;
    }
    else if (prop === "tiltCard") {
        result[prop].rotateX = useBase ? 0 : clampTravel((dy / (h / 2)) * -max * currentIntensity);
        result[prop].rotateY = useBase ? 0 : clampTravel((dx / (w / 2)) * max * currentIntensity);
        result[prop].transformPerspective = 1000;
    }
    else result[prop][prop] = currentValue; 
  });
  return result;
};

function cipherUpdate(this: any) {
  const item = this.targets()[0];
  if (!item || item.children.length > 0) return; 
  const val = item.proxCipher;
  if (val === undefined) return;
  const orig = item.dataset.proxOriginal;
  if (!orig || orig.trim() === "") return;
  if (val <= 0.01) {
      if (item.textContent !== orig) item.textContent = orig;
      return;
  }
  const now = Date.now();
  if (item._lastCipherUpdate && now - item._lastCipherUpdate < 60) return;
  item._lastCipherUpdate = now;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$*&%0123456789";
  let scrambled = "";
  for (let i = 0; i < orig.length; i++) {
      if (orig[i] === " " || orig[i] === "\n") { scrambled += orig[i]; continue; }
      if (Math.random() < val) { scrambled += chars[Math.floor(Math.random() * chars.length)]; } else { scrambled += orig[i]; }
  }
  if (item.textContent !== scrambled) { item.textContent = scrambled; }
}

export const Proximity: React.FC<ProximityProps> = ({
  children, selector = ".prox-item", config = {}, preset = "", nearestPreset = "", neighborPreset = "", reach = 2, falloff = 2.4,
  duration = 0.2, resetDuration = 0.4, global = false, explicit = false, mode = "pointer", 
  scrollFocus = "center", scrollStart = "top bottom", scrollEnd = "bottom top",
  maxTravel, onCalculate, onReset, ease, resetEase,
  scale, y, x, opacity, blur, rotate, weight, skew, magnetic, tilt, tiltCard, repel, cipher, reveal, ignoreSelectors =[], excludeElements, className = "", style = {}, ...restProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, target: null as EventTarget | null, active: false });

  const activeReach = config.reach ?? reach; 
  const activeFalloff = config.falloff ?? falloff;
  const activeDuration = config.duration ?? duration; 
  const activeResetDuration = config.resetDuration ?? resetDuration;
  const activeGlobal = config.global ?? global; 
  const activeExplicit = config.explicit ?? explicit; 
  const activePreset = config.preset ?? preset;
  const activeNearestPreset = config.nearestPreset ?? nearestPreset;
  const activeNeighborPreset = config.neighborPreset ?? neighborPreset;
  const activeMaxTravel = config.maxTravel ?? maxTravel;
  const activeOnCalculate = config.onCalculate ?? onCalculate; 
  const activeOnReset = config.onReset ?? onReset;
  const activeScrollFocus = config.scrollFocus ?? scrollFocus;
  const activeScrollStart = config.scrollStart ?? scrollStart;
  const activeScrollEnd = config.scrollEnd ?? scrollEnd;

  const targetEase = EASE_MAP[config.ease ?? (ease as string)] || config.ease || ease || "power1.out";
  const targetResetEase = EASE_MAP[config.resetEase ?? (resetEase as string)] || config.resetEase || resetEase || "power2.out";

  const timelineConfigStr = JSON.stringify(config.timeline || {});
  const mergedBoundsStr = JSON.stringify({
    scale: config.scale ?? scale, y: config.y ?? y, x: config.x ?? x, opacity: config.opacity ?? opacity,
    blur: config.blur ?? blur, rotate: config.rotate ?? rotate, weight: config.weight ?? weight,
    skew: config.skew ?? skew, magnetic: config.magnetic ?? magnetic, tilt: config.tilt ?? tilt, tiltCard: config.tiltCard ?? tiltCard, repel: config.repel ?? repel, cipher: config.cipher ?? cipher, reveal: config.reveal ?? reveal
  });
  
  const mergedBounds = useMemo(() => JSON.parse(mergedBoundsStr), [mergedBoundsStr]);
  const activeTimeline = useMemo(() => JSON.parse(timelineConfigStr),[timelineConfigStr]);
  const allPresetsStr = useMemo(() => {
    return Array.from(new Set([activePreset, activeNearestPreset, activeNeighborPreset].filter(Boolean).flatMap(p => p.split('-')))).join('-');
  },[activePreset, activeNearestPreset, activeNeighborPreset]);

  const getScrollFocusValue = (focus: string | number) => {
    if (typeof focus === 'number') return focus / 100;
    switch (focus) {
        case "top": return 0;
        case "bottom": return 1;
        case "middle":
        case "center": return 0.5;
        default: return 0.5;
    }
  };

  useGSAP(() => {
    const container = containerRef.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let items: HTMLElement[] = []; 
    let centers: any[] = [];
    let states: any[] = [];
    let setters: any[] = [];
    let scrollTriggers: any[] = [];

    const updateCenters = () => {
      centers = items.map((item) => {
        const rect = item.getBoundingClientRect();
        return {
          left: rect.left + window.scrollX, right: rect.right + window.scrollX, top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY,
          x: rect.left + window.scrollX + rect.width / 2, y: rect.top + window.scrollY + rect.height / 2, w: rect.width, h: rect.height
        };
      });
    };

    const initItems = () => {
      if (items.length > 0) gsap.killTweensOf(items);
      const targetSelector = excludeElements && excludeElements.trim() !== "" ? selector.split(',').map(s => `${s.trim()}:not(${excludeElements})`).join(', ') : selector;
      items = Array.from(container.querySelectorAll(targetSelector));
      items.forEach(item => {
          if (item.dataset.proxOriginal === undefined) item.dataset.proxOriginal = item.textContent || "";
          if ((item as any).proxCipher === undefined) (item as any).proxCipher = 0;
      });
      states = items.map(() => ({ isOutside: true, lastIntensity: 0, lastDx: 0, lastDy: 0 }));
      setters = items.map(item => ({
        intensity: gsap.quickSetter(item, "--prox-intensity") as (val: any) => void,
        dx: gsap.quickSetter(item, "--prox-dx", "px") as (val: any) => void,
        dy: gsap.quickSetter(item, "--prox-dy", "px") as (val: any) => void
      }));
      updateCenters();
      
      const groupedProps = activeOnReset ? { custom: activeOnReset() } : calculatePresetValues("", allPresetsStr, 0, mergedBounds, 0, 0, 1, 1, true, activeMaxTravel);
      const flatProps: gsap.TweenVars = { willChange: "transform, filter, opacity, font-variation-settings, clip-path" };
      Object.values(groupedProps).forEach(v => Object.assign(flatProps, v));
      if (Object.keys(flatProps).length > 1 && items.length > 0) gsap.set(items, flatProps);
    };

    const mutationObserver = new MutationObserver((mutations) => {
      const hasNewElements = mutations.some(m => Array.from(m.addedNodes).some(n => n.nodeType === 1) || Array.from(m.removedNodes).some(n => n.nodeType === 1));
      if (hasNewElements) initItems();
    });
    const resizeObserver = new ResizeObserver(() => { updateCenters(); if(mode === "scroll") ScrollTrigger.refresh(); });
    mutationObserver.observe(container, { childList: true, subtree: true });
    resizeObserver.observe(container);

    if (mode === "scroll") {
        const setupScroll = () => {
            initItems();
            scrollTriggers.forEach(t => t.kill());
            const focusPoint = getScrollFocusValue(activeScrollFocus);
            items.forEach((item, i) => {
              scrollTriggers.push(ScrollTrigger.create({
                trigger: item, start: activeScrollStart, end: activeScrollEnd,
                onUpdate: (self) => {
                  const intensity = Math.pow(Math.max(0, 1 - Math.abs(self.progress - focusPoint)), activeFalloff);
                  const gp = activeOnCalculate ? { custom: activeOnCalculate(intensity, 0, 0, 0, true) } : calculatePresetValues(activePreset, allPresetsStr, intensity, mergedBounds, 0, 0, centers[i]?.w||1, centers[i]?.h||1, false, activeMaxTravel);
                  Object.keys(gp).forEach(key => {
                      const tl = activeTimeline?.[key] || {};
                      gsap.to(item, { ...gp[key], duration: tl.duration || 0.1, delay: tl.delay || 0, ease: EASE_MAP[tl.ease as string] || tl.ease || "none", overwrite: "auto", onUpdate: key === "cipher" ? cipherUpdate : undefined });
                  });
                  setters[i].intensity(intensity.toFixed(3));
                }
              }));
            });
        };
        if (document.fonts) document.fonts.ready.then(setupScroll); else setupScroll();
    } else {
        // --- POINTER MODE ---
        if (document.fonts) document.fonts.ready.then(initItems); else initItems();
        const actualSpread = activeReach * 10000; 
        const maxDistance = activeReach * 200;

        const onTick = () => {
          if (!pointer.current.active) return;
          const pageX = pointer.current.x + window.scrollX; const pageY = pointer.current.y + window.scrollY;
          const isBlocked = ignoreSelectors.some((sel) => (pointer.current.target as HTMLElement)?.closest?.(sel));
          let nearestIndex = -1; let minDistance = Infinity;

          const dData = items.map((_, i) => {
            const b = centers[i]; if (!b) return { d: Infinity, dx: 0, dy: 0 };
            const dx = pageX - b.x; const dy = pageY - b.y;
            const isInside = pageX >= b.left && pageX <= b.right && pageY >= b.top && pageY <= b.bottom;
            let d = (isBlocked || (activeExplicit && !isInside)) ? Infinity : Math.sqrt(Math.pow(Math.max(b.left - pageX, 0, pageX - b.right), 2) + Math.pow(Math.max(b.top - pageY, 0, pageY - b.bottom), 2));
            if (d < minDistance) { minDistance = d; nearestIndex = i; }
            return { d, dx, dy };
          });

          items.forEach((item, i) => {
            const { d, dx, dy } = dData[i];
            const isNearest = i === nearestIndex && d <= maxDistance;
            if (d > maxDistance) {
              if (!states[i].isOutside) {
                const gr = activeOnReset ? { custom: activeOnReset() } : calculatePresetValues("", allPresetsStr, 0, mergedBounds, 0, 0, centers[i].w, centers[i].h, true, activeMaxTravel);
                gsap.to(item, { "--prox-intensity": 0, duration: activeResetDuration, ease: targetResetEase, overwrite: "auto" });
                Object.keys(gr).forEach(k => {
                  const tl = activeTimeline?.[k] || {};
                  gsap.to(item, { ...gr[k], duration: tl.resetDuration ?? activeResetDuration, ease: EASE_MAP[tl.resetEase as string] || tl.resetEase || targetResetEase, overwrite: "auto", onUpdate: k === "cipher" ? cipherUpdate : undefined });
                });
                states[i].isOutside = true; states[i].lastIntensity = 0;
              }
              return;
            }
            const intensity = Math.exp(-(Math.pow(d, activeFalloff)) / actualSpread);
            const hasMoved = Math.abs(intensity - states[i].lastIntensity) > 0.001 || Math.abs(dx - states[i].lastDx) > 0.5;
            const isCipherActive = (item as any).proxCipher > 0.01;

            if (hasMoved) {
              setters[i].intensity(intensity.toFixed(3)); setters[i].dx(dx); setters[i].dy(dy);
              let cp = activePreset || "";
              if (isNearest && activeNearestPreset) cp = cp ? `${cp}-${activeNearestPreset}` : activeNearestPreset; 
              else if (!isNearest && activeNeighborPreset) cp = cp ? `${cp}-${activeNeighborPreset}` : activeNeighborPreset;
              const gp = activeOnCalculate ? { custom: activeOnCalculate(intensity, d, dx, dy, isNearest) } : calculatePresetValues(cp, allPresetsStr, intensity, mergedBounds, dx, dy, centers[i].w, centers[i].h, false, activeMaxTravel);
              Object.keys(gp).forEach(k => {
                  const tl = activeTimeline?.[k] || {};
                  gsap.to(item, { ...gp[k], duration: tl.duration ?? activeDuration, ease: EASE_MAP[tl.ease as string] || tl.ease || targetEase, overwrite: "auto", onUpdate: k === "cipher" ? cipherUpdate : undefined });
              });
              states[i].lastIntensity = intensity; states[i].lastDx = dx; states[i].lastDy = dy; states[i].isOutside = false;
            } else if (isCipherActive && allPresetsStr.includes('cipher')) {
              cipherUpdate.call({ targets: () => [item] });
            }
          });
        };

        gsap.ticker.add(onTick);
        const targetElement: EventTarget = activeGlobal ? window : container;
        const upd = (x: number, y: number, target: EventTarget | null) => { pointer.current = { x, y, target, active: true }; };
        const onMove = (e: PointerEvent) => upd(e.clientX, e.clientY, e.target);
        const onTMove = (e: TouchEvent) => { if (e.touches?.[0]) upd(e.touches[0].clientX, e.touches[0].clientY, e.target); };
        const handleReset = () => {
          pointer.current.active = false;
          items.forEach((item, i) => {
            const gr = activeOnReset ? { custom: activeOnReset() } : calculatePresetValues("", allPresetsStr, 0, mergedBounds, 0, 0, centers[i]?.w||1, centers[i]?.h||1, true, activeMaxTravel);
            gsap.to(item, { "--prox-intensity": 0, duration: activeResetDuration, ease: targetResetEase, overwrite: "auto" });
            Object.keys(gr).forEach(k => gsap.to(item, { ...gr[k], duration: activeResetDuration, ease: targetResetEase, overwrite: "auto", onUpdate: k === "cipher" ? cipherUpdate : undefined }));
          });
          states.forEach(s => { s.isOutside = true; s.lastIntensity = 0; });
        };
        targetElement.addEventListener("pointermove", onMove as EventListener);
        targetElement.addEventListener("pointerleave", handleReset as EventListener);
        targetElement.addEventListener("touchmove", onTMove as EventListener, { passive: true });
        targetElement.addEventListener("touchend", handleReset as EventListener);

        return () => {
          gsap.ticker.remove(onTick);
          targetElement.removeEventListener("pointermove", onMove as EventListener);
          targetElement.removeEventListener("pointerleave", handleReset as EventListener);
          targetElement.removeEventListener("touchmove", onTMove as EventListener);
          targetElement.removeEventListener("touchend", handleReset as EventListener);
        };
    }

    return () => {
        mutationObserver.disconnect(); resizeObserver.disconnect();
        scrollTriggers.forEach(t => t.kill());
        gsap.killTweensOf(items);
    };
  }, { 
    dependencies:[
      selector, excludeElements, activePreset, activeNearestPreset, activeNeighborPreset, activeReach, activeFalloff, activeDuration, activeMaxTravel,
      activeResetDuration, activeGlobal, activeExplicit, mergedBoundsStr, allPresetsStr, timelineConfigStr, ignoreSelectors.join(','), targetEase, targetResetEase, mode, 
      activeScrollFocus, activeScrollStart, activeScrollEnd
    ],
    scope: containerRef
  });

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', touchAction: 'none', ...style }} {...restProps}>
      {children}
    </div>
  );
};