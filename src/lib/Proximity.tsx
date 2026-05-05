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
  | "scale" | "flexScale" | "y" | "x" | "opacity" | "blur" | "rotate" | "weight" | "skew" | "magnetic" | "tilt" | "tiltCard" | "repel" | "cipher" | "reveal"
  | (string & {});

export type ProximityMode = "pointer" | "scroll";

export type AxisLock = "x" | "y" | "both" | "none";

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
  /** Switches engine between tracking cursor vs tracking view scroll. */
  mode?: ProximityMode;
  /** Custom scroll logic for scroll-driven animations */
  scroll?: ProximityScrollConfig;
  scrollFocus?: "top" | "center" | "middle" | "bottom" | number; 
  scrollStart?: string; 
  scrollEnd?: string; 
  /** Euclidean radius of the mouse tracking influence. Default is 2. */
  reach?: number; 
  /** Power curve of the proximity ease. Default is 2.4. */
  falloff?: number; 
  /** Physics entry mapping duration. Default is 0.2. */
  duration?: number; 
  /** Physics reset mapping duration when pointer leaves bounds. Default is 0.4. */
  resetDuration?: number;
  delay?: number; 
  resetDelay?: number;
  stagger?: number | gsap.StaggerVars;
  resetStagger?: number | gsap.StaggerVars;
  scrub?: boolean | number; 
  resetScrub?: boolean | number;
  start?: gsap.TweenVars;
  end?: gsap.TweenVars;
  /** Track cursor constantly throughout document, not just over container. */
  global?: boolean; 
  /** Demands strict interaction (bounding box true hover) to activate element. */
  explicit?: boolean; 
  /** Chain multiple string presets by dash (e.g., 'blur-scale-rotate') */
  preset?: ProximityPreset; 
  /** Separate physics preset for the item closest to cursor */
  nearestPreset?: ProximityPreset; 
  /** Separate physics preset for items neighboring the targeted item */
  neighborPreset?: ProximityPreset;
  /** Motion easing type. Auto-completes to standard motion types, but accepts manual GSAP ease strings. */
  ease?: EasePreset; 
  resetEase?: EasePreset;
  /** Clamp physical bounding movement. Accepts [x, y], {x, y}, or global number limit. */
  maxTravel?: number | [number, number] | { x: number, y: number };
  /** Locks spatial physics (repel, magnetic, tilt) to a specific axis. "x" allows horizontal shifts only. */
  lockAxis?: AxisLock;
  splitBy?: "letter" | "word" | "line";
  targets?: ProximityTargetOverride[];
  timeline?: Record<string, ProximityTimelineConfig>;
  scale?: [number, number]; y?:[number, number]; x?:[number, number]; opacity?:[number, number]; flexScale?:[number, number];
  blur?:[number, number]; rotate?:[number, number]; weight?: [number, number];
  skew?:[number, number]; magnetic?:[number, number]; tilt?: [number, number]; tiltCard?:[number, number]; repel?: [number, number];
  cipher?: [number, number]; reveal?: [number, number];
  /** Escape hatch function to write your own return-based custom physical mapping variables per frame */
  onCalculate?: (intensity: number, distance: number, dx: number, dy: number, isNearest: boolean) => gsap.TweenVars;
  onReset?: () => gsap.TweenVars;
  /** Disable animations on mobile devices. True disables all, string/array disables specific presets. */
  disableOnMobile?: boolean | string | string[];
  /** In scroll mode, wait for the previous element's animation to finish before starting the next. */
  waitForAnimationEnd?: boolean;
  /** In scroll mode, wait for enter animation so leave animation could work*/
  waitForEnterAnimationEnd?: boolean;
  /** In scroll mode, wait for leave animation so enter animation could work*/
  waitForLeaveAnimationEnd?: boolean;
}

export interface ProximityProps extends ProximityConfig {
  children?: React.ReactNode; 
  selector?: string; 
  config?: ProximityConfig;
  ignoreSelectors?: string[]; 
  excludeElements?: string; 
  className?: string; 
  style?: CSSProperties;
  /** Optional scrolling container ref to explicitly map context against (fixes nested modals/sidebars) */
  scrollerRef?: React.RefObject<HTMLElement | null>;
}

// Internal TS strict types
interface ProxHTMLElement extends HTMLElement {
  proxCipher?: number;
  _lastCipherUpdate?: number;
  _quickTos?: Record<string, gsap.QuickToFunc>;
  _isProxVisible?: boolean;
}

interface ItemCenter {
  left: number; right: number; top: number; bottom: number;
  x: number; y: number; w: number; h: number;
  ml: number; mr: number; mt: number; mb: number;
}

interface ItemState {
  isOutside: boolean; lastIntensity: number; lastDx: number; lastDy: number;
}

// Safely typed Setters
interface ItemSetters {
  intensity: (val: number | string) => void;
  dx: (val: number | string) => void;
  dy: (val: number | string) => void;
}

interface ContainerBounds {
  left: number; right: number; top: number; bottom: number;
}

const PRESET_DEFAULTS: Record<string, [number, number]> = {
  scale:[1, 1.5], flexScale:[1, 1.5], y:[0, -30], x:[0, 30], opacity:[0.2, 1], blur:[8, 0], rotate:[0, 90], weight:[100, 900],
  skew:[0, 20], magnetic:[0, 0.1], tilt:[0, 30], tiltCard:[0, 15], repel:[0, 0.4], cipher:[0, 1], reveal:[110, 0]
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

const OPTIMIZED_WILL_CHANGE = "transform, filter, opacity, font-variation-settings, clip-path";

function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];
        if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
}

function useDeepMemo<T>(value: T): T {
    const ref = useRef<T>(value);
    if (!deepEqual(ref.current, value)) {
        ref.current = value;
    }
    return ref.current;
}

// 4. PRE-ALLOCATED REUSABLE RESULT OBJECT TO KILL GARBAGE COLLECTION AT 120FPS
const REUSABLE_RESULT: Record<string, gsap.TweenVars> = {};

