import React, { useRef, useMemo, CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type EasePreset = 
  | "smooth" | "heavy" | "sharp" | "fluid" | "bouncy" | "elastic" 
  | "jello" | "bounce" | "swing" | "vibrate" | "robot" | "ghost" 
  | "expo" | "circus" | "glitch" | "slowmo" | "spring" | "heavySpring"
  | "anticipate" | "launch" | "drift" | "whiplash" | (string & {});

export type ProximityPreset = 
  | "scale" | "y" | "x" | "opacity" | "blur" | "rotate" | "weight" | "skew" | "magnetic" | "tilt" | "tiltCard" | "repel" | "cipher" | "reveal"
  | (string & {});

export type ProximityMode = "pointer" | "scroll";

export interface ProximityScrollConfig {
  start?: "appear" | "top" | "center" | "middle" | "bottom" | (string & {});
  end?: "top" | "center" | "middle" | "bottom" | "disappear" | (string & {});
  focus?: "appear" | "top" | "center" | "middle" | "bottom" | "disappear" | number;
  scroller?: string | Element | Window;
  scrub?: boolean | number;
  markers?: boolean;
  once?: boolean;
  stagger?: number | gsap.StaggerVars;
  resetStagger?: number | gsap.StaggerVars;
}

export interface ProximityTimelineConfig {
  duration?: number;
  resetDuration?: number;
  delay?: number;
  resetDelay?: number;
  ease?: EasePreset;
  resetEase?: EasePreset;
}

export interface ProximityTargetOverride extends ProximityConfig {
  selector: string;
}

export interface ProximityConfig {
  mode?: ProximityMode;
  scroll?: ProximityScrollConfig;
  scrollFocus?: "top" | "center" | "middle" | "bottom" | number; 
  scrollStart?: string; 
  scrollEnd?: string; 
  reach?: number; falloff?: number; duration?: number; resetDuration?: number;
  delay?: number; resetDelay?: number;
  stagger?: number | gsap.StaggerVars;
  resetStagger?: number | gsap.StaggerVars;
  scrub?: boolean | number; resetScrub?: boolean | number;
  start?: Record<string, any>;
  end?: Record<string, any>;
  global?: boolean; explicit?: boolean; 
  preset?: ProximityPreset; 
  nearestPreset?: ProximityPreset; 
  neighborPreset?: ProximityPreset;
  ease?: EasePreset; resetEase?: EasePreset;
  maxTravel?: number;
  splitBy?: "letter" | "word" | "line";
  targets?: ProximityTargetOverride[];
  timeline?: Record<string, ProximityTimelineConfig>;
  scale?:[number, number]; y?:[number, number]; x?:[number, number]; opacity?:[number, number];
  blur?:[number, number]; rotate?:[number, number]; weight?:[number, number];
  skew?:[number, number]; magnetic?:[number, number]; tilt?:[number, number]; tiltCard?:[number, number]; repel?: [number, number];
  cipher?:[number, number]; reveal?:[number, number];
  onCalculate?: (intensity: number, distance: number, dx: number, dy: number, isNearest: boolean) => gsap.TweenVars;
  onReset?: () => gsap.TweenVars;
}

export interface ProximityProps extends ProximityConfig {
  children?: React.ReactNode; selector?: string; config?: ProximityConfig;
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
  glitch: "rough({ template: 'none', strength: 3, points: 50, taper: 'both', randomize: true })", slowmo: "slow(0.7, 0.7, false)",
  spring: "elastic.out(1, 0.75)", heavySpring: "elastic.out(1.2, 0.3)", anticipate: "back.inOut(2)", launch: "slow(0.3, 0.4, false)",
  drift: "rough({ template: none, strength: 0.5, points: 10, taper: none, randomize: true, clamp: true })", whiplash: "back.out(4)"
};

const calculatePresetValues = (
  activePresetString: string, allPresetsString: string, intensity: number, userConfig: Record<string, [number, number] | undefined>, 
  dx: number, dy: number, w: number, h: number, isReset: boolean = false, maxTravel?: number,
  startStyles?: Record<string, any>, endStyles?: Record<string, any>
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

  if (startStyles || endStyles) {
    const custom: gsap.TweenVars = {};
    const keys = new Set([...Object.keys(startStyles || {}), ...Object.keys(endStyles || {})]);
    keys.forEach(k => {
        const sVal = startStyles?.[k];
        const eVal = endStyles?.[k];
        if (sVal !== undefined && eVal !== undefined) {
            custom[k] = gsap.utils.interpolate(sVal, eVal, isReset ? 0 : intensity);
        } else if (isReset && sVal !== undefined) {
            custom[k] = sVal;
        } else if (!isReset && eVal !== undefined) {
            custom[k] = eVal;
        }
    });
    result["customStartEnd"] = custom;
  }

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
  scale, y, x, opacity, blur, rotate, weight, skew, magnetic, tilt, tiltCard, repel, cipher, reveal,
  scroll, timeline, delay, resetDelay, scrub, resetScrub, start, end, stagger, resetStagger, targets,
  ignoreSelectors =[], excludeElements, className = "", style = {}, ...restProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, target: null as EventTarget | null, active: false });

  const activeMode = config.mode ?? mode;
  const activeReach = config.reach ?? reach; 
  const activeFalloff = config.falloff ?? falloff;
  const activeDuration = config.duration ?? duration; 
  const activeResetDuration = config.resetDuration ?? resetDuration;
  const activeDelay = config.delay ?? delay ?? 0;
  const activeResetDelay = config.resetDelay ?? resetDelay ?? 0;
  const activeGlobal = config.global ?? global; 
  const activeExplicit = config.explicit ?? explicit; 
  const activePreset = config.preset ?? preset;
  const activeNearestPreset = config.nearestPreset ?? nearestPreset;
  const activeNeighborPreset = config.neighborPreset ?? neighborPreset;
  const activeMaxTravel = config.maxTravel ?? maxTravel;
  const activeOnCalculate = config.onCalculate ?? onCalculate; 
  const activeOnReset = config.onReset ?? onReset;
  const activeTargets = config.targets ?? targets ?? [];
  
  const activeScrollStart = config.scrollStart ?? scrollStart;
  const activeScrollEnd = config.scrollEnd ?? scrollEnd;
  const activeScrollFocus = config.scrollFocus ?? scrollFocus;

  // RE-ENABLE DEFAULTS: Reveal = 0.1, Hide = 0
  const activeStagger = config.scroll?.stagger ?? config.stagger ?? stagger ?? 0.1;
  const activeResetStagger = config.scroll?.resetStagger ?? config.resetStagger ?? resetStagger ?? 0;
  
  const activeScrub = config.scroll?.scrub ?? config.scrub ?? scrub ?? activeDuration ?? true;
  const activeResetScrub = config.resetScrub ?? resetScrub ?? activeScrub;

  const targetEase = EASE_MAP[config.ease ?? (ease as string)] || config.ease || ease || "power1.out";
  const targetResetEase = EASE_MAP[config.resetEase ?? (resetEase as string)] || config.resetEase || resetEase || "power2.out";

  const timelineConfigStr = JSON.stringify(config.timeline ?? timeline ?? {});
  const scrollConfigStr = JSON.stringify(config.scroll ?? scroll ?? {}); 
  const startStylesStr = JSON.stringify(config.start ?? start ?? {});
  const endStylesStr = JSON.stringify(config.end ?? end ?? {});
  const targetsStr = JSON.stringify(activeTargets);
  
  const mergedBoundsStr = JSON.stringify({
    scale: config.scale ?? scale, y: config.y ?? y, x: config.x ?? x, opacity: config.opacity ?? opacity,
    blur: config.blur ?? blur, rotate: config.rotate ?? rotate, weight: config.weight ?? weight,
    skew: config.skew ?? skew, magnetic: config.magnetic ?? magnetic, tilt: config.tilt ?? tilt, tiltCard: config.tiltCard ?? tiltCard, repel: config.repel ?? repel, cipher: config.cipher ?? cipher, reveal: config.reveal ?? reveal
  });
  
  const mergedBounds = useMemo(() => JSON.parse(mergedBoundsStr),[mergedBoundsStr]);
  const activeTimeline = useMemo(() => JSON.parse(timelineConfigStr),[timelineConfigStr]);
  const activeScrollConfig = useMemo(() => JSON.parse(scrollConfigStr),[scrollConfigStr]);
  const activeStartStyles = useMemo(() => JSON.parse(startStylesStr), [startStylesStr]);
  const activeEndStyles = useMemo(() => JSON.parse(endStylesStr), [endStylesStr]);

  const allPresetsStr = useMemo(() => {
    const basePresets = [activePreset, activeNearestPreset, activeNeighborPreset].filter(Boolean).flatMap(p => p.split('-'));
    const targetPresets = activeTargets.flatMap(t => [t.preset, t.nearestPreset, t.neighborPreset]).filter(Boolean).flatMap(p => (p as string).split('-'));
    return Array.from(new Set([...basePresets, ...targetPresets])).join('-');
  },[activePreset, activeNearestPreset, activeNeighborPreset, targetsStr]);

  const parseScrollPosition = (pos: string, isStart: boolean) => {
    if (pos === "appear") return "top bottom";
    if (pos === "disappear") return "bottom top";
    const mapped: Record<string, string> = { top: "top top", center: "center center", middle: "center center", bottom: "bottom bottom" };
    return mapped[pos] || pos || (isStart ? "top bottom" : "bottom top");
  };

  const getScrollFocusValue = (focus: string | number) => {
    if (typeof focus === 'number') return focus / 100;
    switch (focus) {
        case "appear": return 0;
        case "top": return 0.25;
        case "middle":
        case "center": return 0.5;
        case "bottom": return 0.75;
        case "disappear": return 1;
        default: return 0.5;
    }
  };

  useGSAP(() => {
    const container = containerRef.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let isCancelled = false;
    let items: HTMLElement[] = []; 
    let centers: any[] = [];
    let states: any[] =[];
    let setters: any[] =[];
    let scrollTriggers: any[] =[];
    let targetMap = new Map<HTMLElement, ProximityTargetOverride>();

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
      
      targetMap.clear();
      activeTargets.forEach(targetConfig => {
        const matchingElements = Array.from(container.querySelectorAll(targetConfig.selector));
        matchingElements.forEach(el => targetMap.set(el as HTMLElement, targetConfig));
      });

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
      
      const groupedProps = activeOnReset ? { custom: activeOnReset() } : calculatePresetValues("", allPresetsStr, 0, mergedBounds, 0, 0, 1, 1, true, activeMaxTravel, activeStartStyles, activeEndStyles);
      const flatProps: gsap.TweenVars = { willChange: "transform, filter, opacity, font-variation-settings, clip-path" };
      Object.values(groupedProps).forEach(v => Object.assign(flatProps, v));
      if (Object.keys(flatProps).length > 1 && items.length > 0) gsap.set(items, flatProps);
    };

    const mutationObserver = new MutationObserver((mutations) => {
      const hasNewElements = mutations.some(m => Array.from(m.addedNodes).some(n => n.nodeType === 1) || Array.from(m.removedNodes).some(n => n.nodeType === 1));
      if (hasNewElements) initItems();
    });
    const resizeObserver = new ResizeObserver(() => { updateCenters(); if(activeMode === "scroll") ScrollTrigger.refresh(); });
    mutationObserver.observe(container, { childList: true, subtree: true });
    resizeObserver.observe(container);

    const getStaggerValue = (i: number, target: HTMLElement, list: HTMLElement[], staggerVal: any) => {
      if (!staggerVal) return 0;
      if (typeof staggerVal === 'number') return i * staggerVal;
      return gsap.utils.distribute(staggerVal)(i, target, list);
    };

    if (activeMode === "scroll") {
            const setupScroll = () => {
                if (isCancelled) return;
                initItems();
                scrollTriggers.forEach(t => t.kill());
                scrollTriggers =[];
                
                const isTriggerMode = activeScrollConfig.scrub === false;
                const scrollerTarget = activeScrollConfig.scroller || window;
                const parsedStart = parseScrollPosition(activeScrollConfig.start || activeScrollStart, true);
                const parsedEnd = parseScrollPosition(activeScrollConfig.end || activeScrollEnd, false);
                const focusPoint = getScrollFocusValue(activeScrollConfig.focus || activeScrollFocus);
                const scrubValue = activeScrub; 
                const isOnce = activeScrollConfig.once ?? true;
            
                items.forEach((item, i) => {
                    const localConfig = targetMap.get(item);
                    const localPreset = localConfig?.preset ?? activePreset;
                    const localDuration = localConfig?.duration ?? activeDuration;
                    const localResetDuration = localConfig?.resetDuration ?? activeResetDuration;
                    const localEase = EASE_MAP[localConfig?.ease as string] || localConfig?.ease || targetEase;

                    scrollTriggers.push(ScrollTrigger.create({
                        trigger: item, 
                        scroller: scrollerTarget, 
                        start: parsedStart,      
                        end: parsedEnd,          
                        scrub: isTriggerMode ? false : scrubValue, 
                        once: isOnce,            
                        markers: activeScrollConfig.markers || false,
                        
                        onEnter: () => {
                            if (isTriggerMode) {
                                const gp = calculatePresetValues(localPreset, allPresetsStr, 1, mergedBounds, 0, 0, centers[i]?.w||1, centers[i]?.h||1, false, activeMaxTravel, activeStartStyles, activeEndStyles);
                                Object.keys(gp).forEach(key => {
                                    const tl = activeTimeline?.[key] || {};
                                    gsap.to(item, { 
                                        ...gp[key], 
                                        duration: localDuration, 
                                        delay: (tl.delay ?? activeDelay) + getStaggerValue(i, item, items, activeStagger), 
                                        ease: localEase, 
                                        overwrite: "auto", 
                                        onUpdate: key === "cipher" ? cipherUpdate : undefined 
                                    });
                                });
                            }
                        },
            
                        onLeave: () => {
                            if (isTriggerMode && !isOnce) {
                                const gp = calculatePresetValues(localPreset, allPresetsStr, 0, mergedBounds, 0, 0, centers[i]?.w||1, centers[i]?.h||1, true, activeMaxTravel, activeStartStyles, activeEndStyles);
                                Object.keys(gp).forEach(key => {
                                    const tl = activeTimeline?.[key] || {};
                                    gsap.to(item, { 
                                        ...gp[key], 
                                        duration: localResetDuration, 
                                        delay: (tl.resetDelay ?? activeResetDelay) + getStaggerValue(i, item, items, activeResetStagger), 
                                        ease: targetResetEase, 
                                        overwrite: "auto", 
                                        onUpdate: key === "cipher" ? cipherUpdate : undefined 
                                    });
                                });
                            }
                        },
            
                        onEnterBack: () => {
                            if (isTriggerMode && !isOnce) {
                                const gp = calculatePresetValues(localPreset, allPresetsStr, 1, mergedBounds, 0, 0, centers[i]?.w||1, centers[i]?.h||1, false, activeMaxTravel, activeStartStyles, activeEndStyles);
                                Object.keys(gp).forEach(key => {
                                    const tl = activeTimeline?.[key] || {};
                                    gsap.to(item, { 
                                        ...gp[key], 
                                        duration: localDuration, 
                                        delay: (tl.delay ?? activeDelay) + getStaggerValue(i, item, items, activeStagger), 
                                        ease: localEase, 
                                        overwrite: "auto", 
                                        onUpdate: key === "cipher" ? cipherUpdate : undefined 
                                    });
                                });
                            }
                        },
            
                        onLeaveBack: () => {
                            if (isTriggerMode && !isOnce) {
                                const gp = calculatePresetValues(localPreset, allPresetsStr, 0, mergedBounds, 0, 0, centers[i]?.w||1, centers[i]?.h||1, true, activeMaxTravel, activeStartStyles, activeEndStyles);
                                Object.keys(gp).forEach(key => {
                                    const tl = activeTimeline?.[key] || {};
                                    gsap.to(item, { 
                                        ...gp[key], 
                                        duration: localResetDuration, 
                                        delay: (tl.resetDelay ?? activeResetDelay) + getStaggerValue(i, item, items, activeResetStagger), 
                                        ease: targetResetEase, 
                                        overwrite: "auto", 
                                        onUpdate: key === "cipher" ? cipherUpdate : undefined 
                                    });
                                });
                            }
                        },
            
                        onUpdate: isTriggerMode ? undefined : (self) => {
                            let normalizedDist = 0;
                            if (focusPoint === 0) normalizedDist = 1 - self.progress; 
                            else if (focusPoint === 1) normalizedDist = self.progress; 
                            else normalizedDist = self.progress < focusPoint ? self.progress / focusPoint : (1 - self.progress) / (1 - focusPoint);
                            
                            const intensity = Math.pow(normalizedDist, activeFalloff);
                            const velocity = self.getVelocity(); 
                            const simulatedDy = Math.min(Math.max(velocity * 0.05, -100), 100); 
            
                            const gp = activeOnCalculate 
                            ? { custom: activeOnCalculate(intensity, 0, 0, simulatedDy, true) } 
                            : calculatePresetValues(localPreset, allPresetsStr, intensity, mergedBounds, 0, simulatedDy, centers[i]?.w||1, centers[i]?.h||1, false, activeMaxTravel, activeStartStyles, activeEndStyles);
                            
                            Object.keys(gp).forEach(key => {
                                const tl = activeTimeline?.[key] || {};
                                gsap.to(item, { 
                                    ...gp[key], 
                                    duration: tl.duration || 0.1, 
                                    delay: tl.delay || 0, 
                                    ease: EASE_MAP[tl.ease as string] || tl.ease || "none", 
                                    overwrite: "auto", 
                                    onUpdate: key === "cipher" ? cipherUpdate : undefined 
                                });
                            });
                            setters[i].intensity(intensity.toFixed(3));
                        }
                    }));
                });
            };
    
            if (document.fonts) document.fonts.ready.then(setupScroll); else setupScroll();
        } else {
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
            const localConfig = targetMap.get(item);
            
            if (d > maxDistance) {
              if (!states[i].isOutside) {
                const gr = activeOnReset ? { custom: activeOnReset() } : calculatePresetValues("", allPresetsStr, 0, mergedBounds, 0, 0, centers[i].w, centers[i].h, true, activeMaxTravel, activeStartStyles, activeEndStyles);
                gsap.to(item, { "--prox-intensity": 0, duration: activeResetDuration, delay: activeResetDelay, ease: targetResetEase, overwrite: "auto" });
                Object.keys(gr).forEach(k => {
                  const tl = activeTimeline?.[k] || {};
                  gsap.to(item, { ...gr[k], duration: tl.resetDuration ?? activeResetDuration, delay: tl.resetDelay ?? activeResetDelay, ease: EASE_MAP[tl.resetEase as string] || tl.resetEase || targetResetEase, overwrite: "auto", onUpdate: k === "cipher" ? cipherUpdate : undefined });
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
              
              let cp = localConfig?.preset ?? activePreset ?? "";
              const nearestP = localConfig?.nearestPreset ?? activeNearestPreset;
              const neighborP = localConfig?.neighborPreset ?? activeNeighborPreset;

              if (isNearest && nearestP) cp = cp ? `${cp}-${nearestP}` : nearestP; 
              else if (!isNearest && neighborP) cp = cp ? `${cp}-${neighborP}` : neighborP;
              
              const gp = activeOnCalculate ? { custom: activeOnCalculate(intensity, d, dx, dy, isNearest) } : calculatePresetValues(cp as string, allPresetsStr, intensity, mergedBounds, dx, dy, centers[i].w, centers[i].h, false, activeMaxTravel, activeStartStyles, activeEndStyles);
              Object.keys(gp).forEach(k => {
                  const tl = activeTimeline?.[k] || {};
                  gsap.to(item, { ...gp[k], duration: tl.duration ?? (localConfig?.duration ?? activeDuration), delay: tl.delay ?? activeDelay, ease: EASE_MAP[tl.ease as string] || tl.ease || (localConfig?.ease ?? targetEase), overwrite: "auto", onUpdate: k === "cipher" ? cipherUpdate : undefined });
              });
              states[i].lastIntensity = intensity; states[i].lastDx = dx; states[i].lastDy = dy; states[i].isOutside = false;
            } else if (isCipherActive && allPresetsStr.includes('cipher')) {
              cipherUpdate.call({ targets: () =>[item] });
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
            const gr = activeOnReset ? { custom: activeOnReset() } : calculatePresetValues("", allPresetsStr, 0, mergedBounds, 0, 0, centers[i]?.w||1, centers[i]?.h||1, true, activeMaxTravel, activeStartStyles, activeEndStyles);
            gsap.to(item, { "--prox-intensity": 0, duration: activeResetDuration, delay: activeResetDelay, ease: targetResetEase, overwrite: "auto" });
            Object.keys(gr).forEach(k => gsap.to(item, { ...gr[k], duration: activeResetDuration, delay: activeResetDelay, ease: targetResetEase, overwrite: "auto", onUpdate: k === "cipher" ? cipherUpdate : undefined }));
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
        isCancelled = true;
        mutationObserver.disconnect(); resizeObserver.disconnect();
        scrollTriggers.forEach(t => t.kill());
        gsap.killTweensOf(items);
    };
  }, { 
    dependencies:[
      selector, excludeElements, activePreset, activeNearestPreset, activeNeighborPreset, activeReach, activeFalloff, activeDuration, activeMaxTravel,
      activeResetDuration, activeDelay, activeResetDelay, activeScrub, activeResetScrub, activeGlobal, activeExplicit, mergedBoundsStr, startStylesStr, endStylesStr, targetsStr, allPresetsStr, timelineConfigStr, scrollConfigStr, ignoreSelectors.join(','), targetEase, targetResetEase, activeMode, 
      activeScrollFocus, activeScrollStart, activeScrollEnd, JSON.stringify(activeStagger), JSON.stringify(activeResetStagger)
    ],
    scope: containerRef
  });

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', touchAction: 'none', ...style }} {...restProps}>
      {children}
    </div>
  );
};