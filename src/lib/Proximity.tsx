// src/lib/Proximity.tsx
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
  | "scale" | "flexScale" | "y" | "x" | "opacity" | "blur" | "rotate"
  | "weight" | "skew" | "magnetic" | "tilt" | "tiltCard" | "repel"
  | "cipher" | "reveal" | "color" | "background" | "glow" | "brightness"
  | "contrast" | "borderRadius" | "letterSpacing" | "grayScale" | "scroll"
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
  mode?: ProximityMode;
  scroll?: ProximityScrollConfig | [number, number];
  scrollFocus?: "top" | "center" | "middle" | "bottom" | number;
  scrollStart?: string;
  scrollEnd?: string;
  reach?: number;
  falloff?: number;
  duration?: number;
  resetDuration?: number;
  delay?: number;
  resetDelay?: number;
  stagger?: number | gsap.StaggerVars;
  resetStagger?: number | gsap.StaggerVars;
  scrub?: boolean | number;
  resetScrub?: boolean | number;
  start?: gsap.TweenVars;
  end?: gsap.TweenVars;
  global?: boolean;
  explicit?: boolean;
  preset?: ProximityPreset;
  nearestPreset?: ProximityPreset;
  neighborPreset?: ProximityPreset;
  ease?: EasePreset;
  resetEase?: EasePreset;
  maxTravel?: number | [number, number] | { x: number; y: number };
  lockAxis?: AxisLock;
  splitBy?: "letter" | "word" | "line";
  targets?: ProximityTargetOverride[];
  timeline?: Record<string, ProximityTimelineConfig>;
  precision?: number;
  scale?: [number, number];
  flexScale?: [number, number];
  y?: [number, number];
  x?: [number, number];
  opacity?: [number, number];
  blur?: [number, number];
  rotate?: [number, number];
  weight?: [number, number];
  skew?: [number, number];
  magnetic?: [number, number];
  tilt?: [number, number];
  tiltCard?: [number, number];
  repel?: [number, number];
  cipher?: [number, number];
  reveal?: [number, number];
  glow?: [number, number];
  brightness?: [number, number];
  contrast?: [number, number];
  borderRadius?: [number, number];
  letterSpacing?: [number, number];
  grayScale?: [number, number];
  color?: [string, string];
  background?: [string, string];
  onCalculate?: (intensity: number, distance: number, dx: number, dy: number, isNearest: boolean) => gsap.TweenVars;
  onReset?: () => gsap.TweenVars;
  disableOnMobile?: boolean | string | string[];
  waitForAnimationEnd?: boolean;
  waitForEnterAnimationEnd?: boolean;
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
  scrollerRef?: React.RefObject<HTMLElement | null>;
}

interface ProxHTMLElement extends HTMLElement {
  proxCipher?: number;
  _lastCipherUpdate?: number;
  _quickTos?: Record<string, gsap.QuickToFunc>;
  _isProxVisible?: boolean;
  _willChangeCount?: number;
  _scrollState?: "resting" | "hovered";
}

interface ItemCenter {
  left: number; right: number; top: number; bottom: number;
  x: number; y: number; w: number; h: number;
  ml: number; mr: number; mt: number; mb: number;
}

interface ItemState {
  isOutside: boolean;
  lastIntensity: number;
  lastDx: number;
  lastDy: number;
}

interface ItemSetters {
  intensity: (val: number | string) => void;
  dx: (val: number | string) => void;
  dy: (val: number | string) => void;
}

interface ContainerBounds {
  left: number; right: number; top: number; bottom: number;
}

const PRESET_DEFAULTS: Record<string, [number, number] | [string, string]> = {
  scale: [1, 1.5],
  flexScale: [1, 1.5],
  y: [0, -30],
  x: [0, 30],
  opacity: [0.2, 1],
  blur: [8, 0],
  rotate: [0, 90],
  weight: [100, 900],
  skew: [0, 20],
  magnetic: [0, 0.1],
  tilt: [0, 30],
  tiltCard: [0, 15],
  repel: [0, 0.4],
  cipher: [0, 1],
  reveal: [110, 0],
  scroll: [0, 100],
  glow: [0, 20],
  brightness: [0.6, 1.2],
  contrast: [0.8, 1.4],
  borderRadius: [0, 50],
  letterSpacing: [-0.05, 0.2],
  grayScale: [1, 0],
  color: ["#888888", "#ffffff"],
  background: ["transparent", "rgba(255,255,255,0.1)"],
};

const EASE_MAP: Record<string, string> = {
  smooth: "power1.inOut",
  heavy: "power4.out",
  sharp: "expo.out",
  fluid: "circ.inOut",
  bouncy: "back.out(1.7)",
  elastic: "elastic.out(1, 0.3)",
  jello: "elastic.out(1.5, 0.2)",
  bounce: "bounce.out",
  swing: "back.inOut(3)",
  vibrate: "rough({ strength: 2, points: 20, template: 'none', taper: 'none', randomize: true })",
  robot: "steps(8)",
  ghost: "slow(0.6, 0.8, false)",
  expo: "expo.inOut",
  circus: "back.out(4)",
  glitch: "rough({ template: 'none', strength: 3, points: 50, taper: 'both', randomize: true })",
  slowmo: "slow(0.7, 0.7, false)",
  spring: "elastic.out(1, 0.75)",
  heavySpring: "elastic.out(1.2, 0.3)",
  anticipate: "back.inOut(2)",
  launch: "slow(0.3, 0.4, false)",
  drift: "rough({ template: none, strength: 0.5, points: 10, taper: none, randomize: true, clamp: true })",
  whiplash: "back.out(4)",
};

const OPTIMIZED_WILL_CHANGE = "transform, filter, opacity, font-variation-settings, clip-path";
const FILTER_PRESETS = new Set(["blur", "glow", "brightness", "contrast", "grayScale"]);

const QUICK_TO_PROPS =[
  "scaleX", "scaleY", "x", "y", "rotation", "skewX", "opacity",
  "rotationX", "rotationY", "transformPerspective",
  "marginLeft", "marginRight", "marginTop", "marginBottom", "fontWeight",
  "proxCipher",
];

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (!deepEqual(ref.current, value)) ref.current = value;
  return ref.current;
}