const calculatePresetValues = (
  activePresetString: string, allPresetsString: string, intensity: number, userConfig: Record<string,[number, number] | undefined>, 
  dx: number, dy: number, center: ItemCenter | undefined | null, isReset: boolean = false, maxTravel?: number | [number, number] | { x: number, y: number },
  lockAxis?: AxisLock, startStyles?: gsap.TweenVars, endStyles?: gsap.TweenVars, skipAll: boolean = false, disabledPresets: Set<string> = new Set()
): Record<string, gsap.TweenVars> => {
  if (skipAll) return {};

  const activeProps = new Set(activePresetString.split("-").filter(Boolean));
  const allPropsArray = allPresetsString.split("-").filter(Boolean);

  const lockX = lockAxis === "y"; // If locked to Y, nullify X physics
  const lockY = lockAxis === "x"; // If locked to X, nullify Y physics

  // Safely extract center data or default to 0/1
  const w = center?.w || 1;
  const h = center?.h || 1;
  const ml = center?.ml || 0;
  const mr = center?.mr || 0;
  const mt = center?.mt || 0;
  const mb = center?.mb || 0;

  const clampTravel = (val: number, axis: 'x' | 'y') => {
    if (maxTravel == null) return val; 
    let limit = Infinity;
    if (typeof maxTravel === 'number') limit = maxTravel;
    else if (Array.isArray(maxTravel)) limit = axis === 'x' ? maxTravel[0] : maxTravel[1];
    else if (typeof maxTravel === 'object') limit = axis === 'x' ? (maxTravel as { x: number, y: number }).x : (maxTravel as { x: number, y: number }).y;
    
    if (limit == null || limit === Infinity) return val;
    return Math.max(-limit, Math.min(val, limit));
  };

  // Recycle main root level memory object
  for (const k in REUSABLE_RESULT) delete REUSABLE_RESULT[k];

  for (let i = 0; i < allPropsArray.length; i++) {
    const prop = allPropsArray[i];
    if (disabledPresets.has(prop)) continue;

    const bounds = userConfig[prop] || PRESET_DEFAULTS[prop];
    if (!bounds) continue;
    
    // Recycle nested level memory object without reallocating
    if (!REUSABLE_RESULT[prop]) REUSABLE_RESULT[prop] = {};
    else for (const k in REUSABLE_RESULT[prop]) delete REUSABLE_RESULT[prop][k];
    
    const isActive = activeProps.has(prop);
    const useBase = isReset || !isActive;
    const currentIntensity = useBase ? 0 : intensity;
    const[base, max] = bounds;
    const currentValue = base + (max - base) * currentIntensity;
    
    const res = REUSABLE_RESULT[prop];
    
    if (prop === "blur") res.filter = `blur(${currentValue}px)`;
    else if (prop === "weight") {
      const weightVal = Math.round(currentValue);
      res.fontWeight = weightVal; 
      res.fontVariationSettings = `'wght' ${weightVal}`;
    } 
    else if (prop === "rotate") res.rotation = currentValue;
    else if (prop === "skew") res.skewX = currentValue;
    else if (prop === "cipher") res.proxCipher = currentValue;
    else if (prop === "reveal") {
        res.y = `${currentValue}%`;
        res.clipPath = `inset(0% 0% ${currentValue}% 0%)`;
    }
    else if (prop === "magnetic") {
        const pullX = lockX ? 0 : dx * currentIntensity * max;
        const pullY = lockY ? 0 : dy * currentIntensity * max;
        res.x = useBase ? 0 : clampTravel(pullX, 'x');
        res.y = useBase ? 0 : clampTravel(pullY, 'y');
        res.rotation = useBase ? 0 : pullX * 0.05;
    }
    else if (prop === "repel") {
        const distanceOffset = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const safeDx = dx === 0 ? 0.1 : dx; 
        const safeDy = dy === 0 ? 0.1 : dy;
        const pushFactor = (max * 100 * currentIntensity); 
        
        res.x = useBase || lockX ? 0 : clampTravel(-(safeDx / distanceOffset) * pushFactor, 'x');
        res.y = useBase || lockY ? 0 : clampTravel(-(safeDy / distanceOffset) * pushFactor, 'y');
    }
    else if (prop === "tilt") {
        res.rotationX = useBase || lockY ? 0 : -dy * currentIntensity * (max / 10);
        res.rotationY = useBase || lockX ? 0 : dx * currentIntensity * (max / 10);
        res.transformPerspective = 1000;
    }
    else if (prop === "tiltCard") {
        res.rotationX = useBase || lockY ? 0 : (dy / (h / 2)) * -max * currentIntensity;
        res.rotationY = useBase || lockX ? 0 : (dx / (w / 2)) * max * currentIntensity;
        res.transformPerspective = 1000;
    }
    else if (prop === "scale") {
        res.scaleX = currentValue;
        res.scaleY = currentValue;
    }
    else if (prop === "flexScale") {
        res.scaleX = currentValue;
        res.scaleY = currentValue;
        
        const extraWidth = (w * (currentValue - 1)) / 2;
        const extraHeight = (h * (currentValue - 1)) / 2;
        
        res.marginLeft = ml + extraWidth;
        res.marginRight = mr + extraWidth;
        res.marginTop = mt + extraHeight;
        res.marginBottom = mb + extraHeight;
    }
    else res[prop] = currentValue; 
  }

  if (startStyles || endStyles) {
    if (!REUSABLE_RESULT["customStartEnd"]) REUSABLE_RESULT["customStartEnd"] = {};
    else for (const k in REUSABLE_RESULT["customStartEnd"]) delete REUSABLE_RESULT["customStartEnd"][k];

    const custom = REUSABLE_RESULT["customStartEnd"];
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
  }

  return REUSABLE_RESULT;
};