const CALC_RESULT: Record<string, gsap.TweenVars> = {};

const calculatePresetValues = (
  activePresetString: string,
  allPresetsString: string,
  intensity: number,
  userConfig: Record<string, [number, number] | [string, string] | undefined>,
  dx: number,
  dy: number,
  center: ItemCenter | undefined | null,
  isReset = false,
  maxTravel?: number | [number, number] | { x: number; y: number },
  lockAxis?: AxisLock,
  startStyles?: gsap.TweenVars,
  endStyles?: gsap.TweenVars,
  skipAll = false,
  disabledPresets: Set<string> = new Set(),
): Record<string, gsap.TweenVars> => {
  if (skipAll) return {};

  for (const k in CALC_RESULT) delete CALC_RESULT[k];

  const activeProps = new Set(activePresetString.split("-").filter(Boolean));
  const allPropsArray = allPresetsString.split("-").filter(Boolean);

  const lockX = lockAxis === "y";
  const lockY = lockAxis === "x";
  const w = center?.w || 1;
  const h = center?.h || 1;
  const ml = center?.ml || 0;
  const mr = center?.mr || 0;
  const mt = center?.mt || 0;
  const mb = center?.mb || 0;

  const clampTravel = (val: number, axis: "x" | "y"): number => {
    if (maxTravel == null) return val;
    let limit = Infinity;
    if (typeof maxTravel === "number") limit = maxTravel;
    else if (Array.isArray(maxTravel)) limit = axis === "x" ? maxTravel[0] : maxTravel[1];
    else limit = axis === "x" ? (maxTravel as { x: number; y: number }).x : (maxTravel as { x: number; y: number }).y;
    if (!isFinite(limit)) return val;
    return Math.max(-limit, Math.min(val, limit));
  };

  const filterChunks: string[] =[];

  for (const prop of allPropsArray) {
    if (disabledPresets.has(prop)) continue;

    const bounds = userConfig[prop] ?? PRESET_DEFAULTS[prop];
    if (!bounds) continue;

    const isActive = activeProps.has(prop);
    const useBase = isReset || !isActive;
    const curIntensity = useBase ? 0 : intensity;

    if (prop === "color" || prop === "background") {
      if (!CALC_RESULT[prop]) CALC_RESULT[prop] = {};
      const [baseColor, maxColor] = bounds as [string, string];
      const interpolated = gsap.utils.interpolate(baseColor, maxColor, curIntensity);
      CALC_RESULT[prop][prop === "color" ? "color" : "backgroundColor"] = interpolated;
      continue;
    }

    const [base, max] = bounds as [number, number];
    const curValue = base + (max - base) * curIntensity;

    if (prop === "blur") { filterChunks.push(`blur(${curValue}px)`); continue; }
    if (prop === "glow") { filterChunks.push(`drop-shadow(0 0 ${curValue}px currentColor)`); continue; }
    if (prop === "brightness") { filterChunks.push(`brightness(${curValue})`); continue; }
    if (prop === "contrast") { filterChunks.push(`contrast(${curValue})`); continue; }
    if (prop === "grayScale") { filterChunks.push(`grayscale(${curValue})`); continue; }

    if (!CALC_RESULT[prop]) CALC_RESULT[prop] = {};
    const res = CALC_RESULT[prop];

    switch (prop) {
      case "weight":
        res.fontWeight = Math.round(curValue);
        res.fontVariationSettings = `'wght' ${Math.round(curValue)}`;
        break;
      case "borderRadius":
        res.borderRadius = `${curValue}%`;
        break;
      case "letterSpacing":
        res.letterSpacing = `${curValue}em`;
        break;
      case "rotate":
        res.rotation = curValue;
        break;
      case "skew":
        res.skewX = curValue;
        break;
      case "cipher":
        res.proxCipher = curValue;
        break;
      case "reveal":
        res.y = `${curValue}%`;
        res.clipPath = `inset(0% 0% ${curValue}% 0%)`;
        break;
      case "scroll": {
        res.proxScroll = curIntensity > 0.5 ? 1 : 0;
        res.proxScrollTravel = max;
        break;
      }
      case "magnetic": {
        const pullX = lockX ? 0 : dx * curIntensity * max;
        const pullY = lockY ? 0 : dy * curIntensity * max;
        res.x = useBase ? 0 : clampTravel(pullX, "x");
        res.y = useBase ? 0 : clampTravel(pullY, "y");
        break;
      }
      case "repel": {
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const safeDx = dx === 0 ? 0.1 : dx;
        const safeDy = dy === 0 ? 0.1 : dy;
        const push = max * 100 * curIntensity;
        res.x = useBase || lockX ? 0 : clampTravel(-(safeDx / dist) * push, "x");
        res.y = useBase || lockY ? 0 : clampTravel(-(safeDy / dist) * push, "y");
        break;
      }
      case "tilt":
        res.rotationX = useBase || lockY ? 0 : -dy * curIntensity * (max / 10);
        res.rotationY = useBase || lockX ? 0 : dx * curIntensity * (max / 10);
        res.transformPerspective = 1000;
        break;
      case "tiltCard":
        res.rotationX = useBase || lockY ? 0 : (dy / (h / 2)) * -max * curIntensity;
        res.rotationY = useBase || lockX ? 0 : (dx / (w / 2)) * max * curIntensity;
        res.transformPerspective = 1000;
        break;
      case "scale":
        res.scaleX = curValue;
        res.scaleY = curValue;
        break;
      case "flexScale": {
        res.scaleX = curValue;
        res.scaleY = curValue;
        const ew = (w * (curValue - 1)) / 2;
        const eh = (h * (curValue - 1)) / 2;
        res.marginLeft = ml + ew;
        res.marginRight = mr + ew;
        res.marginTop = mt + eh;
        res.marginBottom = mb + eh;
        break;
      }
      default:
        res[prop] = curValue;
    }
  }

  if (!CALC_RESULT["_filters"]) CALC_RESULT["_filters"] = {};
  CALC_RESULT["_filters"].filter = filterChunks.length > 0 ? filterChunks.join(" ") : "none";

  if (startStyles || endStyles) {
    if (!CALC_RESULT["customStartEnd"]) CALC_RESULT["customStartEnd"] = {};
    const custom = CALC_RESULT["customStartEnd"];
    for (const k in custom) delete custom[k];

    const keys = new Set([...Object.keys(startStyles ?? {}), ...Object.keys(endStyles ?? {})]);
    keys.forEach((k) => {
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

  return CALC_RESULT;
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
    scrambled += Math.random() < val ? chars[Math.floor(Math.random() * chars.length)] : orig[i];
  }
  if (item.textContent !== scrambled) item.textContent = scrambled;
}

export const Proximity: React.FC<ProximityProps> = ({
  children,
  selector = ".prox-item",
  config = {},
  preset = "",
  nearestPreset = "",
  neighborPreset = "",
  reach = 2,
  falloff = 2.4,
  duration = 0.2,
  resetDuration = 0.4,
  global = false,
  explicit = false,
  mode = "pointer",
  scrollerRef,
  scrollFocus = "center",
  scrollStart = "top bottom",
  scrollEnd = "bottom top",
  lockAxis,
  precision = 0.002,
  maxTravel,
  onCalculate,
  onReset,
  ease,
  resetEase,
  disableOnMobile,
  waitForAnimationEnd,
  waitForEnterAnimationEnd,
  waitForLeaveAnimationEnd,
  scale, flexScale, y, x, opacity, blur, rotate, weight, skew,
  magnetic, tilt, tiltCard, repel, cipher, reveal, scroll,
  color, background, glow, brightness, contrast,
  borderRadius, letterSpacing, grayScale,
  timeline, delay, resetDelay, scrub, resetScrub,
  start, end, stagger, resetStagger, targets,
  ignoreSelectors =[],
  excludeElements,
  className = "",
  style = {},
  ...restProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: -1, y: -1, target: null as EventTarget | null, active: false });
  const lastPointer = useRef({ x: -1, y: -1 });

  const itemsRef = useRef<ProxHTMLElement[]>([]);
  const centersRef = useRef<ItemCenter[]>([]);
  const statesRef = useRef<ItemState[]>([]);
  const settersRef = useRef<ItemSetters[]>([]);
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);
  const targetMapRef = useRef<Map<ProxHTMLElement, ProximityTargetOverride>>(new Map());
  const containerBoundsRef = useRef<ContainerBounds | null>(null);
  const resetPropsRef = useRef<Record<string, gsap.TweenVars>[]>([]);
  const spatialGridRef = useRef<Map<string, number[]>>(new Map());

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
  const activePrecision = config.precision ?? precision;
  const activeOnCalculate = config.onCalculate ?? onCalculate;
  const activeOnReset = config.onReset ?? onReset;
  const activeTargets = config.targets ?? targets ??[];
  const activeScrollStart = config.scrollStart ?? scrollStart;
  const activeScrollEnd = config.scrollEnd ?? scrollEnd;
  const activeScrollFocus = config.scrollFocus ?? scrollFocus;
  const activeDisableOnMobile = config.disableOnMobile ?? disableOnMobile;
  const activeWaitForAnimationEnd = config.waitForAnimationEnd ?? waitForAnimationEnd;
  const activeWaitForEnterAnimationEnd = config.waitForEnterAnimationEnd ?? waitForEnterAnimationEnd;
  const activeWaitForLeaveAnimationEnd = config.waitForLeaveAnimationEnd ?? waitForLeaveAnimationEnd;

  const safeScrollConfig = (config.scroll && !Array.isArray(config.scroll)) ? (config.scroll as ProximityScrollConfig) : undefined;
  const safeScrollProp = (scroll && !Array.isArray(scroll)) ? (scroll as ProximityScrollConfig) : undefined;

  const activeStagger = safeScrollConfig?.stagger ?? config.stagger ?? stagger ?? 0.1;
  const activeResetStagger = safeScrollConfig?.resetStagger ?? config.resetStagger ?? resetStagger ?? 0;
  const activeScrub = safeScrollConfig?.scrub ?? config.scrub ?? scrub ?? activeDuration ?? true;

  const targetEase = EASE_MAP[config.ease ?? (ease as string)] ?? config.ease ?? ease ?? "power1.out";
  const targetResetEase = EASE_MAP[config.resetEase ?? (resetEase as string)] ?? config.resetEase ?? resetEase ?? "power2.out";

  const mergedBounds = useDeepMemo({
    scale: config.scale ?? scale,
    flexScale: config.flexScale ?? flexScale,
    y: config.y ?? y,
    x: config.x ?? x,
    opacity: config.opacity ?? opacity,
    blur: config.blur ?? blur,
    rotate: config.rotate ?? rotate,
    weight: config.weight ?? weight,
    skew: config.skew ?? skew,
    magnetic: config.magnetic ?? magnetic,
    tilt: config.tilt ?? tilt,
    tiltCard: config.tiltCard ?? tiltCard,
    repel: config.repel ?? repel,
    cipher: config.cipher ?? cipher,
    reveal: config.reveal ?? reveal,
    scroll: Array.isArray(config.scroll) ? config.scroll : (Array.isArray(scroll) ? scroll : undefined),
    color: config.color ?? color,
    background: config.background ?? background,
    glow: config.glow ?? glow,
    brightness: config.brightness ?? brightness,
    contrast: config.contrast ?? contrast,
    borderRadius: config.borderRadius ?? borderRadius,
    letterSpacing: config.letterSpacing ?? letterSpacing,
    grayScale: config.grayScale ?? grayScale,
  });

  const activeTimeline = useDeepMemo(config.timeline ?? timeline ?? {});
  const activeScrollConfig = useDeepMemo(safeScrollConfig ?? safeScrollProp ?? {});
  const activeStartStyles = useDeepMemo(config.start ?? start ?? {});
  const activeEndStyles = useDeepMemo(config.end ?? end ?? {});
  const parsedMaxTravel = useDeepMemo(activeMaxTravel);
  const parsedTargets = useDeepMemo(activeTargets);
  const memoizedStagger = useDeepMemo(activeStagger);
  const memoizedResetStagger = useDeepMemo(activeResetStagger);
  const memoizedDisableOnMobile = useDeepMemo(activeDisableOnMobile);

  const allPresetsStr = useMemo(() => {
    const base = [activePreset, activeNearestPreset, activeNeighborPreset]
      .filter(Boolean).flatMap((p) => p.split("-"));
    const tgt = parsedTargets
      .flatMap((t) => [t.preset, t.nearestPreset, t.neighborPreset])
      .filter(Boolean).flatMap((p) => (p as string).split("-"));
    return Array.from(new Set([...base, ...tgt])).join("-");
  }, [activePreset, activeNearestPreset, activeNeighborPreset, parsedTargets]);

  const activePresetKeys = useMemo(() => {
    const keys = new Set<string>();
    allPresetsStr.split("-").forEach((k) => {
      if (!k) return;
      if (FILTER_PRESETS.has(k)) keys.add("_filters");
      else keys.add(k);
    });
    if (Object.keys(activeStartStyles).length > 0 || Object.keys(activeEndStyles).length > 0)
      keys.add("customStartEnd");
    if (activeOnCalculate) keys.add("custom");
    return Array.from(keys);
  }, [allPresetsStr, activeStartStyles, activeEndStyles, activeOnCalculate]);

  const parseScrollPosition = (pos: string, isStart: boolean): string => {
    if (pos === "appear") return "top bottom";
    if (pos === "disappear") return "bottom top";
    const m: Record<string, string> = { top: "top top", center: "center center", middle: "center center", bottom: "bottom bottom" };
    return m[pos] ?? pos ?? (isStart ? "top bottom" : "bottom top");
  };

  const getScrollFocusValue = (focus: string | number): number => {
    if (typeof focus === "number") return focus / 100;
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

  const addWillChange = (item: ProxHTMLElement): void => {
    item._willChangeCount = (item._willChangeCount ?? 0) + 1;
    if (item._willChangeCount === 1)
      gsap.set(item, { willChange: OPTIMIZED_WILL_CHANGE });
  };

  const removeWillChange = (item: ProxHTMLElement): void => {
    if ((item._willChangeCount ?? 0) > 0) item._willChangeCount!--;
    if (item._willChangeCount === 0)
      gsap.set(item, { willChange: "auto" });
  };

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;
    const isMobile = window.matchMedia("(any-pointer: coarse)").matches || window.innerWidth < 768;
    let skipAllAnimations = isReducedMotion;
    const disabledPresets = new Set<string>();

    if (isMobile && memoizedDisableOnMobile) {
      if (memoizedDisableOnMobile === true) {
        skipAllAnimations = true;
      } else if (typeof memoizedDisableOnMobile === "string") {
        memoizedDisableOnMobile.split("-").forEach((p) => disabledPresets.add(p));
      } else if (Array.isArray(memoizedDisableOnMobile)) {
        memoizedDisableOnMobile.forEach((p) => disabledPresets.add(p));
      }
    }

    let isCancelled = false;
    let io: IntersectionObserver | null = null;

    const updateCenters = (): void => {
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const scrollEl = scrollerRef?.current;
      const sx = scrollEl ? scrollEl.scrollLeft : window.scrollX;
      const sy = scrollEl ? scrollEl.scrollTop : window.scrollY;

      containerBoundsRef.current = {
        left: cRect.left + sx,
        right: cRect.right + sx,
        top: cRect.top + sy,
        bottom: cRect.bottom + sy,
      };

      const hasFlexScale = allPresetsStr.includes("flexScale");
      const saved = itemsRef.current.map((item) => {
        const s: any = { tf: item.style.transform };
        item.style.transform = "";

        if (hasFlexScale) {
          s.ml = item.style.marginLeft;
          s.mr = item.style.marginRight;
          s.mt = item.style.marginTop;
          s.mb = item.style.marginBottom;
          item.style.marginLeft = item.style.marginRight = item.style.marginTop = item.style.marginBottom = "";
        }
        return s;
      });

      const measurements = itemsRef.current.map((item) => {
        const rect = item.getBoundingClientRect();
        const comp = window.getComputedStyle(item);
        return {
          rect,
          ml: parseFloat(comp.marginLeft) || 0,
          mr: parseFloat(comp.marginRight) || 0,
          mt: parseFloat(comp.marginTop) || 0,
          mb: parseFloat(comp.marginBottom) || 0
        };
      });

      centersRef.current = itemsRef.current.map((item, i) => {
        const s = saved[i];
        item.style.transform = s.tf;
        if (hasFlexScale) {
          item.style.marginLeft = s.ml;
          item.style.marginRight = s.mr;
          item.style.marginTop = s.mt;
          item.style.marginBottom = s.mb;
        }

        const { rect, ml, mr, mt, mb } = measurements[i];
        return {
          left: rect.left + sx, right: rect.right + sx,
          top: rect.top + sy, bottom: rect.bottom + sy,
          x: rect.left + sx + rect.width / 2,
          y: rect.top + sy + rect.height / 2,
          w: rect.width, h: rect.height, ml, mr, mt, mb,
        };
      });

      spatialGridRef.current.clear();
      centersRef.current.forEach((c, i) => {
        const key = `${Math.floor(c.x / 150)},${Math.floor(c.y / 150)}`;
        if (!spatialGridRef.current.has(key)) spatialGridRef.current.set(key,[]);
        spatialGridRef.current.get(key)!.push(i);
      });
    };

    const initItems = (): void => {
      if (itemsRef.current.length > 0) gsap.killTweensOf(itemsRef.current);

      const sel = excludeElements?.trim()
        ? selector.split(",").map((s) => `${s.trim()}:not(${excludeElements})`).join(", ")
        : selector;

      const allMatches = Array.from(container.querySelectorAll(sel)) as ProxHTMLElement[];
      itemsRef.current = allMatches.filter(item => item.closest('.proximity-container') === container);

      targetMapRef.current.clear();
      parsedTargets.forEach((tc) => {
        const tgtMatches = Array.from(container.querySelectorAll(tc.selector)) as ProxHTMLElement[];
        tgtMatches.filter(item => item.closest('.proximity-container') === container).forEach((el) =>
          targetMapRef.current.set(el, tc)
        );
      });

      itemsRef.current.forEach((item) => {
        if (item.dataset.proxOriginal === undefined)
          item.dataset.proxOriginal = item.textContent ?? "";
        if (item.proxCipher === undefined) item.proxCipher = 0;

        item._quickTos = {};
        item._scrollState = "resting";
        const lc = targetMapRef.current.get(item);
        const dur = lc?.duration ?? activeDuration;
        const ez = EASE_MAP[lc?.ease as string] ?? lc?.ease ?? targetEase;

        QUICK_TO_PROPS.forEach((prop) => {
          item._quickTos![prop] = gsap.quickTo(item, prop, { duration: dur, ease: ez });
        });
      });

      statesRef.current = itemsRef.current.map(() => ({ isOutside: true, lastIntensity: 0, lastDx: 0, lastDy: 0 }));
      settersRef.current = itemsRef.current.map((item) => ({
        intensity: gsap.quickSetter(item, "--prox-intensity") as (v: number | string) => void,
        dx: gsap.quickSetter(item, "--prox-dx", "px") as (v: number | string) => void,
        dy: gsap.quickSetter(item, "--prox-dy", "px") as (v: number | string) => void,
      }));

      updateCenters();

      if (io) io.disconnect();
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => { (e.target as ProxHTMLElement)._isProxVisible = e.isIntersecting; }),
        { rootMargin: `${Math.ceil(activeReach * 200 + 100)}px` }
      );
      itemsRef.current.forEach((item) => {
        if (item._isProxVisible === undefined) item._isProxVisible = true;
        io!.observe(item);
      });

      resetPropsRef.current = itemsRef.current.map((_, i) => {
        if (skipAllAnimations) return {};
        if (activeOnReset) return { custom: activeOnReset() };
        if (activeOnCalculate) return { custom: activeOnCalculate(0, Infinity, 0, 0, false) };
        const res = calculatePresetValues("", allPresetsStr, 0, mergedBounds, 0, 0,
          centersRef.current[i], true, parsedMaxTravel, activeLockAxis,
          activeStartStyles, activeEndStyles, skipAllAnimations, disabledPresets);
        const clone: Record<string, gsap.TweenVars> = {};
        for (const k in res) clone[k] = { ...res[k] };
        return clone;
      });

      if (!skipAllAnimations && itemsRef.current.length > 0) {
        const flatProps: gsap.TweenVars = { willChange: "auto" };
        if (resetPropsRef.current[0])
          Object.values(resetPropsRef.current[0]).forEach((v) => Object.assign(flatProps, v));
        gsap.set(itemsRef.current, flatProps);
      }
    };

    const handleMotionChange = (e: MediaQueryListEvent): void => {
      isReducedMotion = e.matches;
      skipAllAnimations = isReducedMotion || (isMobile && memoizedDisableOnMobile === true);
      if (skipAllAnimations) {
        itemsRef.current.forEach((item) => {
          gsap.killTweensOf(item);
          gsap.set(item, { clearProps: "transform,filter,opacity,fontVariationSettings,clipPath,willChange" });
          item._willChangeCount = 0;
        });
        statesRef.current.forEach((s) => { s.isOutside = true; s.lastIntensity = 0; });
      } else {
        initItems();
      }
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    const mutationObserver = new MutationObserver((mutations) => {
      const hasNew = mutations.some((m) =>
        [...m.addedNodes, ...m.removedNodes].some((n) => n.nodeType === 1)
      );
      if (hasNew) initItems();
    });

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateCenters, 150);
    });

    mutationObserver.observe(container, { childList: true, subtree: true });
    resizeObserver.observe(container);
    resizeObserver.observe(document.body);

    let scrollTimeout: ReturnType<typeof setTimeout>;
    const onScroll = (): void => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateCenters, 100);
    };
    const scrollListenTarget = scrollerRef?.current;
    if (scrollListenTarget && scrollListenTarget !== (window as unknown) && scrollListenTarget !== document.documentElement && scrollListenTarget !== document.body) {
      scrollListenTarget.addEventListener("scroll", onScroll as EventListener, { passive: true });
    }

    const getStaggerValue = (
      i: number, target: HTMLElement, list: HTMLElement[],
      staggerVal: number | gsap.StaggerVars
    ): number => {
      if (!staggerVal) return 0;
      if (typeof staggerVal === "number") return i * staggerVal;
      return gsap.utils.distribute(staggerVal)(i, target, list);
    };

    const applyVars = (
      item: ProxHTMLElement,
      key: string,
      vars: gsap.TweenVars,
      dur: number,
      del: number,
      ez: string,
    ): void => {
      const needsGsapTo =
        key === "cipher" || key === "reveal" || key === "scroll" || key === "custom" ||
        key === "customStartEnd" || del > 0 || !!activeTimeline?.[key];

      if (needsGsapTo) {
        if (key === "scroll") {
          const shouldScroll = vars.proxScroll === 1;
          const travel = vars.proxScrollTravel || 100;
          const currentState = item._scrollState || "resting";
          
          if (shouldScroll && currentState !== "hovered") {
            item._scrollState = "hovered";
            gsap.killTweensOf(item, "yPercent,clipPath");
            
            gsap.to(item, {
              yPercent: -travel,
              clipPath: `inset(0% 0% 100% 0%)`,
              duration: dur * 0.8,
              ease: "power2.in",
              overwrite: "auto",
              onComplete: () => {
                gsap.fromTo(item,
                  { yPercent: travel, clipPath: `inset(100% 0% 0% 0%)` },
                  { yPercent: 0, clipPath: `inset(0% 0% 0% 0%)`, duration: dur * 0.8, ease: "power2.out" }
                );
              }
            });
          } else if (!shouldScroll && currentState === "hovered") {
            item._scrollState = "resting";
            gsap.killTweensOf(item, "yPercent,clipPath");
            
            gsap.to(item, {
              yPercent: travel,
              clipPath: `inset(100% 0% 0% 0%)`,
              duration: dur * 0.8,
              ease: "power2.in",
              overwrite: "auto",
              onComplete: () => {
                gsap.fromTo(item,
                  { yPercent: -travel, clipPath: `inset(0% 0% 100% 0%)` },
                  { yPercent: 0, clipPath: `inset(0% 0% 0% 0%)`, duration: dur * 0.8, ease: "power2.out" }
                );
              }
            });
          }
          return;
        }

        gsap.to(item, {
          ...vars, duration: dur, delay: del, ease: ez,
          overwrite: "auto",
          onUpdate: key === "cipher" ? cipherUpdate : undefined,
        });
      } else {
        for (const cssProp in vars) {
          const qt = item._quickTos?.[cssProp];
          if (qt) qt(vars[cssProp] as any);
          else gsap.to(item, { [cssProp]: vars[cssProp], duration: dur, ease: ez, overwrite: "auto" });
        }
      }
    };

    if (activeMode === "scroll") {
      const setupScroll = (): void => {
        if (isCancelled) return;
        initItems();
        scrollTriggersRef.current.forEach((t) => t.kill());
        scrollTriggersRef.current =[];

        const isTriggerMode = activeScrollConfig.scrub === false;
        const scrollerTarget = scrollerRef?.current ?? activeScrollConfig.scroller ?? window;
        const parsedStart = parseScrollPosition(activeScrollConfig.start ?? activeScrollStart, true);
        const parsedEnd = parseScrollPosition(activeScrollConfig.end ?? activeScrollEnd, false);
        const focusPoint = getScrollFocusValue(activeScrollConfig.focus ?? activeScrollFocus);
        const isOnce = activeScrollConfig.once ?? true;

        const animStates = itemsRef.current.map(() => ({
          isEntering: false, isLeaving: false,
          enterEndTime: 0, leaveEndTime: 0,
          queuedCall: null as gsap.core.Tween | null,
        }));

        itemsRef.current.forEach((item, i) => {
          const lc = targetMapRef.current.get(item);
          const localPreset = lc?.preset ?? activePreset;
          const localDuration = lc?.duration ?? activeDuration;
          const localResetDuration = lc?.resetDuration ?? activeResetDuration;
          const localEase = EASE_MAP[lc?.ease as string] ?? lc?.ease ?? targetEase;

          const runEnter = (): void => {
            item.dataset.proxScrollActive = "true";
            if (!skipAllAnimations) addWillChange(item);
            if (!isTriggerMode) return;

            const gp = skipAllAnimations ? {} : activeOnCalculate
              ? { custom: activeOnCalculate(1, 0, 0, 0, true) }
              : calculatePresetValues(localPreset, allPresetsStr, 1, mergedBounds, 0, 0,
                centersRef.current[i], false, parsedMaxTravel, activeLockAxis,
                activeStartStyles, activeEndStyles, skipAllAnimations, disabledPresets);

            let maxDur = 0;
            const keys = activeOnCalculate ? ["custom"] : activePresetKeys;
            for (const key of keys) {
              const vars = gp[key]; if (!vars) continue;
              const tl = activeTimeline?.[key] ?? {};
              const stV = activeWaitForAnimationEnd ? (localDuration + (tl.delay ?? activeDelay)) : memoizedStagger;
              const del = (tl.delay ?? activeDelay) + getStaggerValue(i, item, itemsRef.current, stV);
              maxDur = Math.max(maxDur, localDuration + del);
              applyVars(item, key, vars, localDuration, del, localEase);
            }
            if (activeWaitForEnterAnimationEnd) {
              animStates[i].isEntering = true;
              animStates[i].enterEndTime = Date.now() + maxDur * 1000;
              gsap.delayedCall(maxDur, () => { animStates[i].isEntering = false; });
            }
          };

          const runLeave = (): void => {
            item.dataset.proxScrollActive = "false";
            if (!isTriggerMode || isOnce) { if (!isTriggerMode && !skipAllAnimations) removeWillChange(item); return; }

            const gr = resetPropsRef.current[i] ?? {};
            let maxWait = localResetDuration + activeResetDelay;
            const keys = activeOnCalculate ? ["custom"] : activePresetKeys;
            for (const key of keys) {
              const vars = gr[key]; if (!vars) continue;
              const tl = activeTimeline?.[key] ?? {};
              const rsV = activeWaitForAnimationEnd ? (localResetDuration + (tl.resetDelay ?? activeResetDelay)) : memoizedResetStagger;
              const del = (tl.resetDelay ?? activeResetDelay) + getStaggerValue(i, item, itemsRef.current, rsV);
              maxWait = Math.max(maxWait, localResetDuration + del);
              applyVars(item, key, vars, localResetDuration, del, targetResetEase);
            }
            if (activeWaitForLeaveAnimationEnd) {
              animStates[i].isLeaving = true;
              animStates[i].leaveEndTime = Date.now() + maxWait * 1000;
              gsap.delayedCall(maxWait, () => { animStates[i].isLeaving = false; });
            }
            if (!skipAllAnimations)
              gsap.delayedCall(maxWait, () => {
                if (item.dataset.proxScrollActive !== "true") removeWillChange(item);
              });
          };

          const guarded = (fn: () => void, waitLeave: boolean, waitEnter: boolean, idx: number) => {
            if (animStates[idx].queuedCall) animStates[idx].queuedCall?.kill();
            if (waitLeave && animStates[idx].isLeaving) {
              const left = Math.max(0, (animStates[idx].leaveEndTime - Date.now()) / 1000);
              if (left > 0) { animStates[idx].queuedCall = gsap.delayedCall(left, fn); return; }
            }
            if (waitEnter && animStates[idx].isEntering) {
              const left = Math.max(0, (animStates[idx].enterEndTime - Date.now()) / 1000);
              if (left > 0) { animStates[idx].queuedCall = gsap.delayedCall(left, fn); return; }
            }
            fn();
          };

          scrollTriggersRef.current.push(ScrollTrigger.create({
            trigger: item, scroller: scrollerTarget,
            start: parsedStart, end: parsedEnd,
            scrub: isTriggerMode ? false : activeScrub,
            once: isOnce, markers: activeScrollConfig.markers ?? false,

            onEnter: () => guarded(runEnter, activeWaitForLeaveAnimationEnd ?? false, false, i),
            onLeave: () => guarded(runLeave, false, activeWaitForEnterAnimationEnd ?? false, i),
            onEnterBack: () => guarded(runEnter, activeWaitForLeaveAnimationEnd ?? false, false, i),
            onLeaveBack: () => guarded(runLeave, false, activeWaitForEnterAnimationEnd ?? false, i),

            onUpdate: isTriggerMode ? undefined : (self) => {
              let nd = 0;
              if (focusPoint === 0) nd = 1 - self.progress;
              else if (focusPoint === 1) nd = self.progress;
              else nd = self.progress < focusPoint
                ? self.progress / focusPoint
                : (1 - self.progress) / (1 - focusPoint);

              const intens = Math.pow(nd, activeFalloff);
              const vel = self.getVelocity();
              const simDy = Math.min(Math.max(vel * 0.05, -100), 100);

              if (
                Math.abs(intens - statesRef.current[i].lastIntensity) < activePrecision &&
                Math.abs(simDy - statesRef.current[i].lastDy) < 1.0
              ) return;

              statesRef.current[i].lastIntensity = intens;
              statesRef.current[i].lastDy = simDy;

              const gp = skipAllAnimations ? {} : activeOnCalculate
                ? { custom: activeOnCalculate(intens, 0, 0, simDy, true) }
                : calculatePresetValues(localPreset, allPresetsStr, intens, mergedBounds, 0, simDy,
                  centersRef.current[i], false, parsedMaxTravel, activeLockAxis,
                  activeStartStyles, activeEndStyles, skipAllAnimations, disabledPresets);

              const keys = activeOnCalculate ? ["custom"] : activePresetKeys;
              for (const key of keys) {
                const vars = gp[key]; if (!vars) continue;
                const tl = activeTimeline?.[key] ?? {};
                const dur = tl.duration ?? 0.1;
                const del = tl.delay ?? 0;
                const ez = EASE_MAP[tl.ease as string] ?? tl.ease ?? "none";
                applyVars(item, key, vars, dur, del, ez);
              }
              settersRef.current[i].intensity(intens.toFixed(3));
            },
          }));
        });
      };

      if (document.fonts) document.fonts.ready.then(setupScroll); else setupScroll();

    } else {
      if (document.fonts) document.fonts.ready.then(initItems); else initItems();

      const maxDistance = activeReach * 200;

      const onTick = (): void => {
        const hasCipher = allPresetsStr.includes("cipher");

        if (hasCipher && !skipAllAnimations) {
          for (let i = 0; i < itemsRef.current.length; i++) {
            const item = itemsRef.current[i];
            if (item.proxCipher! > 0.01) {
              cipherUpdate.call({ targets: () => [item] } as unknown as gsap.core.Tween);
            }
          }
        }

        if (
          pointer.current.x === lastPointer.current.x &&
          pointer.current.y === lastPointer.current.y
        ) {
          return;
        }

        lastPointer.current.x = pointer.current.x;
        lastPointer.current.y = pointer.current.y;

        if (!pointer.current.active || !container || skipAllAnimations) return;

        const scrollEl = scrollerRef?.current;
        const sx = scrollEl ? scrollEl.scrollLeft : window.scrollX;
        const sy = scrollEl ? scrollEl.scrollTop : window.scrollY;
        const pageX = pointer.current.x + sx;
        const pageY = pointer.current.y + sy;

        const isBlocked = ignoreSelectors.some((sel) =>
          (pointer.current.target as HTMLElement)?.closest?.(sel)
        );

        if (containerBoundsRef.current && !activeGlobal) {
          const cb = containerBoundsRef.current;
          if (
            (pageX < cb.left - maxDistance || pageX > cb.right + maxDistance ||
              pageY < cb.top - maxDistance || pageY > cb.bottom + maxDistance || isBlocked) &&
            statesRef.current.every((s) => s.isOutside)
          ) return;
        }

        const toCheck = new Set<number>();
        if (activeGlobal) {
          itemsRef.current.forEach((_, i) => toCheck.add(i));
        } else {
          const CELL = 150;
          const cellRadius = Math.ceil(maxDistance / CELL);
          const cx = Math.floor(pageX / CELL);
          const cy = Math.floor(pageY / CELL);
          for (let ox = -cellRadius; ox <= cellRadius; ox++) {
            for (let oy = -cellRadius; oy <= cellRadius; oy++) {
              const cells = spatialGridRef.current.get(`${cx + ox},${cy + oy}`);
              if (cells) for (const idx of cells) toCheck.add(idx);
            }
          }
        }

        statesRef.current.forEach((s, i) => { if (!s.isOutside) toCheck.add(i); });

        const dData: { d: number; dx: number; dy: number }[] =
          itemsRef.current.map(() => ({ d: Infinity, dx: 0, dy: 0 }));

        let nearestIndex = -1;
        let minDist = Infinity;

        for (const i of toCheck) {
          const b = centersRef.current[i];
          if (!b) continue;
          const dx = pageX - b.x;
          const dy = pageY - b.y;
          const inside = pageX >= b.left && pageX <= b.right && pageY >= b.top && pageY <= b.bottom;
          const offScreen = (itemsRef.current[i] as ProxHTMLElement)._isProxVisible === false;
          const d = isBlocked || (activeExplicit && !inside) || offScreen
            ? Infinity
            : Math.sqrt(
              Math.pow(Math.max(b.left - pageX, 0, pageX - b.right), 2) +
              Math.pow(Math.max(b.top - pageY, 0, pageY - b.bottom), 2)
            );
          if (d < minDist) { minDist = d; nearestIndex = i; }
          dData[i] = { d, dx, dy };
        }

        for (const i of toCheck) {
          const item = itemsRef.current[i];
          const { d, dx, dy } = dData[i];
          const isNearest = i === nearestIndex && d <= maxDistance;
          const lc = targetMapRef.current.get(item);

          if (d > maxDistance) {
            if (!statesRef.current[i].isOutside) {
              const gr = resetPropsRef.current[i] ?? {};
              gsap.to(item, {
                "--prox-intensity": 0,
                duration: activeResetDuration, delay: activeResetDelay,
                ease: targetResetEase, overwrite: "auto",
                onComplete: () => { if (statesRef.current[i].isOutside) removeWillChange(item); },
              });
              const keys = activeOnCalculate ? ["custom"] : activePresetKeys;
              for (const k of keys) {
                if (!gr[k]) continue;
                const tl = activeTimeline?.[k] ?? {};
                applyVars(item, k, gr[k],
                  tl.resetDuration ?? activeResetDuration,
                  tl.resetDelay ?? activeResetDelay,
                  EASE_MAP[tl.resetEase as string] ?? tl.resetEase ?? targetResetEase,
                );
              }
              statesRef.current[i].isOutside = true;
              statesRef.current[i].lastIntensity = 0;
            }
            continue;
          }

          const intensity = Math.pow(Math.max(0, 1 - (d / maxDistance)), activeFalloff);

          const hasMoved =
            Math.abs(intensity - statesRef.current[i].lastIntensity) >= activePrecision ||
            Math.abs(dx - statesRef.current[i].lastDx) >= 1.0;

          if (!hasMoved) {
            continue;
          }

          if (statesRef.current[i].isOutside && !skipAllAnimations) addWillChange(item);

          settersRef.current[i].intensity(intensity.toFixed(3));
          settersRef.current[i].dx(dx);
          settersRef.current[i].dy(dy);

          let cp = lc?.preset ?? activePreset ?? "";
          const nearestP = lc?.nearestPreset ?? activeNearestPreset;
          const neighborP = lc?.neighborPreset ?? activeNeighborPreset;
          if (isNearest && nearestP) cp = cp ? `${cp}-${nearestP}` : nearestP;
          else if (!isNearest && neighborP) cp = cp ? `${cp}-${neighborP}` : neighborP;

          const gp = skipAllAnimations ? {} : activeOnCalculate
            ? { custom: activeOnCalculate(intensity, d, dx, dy, isNearest) }
            : calculatePresetValues(cp, allPresetsStr, intensity, mergedBounds, dx, dy,
              centersRef.current[i], false, parsedMaxTravel, activeLockAxis,
              activeStartStyles, activeEndStyles, skipAllAnimations, disabledPresets);

          const keys = activeOnCalculate ? ["custom"] : activePresetKeys;
          for (const k of keys) {
            const vars = gp[k]; if (!vars) continue;
            const tl = activeTimeline?.[k] ?? {};
            const dur = tl.duration ?? (lc?.duration ?? activeDuration);
            const del = tl.delay ?? activeDelay;
            const ez = EASE_MAP[tl.ease as string] ?? tl.ease ?? (lc?.ease ?? targetEase);
            applyVars(item, k, vars, dur, del, ez);
          }

          statesRef.current[i].lastIntensity = intensity;
          statesRef.current[i].lastDx = dx;
          statesRef.current[i].lastDy = dy;
          statesRef.current[i].isOutside = false;
        }
      };

      if (!skipAllAnimations) {
        gsap.ticker.add(onTick);

        const target = activeGlobal ? window : container;
        const upd = (px: number, py: number, tgt: EventTarget | null) => { pointer.current = { x: px, y: py, target: tgt, active: true }; };
        const onMove = (e: PointerEvent) => upd(e.clientX, e.clientY, e.target);
        const onTMove = (e: TouchEvent) => { if (e.touches[0]) upd(e.touches[0].clientX, e.touches[0].clientY, e.target); };

        const handleReset = (): void => {
          pointer.current.active = false;
          itemsRef.current.forEach((item, i) => {
            const gr = resetPropsRef.current[i] ?? {};
            gsap.to(item, {
              "--prox-intensity": 0,
              duration: activeResetDuration, delay: activeResetDelay,
              ease: targetResetEase, overwrite: "auto",
              onComplete: () => { if (statesRef.current[i].isOutside) removeWillChange(item); },
            });
            const keys = activeOnCalculate ? ["custom"] : activePresetKeys;
            for (const k of keys) {
              if (!gr[k]) continue;
              applyVars(item, k, gr[k], activeResetDuration, activeResetDelay, targetResetEase);
            }
          });
          statesRef.current.forEach((s) => { s.isOutside = true; s.lastIntensity = 0; });
        };

        target.addEventListener("pointermove", onMove as EventListener);
        target.addEventListener("pointerleave", handleReset as EventListener);
        target.addEventListener("touchmove", onTMove as EventListener, { passive: true });
        target.addEventListener("touchend", handleReset as EventListener);

        return () => {
          gsap.ticker.remove(onTick);
          target.removeEventListener("pointermove", onMove as EventListener);
          target.removeEventListener("pointerleave", handleReset as EventListener);
          target.removeEventListener("touchmove", onTMove as EventListener);
          target.removeEventListener("touchend", handleReset as EventListener);
        };
      }

      return () => { };
    }

    return () => {
      isCancelled = true;
      mediaQuery.removeEventListener("change", handleMotionChange);
      mutationObserver.disconnect();
      resizeObserver.disconnect();

      const scrollListenTarget = scrollerRef?.current;
      if (scrollListenTarget && scrollListenTarget !== (window as unknown) && scrollListenTarget !== document.documentElement && scrollListenTarget !== document.body) {
        scrollListenTarget.removeEventListener("scroll", onScroll as EventListener);
      }

      clearTimeout(resizeTimeout!);
      clearTimeout(scrollTimeout!);
      if (io) io.disconnect();
      scrollTriggersRef.current.forEach((t) => t.kill());
      gsap.killTweensOf(itemsRef.current);
      gsap.set(itemsRef.current, { clearProps: "transform,filter,opacity,fontVariationSettings,clipPath" });
    };
  }, {
    dependencies:[
      selector, excludeElements,
      activePreset, activeNearestPreset, activeNeighborPreset,
      activeReach, activeFalloff, activeDuration, activePrecision,
      parsedMaxTravel, activeLockAxis,
      activeResetDuration, activeDelay, activeResetDelay,
      activeScrub, activeGlobal, activeExplicit,
      mergedBounds, activeStartStyles, activeEndStyles,
      parsedTargets, allPresetsStr, activeTimeline, activeScrollConfig,
      ignoreSelectors.join(","), targetEase, targetResetEase, activeMode,
      activeScrollFocus, activeScrollStart, activeScrollEnd,
      memoizedStagger, memoizedResetStagger,
      memoizedDisableOnMobile,
      activeWaitForAnimationEnd, activeWaitForEnterAnimationEnd, activeWaitForLeaveAnimationEnd,
    ],
    scope: containerRef,
  });

  return (
    <div
      ref={containerRef}
      className={`proximity-container ${className}`.trim()}
      style={{ position: "relative", touchAction: activeMode === "scroll" ? "auto" : "pan-y", ...style }}
      {...restProps}
    >
      {children}
    </div>
  );
};