function cipherUpdate(this: gsap.core.Tween) {
  const item = this.targets()[0] as ProxHTMLElement;
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
  duration = 0.2, resetDuration = 0.4, global = false, explicit = false, mode = "pointer", scrollerRef,
  scrollFocus = "center", scrollStart = "top bottom", scrollEnd = "bottom top", lockAxis,
  maxTravel, onCalculate, onReset, ease, resetEase, disableOnMobile, waitForAnimationEnd,
  waitForEnterAnimationEnd, waitForLeaveAnimationEnd, scale, flexScale, y, x, opacity, blur,
  rotate, weight, skew, magnetic, tilt, tiltCard, repel, cipher, reveal,
  scroll, timeline, delay, resetDelay, scrub, resetScrub, start, end, stagger, resetStagger, targets,
  ignoreSelectors =[], excludeElements, className = "", style = {}, ...restProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, target: null as EventTarget | null, active: false });

  // 3. PERSISTENT CLOSURE SAFE REFS FOR TICKER PERFORMANCE
  const itemsRef = useRef<ProxHTMLElement[]>([]);
  const centersRef = useRef<ItemCenter[]>([]);
  const statesRef = useRef<ItemState[]>([]);
  const settersRef = useRef<ItemSetters[]>([]);
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);
  const targetMapRef = useRef<Map<ProxHTMLElement, ProximityTargetOverride>>(new Map());
  const containerBoundsRef = useRef<ContainerBounds | null>(null);
  const resetPropsRef = useRef<Record<string, gsap.TweenVars>[]>([]);

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
  const activeLockAxis = config.lockAxis ?? lockAxis;
  const activeOnCalculate = config.onCalculate ?? onCalculate; 
  const activeOnReset = config.onReset ?? onReset;
  const activeTargets = config.targets ?? targets ??[];
  
  const activeScrollStart = config.scrollStart ?? scrollStart;
  const activeScrollEnd = config.scrollEnd ?? scrollEnd;
  const activeScrollFocus = config.scrollFocus ?? scrollFocus;

  const activeStagger = config.scroll?.stagger ?? config.stagger ?? stagger ?? 0.1;
  const activeResetStagger = config.scroll?.resetStagger ?? config.resetStagger ?? resetStagger ?? 0;
  
  const activeScrub = config.scroll?.scrub ?? config.scrub ?? scrub ?? activeDuration ?? true;
  const activeResetScrub = config.resetScrub ?? resetScrub ?? activeScrub;

  const activeDisableOnMobile = config.disableOnMobile ?? disableOnMobile;
  const activeWaitForAnimationEnd = config.waitForAnimationEnd ?? waitForAnimationEnd;
  const activeWaitForEnterAnimationEnd = config.waitForEnterAnimationEnd ?? waitForEnterAnimationEnd;
  const activeWaitForLeaveAnimationEnd = config.waitForLeaveAnimationEnd ?? waitForLeaveAnimationEnd;
  const targetEase = EASE_MAP[config.ease ?? (ease as string)] || config.ease || ease || "power1.out";
  const targetResetEase = EASE_MAP[config.resetEase ?? (resetEase as string)] || config.resetEase || resetEase || "power2.out";

  // 2. STOP EXPENSIVE JSON.STRINGIFY RENDER PENALTIES
  const mergedBounds = useDeepMemo({
    scale: config.scale ?? scale, flexScale: config.flexScale ?? flexScale, y: config.y ?? y, x: config.x ?? x, opacity: config.opacity ?? opacity,
    blur: config.blur ?? blur, rotate: config.rotate ?? rotate, weight: config.weight ?? weight,
    skew: config.skew ?? skew, magnetic: config.magnetic ?? magnetic, tilt: config.tilt ?? tilt, tiltCard: config.tiltCard ?? tiltCard, repel: config.repel ?? repel, cipher: config.cipher ?? cipher, reveal: config.reveal ?? reveal
  });

  const activeTimeline = useDeepMemo(config.timeline ?? timeline ?? {});
  const activeScrollConfig = useDeepMemo(config.scroll ?? scroll ?? {});
  const activeStartStyles = useDeepMemo(config.start ?? start ?? {});
  const activeEndStyles = useDeepMemo(config.end ?? end ?? {});
  const parsedMaxTravel = useDeepMemo(activeMaxTravel);
  const parsedTargets = useDeepMemo(activeTargets);
  const memoizedStagger = useDeepMemo(activeStagger);
  const memoizedResetStagger = useDeepMemo(activeResetStagger);
  const memoizedDisableOnMobile = useDeepMemo(activeDisableOnMobile);

  const allPresetsStr = useMemo(() => {
    const basePresets =[activePreset, activeNearestPreset, activeNeighborPreset].filter(Boolean).flatMap(p => p.split('-'));
    const targetPresets = parsedTargets.flatMap(t =>[t.preset, t.nearestPreset, t.neighborPreset]).filter(Boolean).flatMap(p => (p as string).split('-'));
    return Array.from(new Set([...basePresets, ...targetPresets])).join('-');
  },[activePreset, activeNearestPreset, activeNeighborPreset, parsedTargets]);

  // 6. PRE-COMPUTE ACTIVE KEYS (AVOIDS Object.keys() IN THE PER-FRAME HOT PATH)
  const activePresetKeys = useMemo(() => {
    const keys = new Set<string>();
    allPresetsStr.split("-").forEach(k => { if (k) keys.add(k); });
    if (Object.keys(activeStartStyles).length > 0 || Object.keys(activeEndStyles).length > 0) keys.add("customStartEnd");
    if (activeOnCalculate) keys.add("custom");
    return Array.from(keys);
  },[allPresetsStr, activeStartStyles, activeEndStyles, activeOnCalculate]);

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
    if (!container) return;

    // LIVE ACCESSIBILITY HOT-SWAPPING
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;

    const isMobile = typeof window !== "undefined" && (window.matchMedia("(any-pointer: coarse)").matches || window.innerWidth < 768);
    let skipAllAnimations = isReducedMotion;
    let disabledPresets = new Set<string>();

    if (isMobile && memoizedDisableOnMobile) {
        if (memoizedDisableOnMobile === true) {
            skipAllAnimations = true;
        } else if (typeof memoizedDisableOnMobile === 'string') {
            memoizedDisableOnMobile.split('-').forEach(p => disabledPresets.add(p));
        } else if (Array.isArray(memoizedDisableOnMobile)) {
            memoizedDisableOnMobile.forEach(p => disabledPresets.add(p));
        }
    }

    let isCancelled = false;
    let io: IntersectionObserver | null = null;

    const updateCenters = () => {
          if (!container) return;
          const cRect = container.getBoundingClientRect();
          const scrollEl = scrollerRef?.current;
          const sx = scrollEl ? scrollEl.scrollLeft : window.scrollX;
          const sy = scrollEl ? scrollEl.scrollTop : window.scrollY;
    
          containerBoundsRef.current = {
              left: cRect.left + sx, right: cRect.right + sx, top: cRect.top + sy, bottom: cRect.bottom + sy
          };
    
          // 1. FIX LAYOUT THRASHING - BATCH ALL WRITES
          const inlineStates = itemsRef.current.map((item) => {
            const state = {
                ml: item.style.marginLeft, mr: item.style.marginRight,
                mt: item.style.marginTop, mb: item.style.marginBottom,
                tf: item.style.transform
            };
            item.style.marginLeft = ""; item.style.marginRight = "";
            item.style.marginTop = ""; item.style.marginBottom = "";
            item.style.transform = "";
            return state;
          });

          // 1. FIX LAYOUT THRASHING - BATCH ALL READS
          const measurements = itemsRef.current.map((item) => {
            const rect = item.getBoundingClientRect();
            const comp = window.getComputedStyle(item);
            return {
              rect,
              ml: parseFloat(comp.marginLeft) || 0,
              mr: parseFloat(comp.marginRight) || 0,
              mt: parseFloat(comp.marginTop) || 0,
              mb: parseFloat(comp.marginBottom) || 0,
            };
          });

          // 1. FIX LAYOUT THRASHING - RESTORE INLINE STYLES AND BUILD REF ARRAY
          centersRef.current = itemsRef.current.map((item, i) => {
            const inline = inlineStates[i];
            item.style.marginLeft = inline.ml; item.style.marginRight = inline.mr;
            item.style.marginTop = inline.mt; item.style.marginBottom = inline.mb;
            item.style.transform = inline.tf;

            const { rect, ml, mr, mt, mb } = measurements[i];
            return {
              left: rect.left + sx, right: rect.right + sx, top: rect.top + sy, bottom: rect.bottom + sy,
              x: rect.left + sx + rect.width / 2, y: rect.top + sy + rect.height / 2, 
              w: rect.width, h: rect.height,
              ml, mr, mt, mb
            };
          });
        };

    const initItems = () => {
      if (itemsRef.current.length > 0) gsap.killTweensOf(itemsRef.current);
      const targetSelector = excludeElements && excludeElements.trim() !== "" ? selector.split(',').map(s => `${s.trim()}:not(${excludeElements})`).join(', ') : selector;
      itemsRef.current = Array.from(container.querySelectorAll(targetSelector)) as ProxHTMLElement[];
      
      targetMapRef.current.clear();
      parsedTargets.forEach(targetConfig => {
        const matchingElements = Array.from(container.querySelectorAll(targetConfig.selector));
        matchingElements.forEach(el => targetMapRef.current.set(el as ProxHTMLElement, targetConfig));
      });

      itemsRef.current.forEach(item => {
          if (item.dataset.proxOriginal === undefined) item.dataset.proxOriginal = item.textContent || "";
          if (item.proxCipher === undefined) item.proxCipher = 0;
          if (item._quickTos) item._quickTos = {}; 
      });
      statesRef.current = itemsRef.current.map(() => ({ isOutside: true, lastIntensity: 0, lastDx: 0, lastDy: 0 }));
      settersRef.current = itemsRef.current.map(item => ({
        intensity: gsap.quickSetter(item, "--prox-intensity") as (val: number | string) => void,
        dx: gsap.quickSetter(item, "--prox-dx", "px") as (val: number | string) => void,
        dy: gsap.quickSetter(item, "--prox-dy", "px") as (val: number | string) => void
      }));
      
      updateCenters();

      // OFF-SCREEN CULLING SETUP
      if (io) io.disconnect();
      io = new IntersectionObserver((entries) => {
          entries.forEach(e => {
              (e.target as ProxHTMLElement)._isProxVisible = e.isIntersecting;
          });
      }, { rootMargin: `${Math.ceil(activeReach * 200 + 100)}px` });

      itemsRef.current.forEach(item => {
          if (item._isProxVisible === undefined) item._isProxVisible = true;
          io!.observe(item);
      });
      
      // 7. PRE-COMPUTE BASE RESET PROPS (AVOIDS RUNNING ALGORITHM ON LEAVE/RESET)
      resetPropsRef.current = itemsRef.current.map((_, i) => {
          if (skipAllAnimations) return {};
          if (activeOnReset) return { custom: activeOnReset() };
          if (activeOnCalculate) return { custom: activeOnCalculate(0, Infinity, 0, 0, false) };
          
          const res = calculatePresetValues("", allPresetsStr, 0, mergedBounds, 0, 0, centersRef.current[i], true, parsedMaxTravel, activeLockAxis, activeStartStyles, activeEndStyles, skipAllAnimations, disabledPresets);
          const clone: Record<string, gsap.TweenVars> = {};
          for (const k in res) clone[k] = { ...res[k] };
          return clone;
      });

      const flatProps: gsap.TweenVars = skipAllAnimations ? {} : { willChange: "auto" };
      if (resetPropsRef.current.length > 0) {
          Object.values(resetPropsRef.current[0]).forEach(v => Object.assign(flatProps, v));
      }
      if (Object.keys(flatProps).length > 0 && itemsRef.current.length > 0) gsap.set(itemsRef.current, flatProps);
    };

    // Live Event Listener for Motion Settings
    const handleMotionChange = (e: MediaQueryListEvent) => {
        isReducedMotion = e.matches;
        skipAllAnimations = isReducedMotion || (isMobile && memoizedDisableOnMobile === true);
        
        if (skipAllAnimations) {
            itemsRef.current.forEach(item => {
                gsap.killTweensOf(item);
                gsap.set(item, { clearProps: "transform,filter,opacity,fontVariationSettings,clipPath,willChange" });
            });
            statesRef.current.forEach(s => { s.isOutside = true; s.lastIntensity = 0; });
        } else {
            initItems();
        }
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    const mutationObserver = new MutationObserver((mutations) => {
      const hasNewElements = mutations.some(m => Array.from(m.addedNodes).some(n => n.nodeType === 1) || Array.from(m.removedNodes).some(n => n.nodeType === 1));
      if (hasNewElements) initItems();
    });
    
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => { 
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateCenters(); 
        }, 150); 
    });
    
    mutationObserver.observe(container, { childList: true, subtree: true });
    resizeObserver.observe(container);

    const getStaggerValue = (i: number, target: HTMLElement, list: HTMLElement[], staggerVal: number | gsap.StaggerVars) => {
      if (!staggerVal) return 0;
      if (typeof staggerVal === 'number') return i * staggerVal;
      return gsap.utils.distribute(staggerVal)(i, target, list);
    };

    if (activeMode === "scroll") {
        const setupScroll = () => {
            if (isCancelled) return;
            initItems();
            scrollTriggersRef.current.forEach(t => t.kill());
            scrollTriggersRef.current =[];
            
            const isTriggerMode = activeScrollConfig.scrub === false;
            const scrollerTarget = scrollerRef?.current || activeScrollConfig.scroller || window;
            const parsedStart = parseScrollPosition(activeScrollConfig.start || activeScrollStart, true);
            const parsedEnd = parseScrollPosition(activeScrollConfig.end || activeScrollEnd, false);
            const focusPoint = getScrollFocusValue(activeScrollConfig.focus || activeScrollFocus);
            const scrubValue = activeScrub; 
            const isOnce = activeScrollConfig.once ?? true;
            
            const animatingStates = itemsRef.current.map(() => ({
              isEntering: false,
              isLeaving: false,
              enterEndTime: 0,
              leaveEndTime: 0,
              queuedCall: null as gsap.core.Tween | null,
            }));

            itemsRef.current.forEach((item, i) => {
                const localConfig = targetMapRef.current.get(item);
                const localPreset = localConfig?.preset ?? activePreset;
                const localDuration = localConfig?.duration ?? activeDuration;
                const localResetDuration = localConfig?.resetDuration ?? activeResetDuration;
                const localEase = EASE_MAP[localConfig?.ease as string] || localConfig?.ease || targetEase;

                scrollTriggersRef.current.push(ScrollTrigger.create({
                    trigger: item, 
                    scroller: scrollerTarget, 
                    start: parsedStart,      
                    end: parsedEnd,          
                    scrub: isTriggerMode ? false : scrubValue, 
                    once: isOnce,            
                    markers: activeScrollConfig.markers || false,
                    
                    onEnter: () => {
                      const executeEnter = () => {
                          item.dataset.proxScrollActive = "true";
                          if (!skipAllAnimations) gsap.set(item, { willChange: OPTIMIZED_WILL_CHANGE });
                        
                          if (isTriggerMode) {
                              const gp = skipAllAnimations ? {} : (activeOnCalculate
                                ? { custom: activeOnCalculate(1, 0, 0, 0, true) }
                                : calculatePresetValues(localPreset, allPresetsStr, 1, mergedBounds, 0, 0, centersRef.current[i], false, parsedMaxTravel, activeLockAxis, activeStartStyles, activeEndStyles, skipAllAnimations, disabledPresets));
                          
                              let maxDuration = 0;
                          
                              const keysToLoop = activeOnCalculate ? ["custom"] : activePresetKeys;
                              for (let kIdx = 0; kIdx < keysToLoop.length; kIdx++) {
                                  const key = keysToLoop[kIdx];
                                  const vars = gp[key];
                                  if (!vars) continue;

                                  const tl = activeTimeline?.[key] || {};
                                  const stVal = activeWaitForAnimationEnd ? (localDuration + (tl.delay ?? activeDelay)) : memoizedStagger;
                                  const totalDelay = (tl.delay ?? activeDelay) + getStaggerValue(i, item, itemsRef.current, stVal);
                                  maxDuration = Math.max(maxDuration, localDuration + totalDelay);
                          
                                  gsap.to(item, {
                                      ...vars,
                                      duration: localDuration,
                                      delay: totalDelay,
                                      ease: localEase,
                                      overwrite: "auto",
                                      onUpdate: key === "cipher" ? cipherUpdate : undefined
                                  });
                              }
                          
                              if (activeWaitForEnterAnimationEnd) {
                                  animatingStates[i].isEntering = true;
                                  animatingStates[i].enterEndTime = Date.now() + (maxDuration * 1000);
                                  gsap.delayedCall(maxDuration, () => {
                                      animatingStates[i].isEntering = false;
                                  });
                              }
                          }
                      };

                      if (animatingStates[i].queuedCall) animatingStates[i].queuedCall?.kill();

                      if (activeWaitForLeaveAnimationEnd && animatingStates[i].isLeaving) {
                          const timeLeft = Math.max(0, (animatingStates[i].leaveEndTime - Date.now()) / 1000);
                          if (timeLeft > 0) {
                              animatingStates[i].queuedCall = gsap.delayedCall(timeLeft, executeEnter);
                              return;
                          }
                      }
                      executeEnter();
                    },
                    
                    onLeave: () => {
                      const executeLeave = () => {
                          item.dataset.proxScrollActive = "false";
                          if (isTriggerMode && !isOnce) {
                              const gr = resetPropsRef.current[i] || {};
                              let maxWait = localResetDuration + activeResetDelay;
                          
                              const keysToLoop = activeOnCalculate ? ["custom"] : activePresetKeys;
                              for (let kIdx = 0; kIdx < keysToLoop.length; kIdx++) {
                                  const key = keysToLoop[kIdx];
                                  const vars = gr[key];
                                  if (!vars) continue;

                                  const tl = activeTimeline?.[key] || {};
                                  const rStVal = activeWaitForAnimationEnd ? (localResetDuration + (tl.resetDelay ?? activeResetDelay)) : memoizedResetStagger;
                                  const actDelay = (tl.resetDelay ?? activeResetDelay) + getStaggerValue(i, item, itemsRef.current, rStVal);
                                  maxWait = Math.max(maxWait, localResetDuration + actDelay);
                          
                                  gsap.to(item, {
                                      ...vars,
                                      duration: localResetDuration,
                                      delay: actDelay,
                                      ease: targetResetEase,
                                      overwrite: "auto",
                                      onUpdate: key === "cipher" ? cipherUpdate : undefined
                                  });
                              }
                          
                              if (activeWaitForLeaveAnimationEnd) {
                                  animatingStates[i].isLeaving = true;
                                  animatingStates[i].leaveEndTime = Date.now() + (maxWait * 1000);
                                  gsap.delayedCall(maxWait, () => {
                                      animatingStates[i].isLeaving = false;
                                  });
                              }
                          
                              if (!skipAllAnimations) {
                                  gsap.delayedCall(maxWait, () => {
                                      if (item.dataset.proxScrollActive !== "true") gsap.set(item, { willChange: "auto" });
                                  });
                              }
                          } else if (!isTriggerMode && !skipAllAnimations) {
                              gsap.set(item, { willChange: "auto" });
                          }
                      };

                      if (animatingStates[i].queuedCall) animatingStates[i].queuedCall?.kill();

                      if (activeWaitForEnterAnimationEnd && animatingStates[i].isEntering) {
                          const timeLeft = Math.max(0, (animatingStates[i].enterEndTime - Date.now()) / 1000);
                          if (timeLeft > 0) {
                              animatingStates[i].queuedCall = gsap.delayedCall(timeLeft, executeLeave);
                              return;
                          }
                      }
                      executeLeave();
                    },
        
                    onEnterBack: () => {
                      const executeEnterBack = () => {
                          item.dataset.proxScrollActive = "true";
                          if (!skipAllAnimations) gsap.set(item, { willChange: OPTIMIZED_WILL_CHANGE });
                          
                          if (isTriggerMode && !isOnce) {
                              const gp = skipAllAnimations ? {} : (activeOnCalculate 
                                  ? { custom: activeOnCalculate(1, 0, 0, 0, true) }
                                  : calculatePresetValues(localPreset, allPresetsStr, 1, mergedBounds, 0, 0, centersRef.current[i], false, parsedMaxTravel, activeLockAxis, activeStartStyles, activeEndStyles, skipAllAnimations, disabledPresets));
                                  
                              let maxDuration = 0;

                              const keysToLoop = activeOnCalculate ? ["custom"] : activePresetKeys;
                              for (let kIdx = 0; kIdx < keysToLoop.length; kIdx++) {
                                  const key = keysToLoop[kIdx];
                                  const vars = gp[key];
                                  if (!vars) continue;
  
                                  const tl = activeTimeline?.[key] || {};
                                  const stVal = activeWaitForAnimationEnd ? (localDuration + (tl.delay ?? activeDelay)) : memoizedStagger;
                                  const totalDelay = (tl.delay ?? activeDelay) + getStaggerValue(i, item, itemsRef.current, stVal);
                                  maxDuration = Math.max(maxDuration, localDuration + totalDelay);

                                  gsap.to(item, { 
                                      ...vars, 
                                      duration: localDuration, 
                                      delay: totalDelay, 
                                      ease: localEase, 
                                      overwrite: "auto", 
                                      onUpdate: key === "cipher" ? cipherUpdate : undefined 
                                  });
                              }

                              if (activeWaitForEnterAnimationEnd) {
                                  animatingStates[i].isEntering = true;
                                  animatingStates[i].enterEndTime = Date.now() + (maxDuration * 1000);
                                  gsap.delayedCall(maxDuration, () => {
                                      animatingStates[i].isEntering = false;
                                  });
                              }
                          }
                      };

                      if (animatingStates[i].queuedCall) animatingStates[i].queuedCall?.kill();

                      if (activeWaitForLeaveAnimationEnd && animatingStates[i].isLeaving) {
                          const timeLeft = Math.max(0, (animatingStates[i].leaveEndTime - Date.now()) / 1000);
                          if (timeLeft > 0) {
                              animatingStates[i].queuedCall = gsap.delayedCall(timeLeft, executeEnterBack);
                              return;
                          }
                      }
                      executeEnterBack();
                    },
        
                    onLeaveBack: () => {
                      const executeLeaveBack = () => {
                          item.dataset.proxScrollActive = "false";
                          if (isTriggerMode && !isOnce) {
                              const gr = resetPropsRef.current[i] || {}; 
                              let maxWait = localResetDuration + activeResetDelay;
                              
                              const keysToLoop = activeOnCalculate ? ["custom"] : activePresetKeys;
                              for (let kIdx = 0; kIdx < keysToLoop.length; kIdx++) {
                                  const key = keysToLoop[kIdx];
                                  const vars = gr[key];
                                  if (!vars) continue;
  
                                  const tl = activeTimeline?.[key] || {};
                                  const rStVal = activeWaitForAnimationEnd ? (localResetDuration + (tl.resetDelay ?? activeResetDelay)) : memoizedResetStagger;
                                  const actDelay = (tl.resetDelay ?? activeResetDelay) + getStaggerValue(i, item, itemsRef.current, rStVal);
                                  maxWait = Math.max(maxWait, localResetDuration + actDelay);
                                  
                                  gsap.to(item, { 
                                      ...vars, 
                                      duration: localResetDuration, 
                                      delay: actDelay, 
                                      ease: targetResetEase, 
                                      overwrite: "auto", 
                                      onUpdate: key === "cipher" ? cipherUpdate : undefined 
                                  });
                              }
                              
                              if (activeWaitForLeaveAnimationEnd) {
                                  animatingStates[i].isLeaving = true;
                                  animatingStates[i].leaveEndTime = Date.now() + (maxWait * 1000);
                                  gsap.delayedCall(maxWait, () => {
                                      animatingStates[i].isLeaving = false;
                                  });
                              }

                              if (!skipAllAnimations) {
                                  gsap.delayedCall(maxWait, () => {
                                      if (item.dataset.proxScrollActive !== "true") gsap.set(item, { willChange: "auto" });
                                  });
                              }
                          } else if (!isTriggerMode && !skipAllAnimations) {
                              gsap.set(item, { willChange: "auto" });
                          }
                      };

                      if (animatingStates[i].queuedCall) animatingStates[i].queuedCall?.kill();

                      if (activeWaitForEnterAnimationEnd && animatingStates[i].isEntering) {
                          const timeLeft = Math.max(0, (animatingStates[i].enterEndTime - Date.now()) / 1000);
                          if (timeLeft > 0) {
                              animatingStates[i].queuedCall = gsap.delayedCall(timeLeft, executeLeaveBack);
                              return;
                          }
                      }
                      executeLeaveBack();
                    },
        
                    onUpdate: isTriggerMode ? undefined : (self) => {
                        let normalizedDist = 0;
                        if (focusPoint === 0) normalizedDist = 1 - self.progress; 
                        else if (focusPoint === 1) normalizedDist = self.progress; 
                        else normalizedDist = self.progress < focusPoint ? self.progress / focusPoint : (1 - self.progress) / (1 - focusPoint);
                        
                        const intensity = Math.pow(normalizedDist, activeFalloff);
                        const velocity = self.getVelocity(); 
                        const simulatedDy = Math.min(Math.max(velocity * 0.05, -100), 100); 
        
                        const gp = skipAllAnimations ? {} : (activeOnCalculate 
                        ? { custom: activeOnCalculate(intensity, 0, 0, simulatedDy, true) } 
                        : calculatePresetValues(localPreset, allPresetsStr, intensity, mergedBounds, 0, simulatedDy, centersRef.current[i], false, parsedMaxTravel, activeLockAxis, activeStartStyles, activeEndStyles, skipAllAnimations, disabledPresets));
                        
                        const keysToLoop = activeOnCalculate ? ["custom"] : activePresetKeys;
                        for (let kIdx = 0; kIdx < keysToLoop.length; kIdx++) {
                            const key = keysToLoop[kIdx];
                            const vars = gp[key];
                            if (!vars) continue;

                            const tl = activeTimeline?.[key] || {};
                            const dur = tl.duration || 0.1;
                            const del = tl.delay || 0;
                            const ez = EASE_MAP[tl.ease as string] || tl.ease || "none";

                            const requiresGsapTo = key === "cipher" || key === "reveal" || key === "blur" || key === "weight" || key === "custom" || key === "customStartEnd" || del > 0;

                            if (requiresGsapTo) {
                                gsap.to(item, { ...vars, duration: dur, delay: del, ease: ez, overwrite: "auto", onUpdate: key === "cipher" ? cipherUpdate : undefined });
                            } else {
                                if (!item._quickTos) item._quickTos = {};
                                for (const cssProp in vars) {
                                    const qtKey = `${key}_${cssProp}`;
                                    if (!item._quickTos![qtKey]) {
                                        gsap.killTweensOf(item, cssProp); 
                                        item._quickTos![qtKey] = gsap.quickTo(item, cssProp, { duration: dur, ease: ez });
                                    }
                                    item._quickTos![qtKey](vars[cssProp] as number);
                                }
                            }
                        }
                        settersRef.current[i].intensity(intensity.toFixed(3));
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
          if (!pointer.current.active || !container || skipAllAnimations) return;
          
          // 5. CACHE PER-TICK SCROLL ACCESS
          const scrollEl = scrollerRef?.current;
          const sx = scrollEl ? scrollEl.scrollLeft : window.scrollX;
          const sy = scrollEl ? scrollEl.scrollTop : window.scrollY;

          const pageX = pointer.current.x + sx; 
          const pageY = pointer.current.y + sy;
          const isBlocked = ignoreSelectors.some((sel) => (pointer.current.target as HTMLElement)?.closest?.(sel));

          if (containerBoundsRef.current && !activeGlobal) {
             const cb = containerBoundsRef.current;
             const isMouseOutBroadBounds = 
                 pageX < cb.left - maxDistance ||
                 pageX > cb.right + maxDistance ||
                 pageY < cb.top - maxDistance ||
                 pageY > cb.bottom + maxDistance;

             if (isMouseOutBroadBounds || isBlocked) {
                 if (statesRef.current.every(s => s.isOutside)) return;
             }
          }

          let nearestIndex = -1; let minDistance = Infinity;

          const dData = itemsRef.current.map((item, i) => {
            const b = centersRef.current[i]; if (!b) return { d: Infinity, dx: 0, dy: 0 };
            const dx = pageX - b.x; const dy = pageY - b.y;
            const isInside = pageX >= b.left && pageX <= b.right && pageY >= b.top && pageY <= b.bottom;
            
            const isOffScreen = item._isProxVisible === false;
            let d = (isBlocked || (activeExplicit && !isInside) || isOffScreen) 
                ? Infinity 
                : Math.sqrt(Math.pow(Math.max(b.left - pageX, 0, pageX - b.right), 2) + Math.pow(Math.max(b.top - pageY, 0, pageY - b.bottom), 2));
            if (d < minDistance) { minDistance = d; nearestIndex = i; }
            return { d, dx, dy };
          });

          itemsRef.current.forEach((item, i) => {
            const { d, dx, dy } = dData[i];
            const isNearest = i === nearestIndex && d <= maxDistance;
            const localConfig = targetMapRef.current.get(item);
            
            if (d > maxDistance) {
              if (!statesRef.current[i].isOutside) {
                const gr = resetPropsRef.current[i] || {}; 
                gsap.to(item, { 
                  "--prox-intensity": 0, 
                  duration: activeResetDuration, 
                  delay: activeResetDelay, 
                  ease: targetResetEase, 
                  overwrite: "auto",
                  onComplete: () => {
                      if (statesRef.current[i].isOutside) gsap.set(item, { willChange: "auto" });
                  }
                });
                
                const keysToLoop = activeOnCalculate ?["custom"] : activePresetKeys;
                for (let kIdx = 0; kIdx < keysToLoop.length; kIdx++) {
                    const k = keysToLoop[kIdx];
                    if (!gr[k]) continue;
                    const tl = activeTimeline?.[k] || {};
                    gsap.to(item, { ...gr[k], duration: tl.resetDuration ?? activeResetDuration, delay: tl.resetDelay ?? activeResetDelay, ease: EASE_MAP[tl.resetEase as string] || tl.resetEase || targetResetEase, overwrite: "auto", onUpdate: k === "cipher" ? cipherUpdate : undefined });
                }
                
                item._quickTos = {}; 
            
                statesRef.current[i].isOutside = true; statesRef.current[i].lastIntensity = 0;
              }
              return;
            }
            const intensity = Math.exp(-(Math.pow(d, activeFalloff)) / actualSpread);
            const hasMoved = Math.abs(intensity - statesRef.current[i].lastIntensity) > 0.001 || Math.abs(dx - statesRef.current[i].lastDx) > 0.5;
            const isCipherActive = item.proxCipher! > 0.01;

            if (hasMoved) {
              if (statesRef.current[i].isOutside && !skipAllAnimations) {
                  gsap.set(item, { willChange: OPTIMIZED_WILL_CHANGE });
              }

              settersRef.current[i].intensity(intensity.toFixed(3)); settersRef.current[i].dx(dx); settersRef.current[i].dy(dy);
              
              let cp = localConfig?.preset ?? activePreset ?? "";
              const nearestP = localConfig?.nearestPreset ?? activeNearestPreset;
              const neighborP = localConfig?.neighborPreset ?? activeNeighborPreset;

              if (isNearest && nearestP) cp = cp ? `${cp}-${nearestP}` : nearestP; 
              else if (!isNearest && neighborP) cp = cp ? `${cp}-${neighborP}` : neighborP;
              
              const gp = skipAllAnimations ? {} : (activeOnCalculate ? { custom: activeOnCalculate(intensity, d, dx, dy, isNearest) } : calculatePresetValues(cp as string, allPresetsStr, intensity, mergedBounds, dx, dy, centersRef.current[i], false, parsedMaxTravel, activeLockAxis, activeStartStyles, activeEndStyles, skipAllAnimations, disabledPresets));
              
              const keysToLoop = activeOnCalculate ? ["custom"] : activePresetKeys;
              for (let kIdx = 0; kIdx < keysToLoop.length; kIdx++) {
                  const k = keysToLoop[kIdx];
                  const vars = gp[k];
                  if (!vars) continue;

                  const tl = activeTimeline?.[k] || {};
                  const dur = tl.duration ?? (localConfig?.duration ?? activeDuration);
                  const del = tl.delay ?? activeDelay;
                  const ez = EASE_MAP[tl.ease as string] || tl.ease || (localConfig?.ease ?? targetEase);

                  const requiresGsapTo = k === "cipher" || k === "reveal" || k === "blur" || k === "weight" || k === "custom" || k === "customStartEnd" || del > 0;

                  if (requiresGsapTo) {
                      gsap.to(item, { ...vars, duration: dur, delay: del, ease: ez, overwrite: "auto", onUpdate: k === "cipher" ? cipherUpdate : undefined });
                  } else {
                      if (!item._quickTos) item._quickTos = {};
                      for (const cssProp in vars) {
                          const qtKey = `${k}_${cssProp}`;
                          if (!item._quickTos![qtKey]) {
                              gsap.killTweensOf(item, cssProp);
                              item._quickTos![qtKey] = gsap.quickTo(item, cssProp, { duration: dur, ease: ez });
                          }
                          item._quickTos![qtKey](vars[cssProp] as number);
                      }
                  }
              }
              statesRef.current[i].lastIntensity = intensity; statesRef.current[i].lastDx = dx; statesRef.current[i].lastDy = dy; statesRef.current[i].isOutside = false;
            } else if (isCipherActive && allPresetsStr.includes('cipher')) {
              cipherUpdate.call({ targets: () => [item] } as unknown as gsap.core.Tween);
            }
          });
        };

        if (!skipAllAnimations) {
            gsap.ticker.add(onTick);
            const targetElement: EventTarget = activeGlobal ? window : container;
            const upd = (x: number, y: number, target: EventTarget | null) => { pointer.current = { x, y, target, active: true }; };
            const onMove = (e: PointerEvent) => upd(e.clientX, e.clientY, e.target);
            const onTMove = (e: TouchEvent) => { if (e.touches?.[0]) upd(e.touches[0].clientX, e.touches[0].clientY, e.target); };
            const handleReset = () => {
              pointer.current.active = false;
              if (skipAllAnimations) return;
              itemsRef.current.forEach((item, i) => {
                const gr = resetPropsRef.current[i] || {}; 
                gsap.to(item, { 
                    "--prox-intensity": 0, 
                    duration: activeResetDuration, 
                    delay: activeResetDelay, 
                    ease: targetResetEase, 
                    overwrite: "auto",
                    onComplete: () => {
                        if (statesRef.current[i].isOutside) gsap.set(item, { willChange: "auto" });
                    }
                });
                
                const keysToLoop = activeOnCalculate ? ["custom"] : activePresetKeys;
                for (let kIdx = 0; kIdx < keysToLoop.length; kIdx++) {
                    const k = keysToLoop[kIdx];
                    if (gr[k]) {
                        gsap.to(item, { ...gr[k], duration: activeResetDuration, delay: activeResetDelay, ease: targetResetEase, overwrite: "auto", onUpdate: k === "cipher" ? cipherUpdate : undefined });
                    }
                }
                item._quickTos = {};
              });
              statesRef.current.forEach(s => { s.isOutside = true; s.lastIntensity = 0; });
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
              targetElement.removeEventListener("touchmove", handleReset as EventListener);
            };
        } else {
            return () => {};
        }
    }

    return () => {
        isCancelled = true;
        mediaQuery.removeEventListener("change", handleMotionChange);
        mutationObserver.disconnect(); resizeObserver.disconnect();
        if (io) io.disconnect();
        clearTimeout(resizeTimeout);
        scrollTriggersRef.current.forEach(t => t.kill());
        gsap.killTweensOf(itemsRef.current);
    };
  }, { 
    dependencies:[
      selector, excludeElements, activePreset, activeNearestPreset, activeNeighborPreset, activeReach, activeFalloff, activeDuration, parsedMaxTravel, activeLockAxis,
      activeResetDuration, activeDelay, activeResetDelay, activeScrub, activeResetScrub, activeGlobal, activeExplicit, mergedBounds, activeStartStyles, activeEndStyles, parsedTargets, allPresetsStr, activeTimeline, activeScrollConfig, ignoreSelectors.join(','), targetEase, targetResetEase, activeMode, 
      activeScrollFocus, activeScrollStart, activeScrollEnd, memoizedStagger, memoizedResetStagger,
      memoizedDisableOnMobile, activeWaitForAnimationEnd, activeWaitForEnterAnimationEnd,
      activeWaitForLeaveAnimationEnd,
    ],
    scope: containerRef
  });

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', touchAction: activeMode === 'scroll' ? 'auto' : 'pan-y', ...style }} {...restProps}>
      {children}
    </div>
  );
};