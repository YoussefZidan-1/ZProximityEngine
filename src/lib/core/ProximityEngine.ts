import gsap from "gsap";
import { calculatePresetValues, cipherUpdate } from "../utils";
import { EASE_MAP, QUICK_TO_PROPS } from "../constants";
import { ProxHTMLElement, ItemCenter, ItemState, ItemSetters, ContainerBounds, ProximityTargetOverride } from "../types";

export class ProximityEngine {
  container: HTMLDivElement;
  config: any;

  items: ProxHTMLElement[] = [];
  centers: ItemCenter[] = [];
  states: ItemState[] = [];
  setters: ItemSetters[] = [];
  targetMap: Map<ProxHTMLElement, ProximityTargetOverride> = new Map();
  containerBounds: ContainerBounds | null = null;
  resetProps: Record<string, gsap.TweenVars>[] = [];
  spatialGrid: Map<string, number[]> = new Map();
  cachedValues: Record<string, gsap.TweenVars>[] = [];
  lastCipherUpdate: number = 0;
  toCheckSet: Set<number> = new Set();
  dArray: Float32Array = new Float32Array(0);
  dxArray: Float32Array = new Float32Array(0);
  dyArray: Float32Array = new Float32Array(0);

  skipAllAnimations: boolean = false;
  isReducedMotion: boolean = false;
  disabledPresets: Set<string> = new Set();

  mediaQuery: MediaQueryList | null = null;
  mutationObserver: MutationObserver | null = null;
  resizeObserver: ResizeObserver | null = null;
  io: IntersectionObserver | null = null;
  resizeTimeout: any;

  onItemsChanged?: () => void;

  constructor(container: HTMLDivElement, config: any) {
    this.container = container;
    this.config = config;
  }

  setup() {
    this.mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.isReducedMotion = this.mediaQuery.matches;
    const isMobile = window.matchMedia("(any-pointer: coarse)").matches || window.innerWidth < 768;
    this.skipAllAnimations = this.isReducedMotion;
    this.disabledPresets.clear();

    if (isMobile && this.config.memoizedDisableOnMobile) {
      if (this.config.memoizedDisableOnMobile === true) {
        this.skipAllAnimations = true;
      } else if (typeof this.config.memoizedDisableOnMobile === "string") {
        this.config.memoizedDisableOnMobile.split("-").forEach((p: string) => this.disabledPresets.add(p));
      } else if (Array.isArray(this.config.memoizedDisableOnMobile)) {
        this.config.memoizedDisableOnMobile.forEach((p: string) => this.disabledPresets.add(p));
      }
    }

    this.mediaQuery.addEventListener("change", this.handleMotionChange);

    this.mutationObserver = new MutationObserver((mutations) => {
      const hasNew = mutations.some((m) => [...m.addedNodes, ...m.removedNodes].some((n) => n.nodeType === 1));
      if (hasNew) this.initItems();
    });

    this.resizeObserver = new ResizeObserver(() => {
      // CRITICAL FIX: Handled by ScrollTrigger's refresh in Scroll Mode to avoid layout-thrashing races
      if (this.config.activeMode === "scroll") return; 
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(this.updateCenters, 150);
    });

    this.mutationObserver.observe(this.container, { childList: true, subtree: true });
    this.resizeObserver.observe(this.container); 

    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.initItems();
        if (this.config.splitBy === "line") {
          setTimeout(this.updateCenters, 100);
        }
      });
    } else {
      this.initItems();
    }
  }

  updateCenters = (): void => {
      if (!this.container) return;
      const cRect = this.container.getBoundingClientRect();
      
      this.containerBounds = { 
        left: 0, 
        right: cRect.width, 
        top: 0, 
        bottom: cRect.height,
        globalLeft: cRect.left,
        globalTop: cRect.top
      };
      
      const hasFlexScale = this.config.allPresetsStr.includes("flexScale");
      
      // LOOP 1: READ ONLY (Save styles safely)
      const saved = this.items.map((item) => ({
        tf: item.style.transform,
        ml: item.style.marginLeft, mr: item.style.marginRight,
        mt: item.style.marginTop, mb: item.style.marginBottom
      }));
  
      // LOOP 2: WRITE ONLY (Clear transforms)
      this.items.forEach((item) => {
        item.style.transform = "";
        if (hasFlexScale) item.style.marginLeft = item.style.marginRight = item.style.marginTop = item.style.marginBottom = "";
      });
  
      // LOOP 3: READ ONLY (Measure without thrashing)
      const measurements = this.items.map((item) => {
        const rect = item.getBoundingClientRect();
        const comp = hasFlexScale ? window.getComputedStyle(item) : null;
        return {
          rect,
          ml: comp ? parseFloat(comp.marginLeft) || 0 : 0, mr: comp ? parseFloat(comp.marginRight) || 0 : 0,
          mt: comp ? parseFloat(comp.marginTop) || 0 : 0, mb: comp ? parseFloat(comp.marginBottom) || 0 : 0
        };
      });
  
      // LOOP 4: WRITE ONLY (Restore styles and build centers)
      this.centers = this.items.map((item, i) => {
        const s = saved[i];
        item.style.transform = s.tf;
        if (hasFlexScale) {
          item.style.marginLeft = s.ml; item.style.marginRight = s.mr;
          item.style.marginTop = s.mt; item.style.marginBottom = s.mb;
        }
        const { rect, ml, mr, mt, mb } = measurements[i];
        return {
          left: rect.left - cRect.left, right: rect.right - cRect.left,
          top: rect.top - cRect.top, bottom: rect.bottom - cRect.top,
          x: (rect.left + rect.width / 2) - cRect.left, y: (rect.top + rect.height / 2) - cRect.top,
          w: rect.width, h: rect.height, ml, mr, mt, mb,
        };
      });
  
      const maxDistance = this.config.activeReach * 200;
      const CELL = Math.max(50, maxDistance / 2); // Dynamic grid sizing
  
      this.spatialGrid.clear();
      this.centers.forEach((c, i) => {
        const key = `${Math.floor(c.x / CELL)},${Math.floor(c.y / CELL)}`;
        if (!this.spatialGrid.has(key)) this.spatialGrid.set(key,[]);
        this.spatialGrid.get(key)!.push(i);
      });
    };

  initItems = (): void => {
    if (this.items.length > 0) gsap.killTweensOf(this.items);

    let allMatches: ProxHTMLElement[] = [];
    try {
      const sel = this.config.excludeElements?.trim()
        ? this.config.selector.split(",").map((s: string) => `${s.trim()}:not(${this.config.excludeElements})`).join(", ")
        : this.config.selector;
      allMatches = Array.from(this.container.querySelectorAll(sel)) as ProxHTMLElement[];
    } catch (e) {
      const baseMatches = Array.from(this.container.querySelectorAll(this.config.selector)) as ProxHTMLElement[];
      if (this.config.excludeElements) {
        const excluded = new Set(Array.from(this.container.querySelectorAll(this.config.excludeElements)));
        allMatches = baseMatches.filter(el => !excluded.has(el));
      } else {
        allMatches = baseMatches;
      }
    }
    this.items = allMatches.filter(item => item.closest('.proximity-container') === this.container);

    this.targetMap.clear();
    this.config.parsedTargets.forEach((tc: any) => {
      const tgtMatches = Array.from(this.container.querySelectorAll(tc.selector)) as ProxHTMLElement[];
      tgtMatches.filter(item => item.closest('.proximity-container') === this.container).forEach((el) => this.targetMap.set(el, tc));
    });

    this.items.forEach((item) => {
      if (item.dataset.proxOriginal === undefined) item.dataset.proxOriginal = item.textContent ?? "";
      if (item.proxCipher === undefined) item.proxCipher = 0;
      
      const lc = this.targetMap.get(item);
      const itemPresetStr = `${lc?.preset ?? this.config.activePreset}-${lc?.nearestPreset ?? this.config.activeNearestPreset}-${lc?.neighborPreset ?? this.config.activeNeighborPreset}`;
      
      if (itemPresetStr.includes("fillText") || itemPresetStr.includes("fill")) {
        if (!item.dataset.proxColorSaved) item.dataset.proxColorSaved = window.getComputedStyle(item).color;
        item.style.setProperty("--prox-original-color", item.dataset.proxColorSaved); 
        item.style.setProperty("--prox-radius", "0");
        item.style.backgroundImage = "radial-gradient(circle at calc(var(--prox-x, 50) * 1%) calc(var(--prox-y, 50) * 1%), var(--prox-fill-color, var(--prox-original-color)) calc(var(--prox-radius, 0) * 1%), transparent calc(var(--prox-radius, 0) * 1%))";
        item.style.backgroundRepeat = "no-repeat";
        if (itemPresetStr.includes("fillText")) {
          item.style.color = "transparent";
          item.style.webkitTextStroke = "var(--prox-stroke-width, 1px) var(--prox-stroke-color, var(--prox-original-color))";
          item.style.webkitBackgroundClip = "text";
          item.style.backgroundClip = "text";
        }
      }
            if (item._quickTos) {
              gsap.killTweensOf(item);
              item._quickTos = undefined;
            }
            item._quickTos = {};
                  item._scrollState = "resting";
            const isScrubMode = this.config.activeMode === "scroll" && this.config.activeScrollConfig?.scrub !== false;
            const dur = isScrubMode ? 0.05 : (lc?.duration ?? this.config.activeDuration);
            const ez = isScrubMode ? "none" : (EASE_MAP[lc?.ease as string] ?? lc?.ease ?? this.config.targetEase);
            
            // Collect standard and dynamic velocity map properties to build GPU accelerated quickTo channels
            const customVelocityProps = Object.keys(this.config.activeScrollConfig?.velocityMap ?? {});
            const allPropsToBuild = Array.from(new Set([...QUICK_TO_PROPS, ...customVelocityProps]));

            allPropsToBuild.forEach((prop) => {
              item._quickTos![prop] = gsap.quickTo(item, prop, { duration: dur, ease: ez });
            });
    });

    this.states = this.items.map(() => ({ isOutside: true, lastIntensity: 0, lastDx: 0, lastDy: 0 }));
    this.setters = this.items.map((item) => ({
      intensity: gsap.quickSetter(item, "--prox-intensity") as (v: number | string) => void,
      dx: gsap.quickSetter(item, "--prox-dx", "px") as (v: number | string) => void,
      dy: gsap.quickSetter(item, "--prox-dy", "px") as (v: number | string) => void,
    }));

    this.dArray = new Float32Array(this.items.length);
        this.dxArray = new Float32Array(this.items.length);
        this.dyArray = new Float32Array(this.items.length);
        this.cachedValues = this.items.map(() => ({}));

    this.updateCenters();

    if (this.io) this.io.disconnect();
    this.io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { (e.target as ProxHTMLElement)._isProxVisible = e.isIntersecting; }),
      { rootMargin: `${Math.ceil(this.config.activeReach * 200 + 100)}px` }
    );
    this.items.forEach((item) => {
      if (item._isProxVisible === undefined) item._isProxVisible = true;
      this.io!.observe(item);
    });

    this.resetProps = this.items.map((item, i) => {
      if (this.skipAllAnimations) return {};
      if (this.config.activeOnReset) return { custom: this.config.activeOnReset() };
      if (this.config.activeOnCalculate) return { custom: this.config.activeOnCalculate(0, Infinity, 0, 0, false) };
      
      const lc = this.targetMap.get(item);
      const itemBounds = { ...this.config.mergedBounds, ...(lc || {}) };

      const res = calculatePresetValues("", this.config.allPresetsStr, 0, itemBounds, 0, 0,
        this.centers[i], true, this.config.parsedMaxTravel, this.config.activeLockAxis,
        this.config.activeStartStyles, this.config.activeEndStyles, this.skipAllAnimations, this.disabledPresets);
      const clone: Record<string, gsap.TweenVars> = {};
      for (const k in res) clone[k] = { ...res[k] };
      return clone;
    });

    if (!this.skipAllAnimations && this.items.length > 0) {
      const flatProps: gsap.TweenVars = { willChange: "auto" };
      if (this.resetProps[0]) Object.values(this.resetProps[0]).forEach((v) => Object.assign(flatProps, v));
      gsap.set(this.items, flatProps);
    }
    
    if (this.onItemsChanged) this.onItemsChanged();
  };

  handleMotionChange = (e: MediaQueryListEvent): void => {
    this.isReducedMotion = e.matches;
    this.skipAllAnimations = this.isReducedMotion || ((window.matchMedia("(any-pointer: coarse)").matches || window.innerWidth < 768) && this.config.memoizedDisableOnMobile === true);
    if (this.skipAllAnimations) {
      this.items.forEach((item) => {
        gsap.killTweensOf(item);
        gsap.set(item, { clearProps: "transform,filter,opacity,fontVariationSettings,clipPath,willChange" });
        item._willChangeCount = 0;
      });
      this.states.forEach((s) => { s.isOutside = true; s.lastIntensity = 0; });
    } else {
      this.initItems();
    }
  };

  applyVars = (item: ProxHTMLElement, key: string, vars: gsap.TweenVars, dur: number, del: number, ez: string): void => {
      const needsGsapTo = key === "cipher" || key === "reveal" || key === "scroll" || key === "cycle" || key === "cycleSide" || key === "custom" || key === "customStartEnd" || del > 0 || !!this.config.activeTimeline?.[key];
  
      if (needsGsapTo) {
        if (key === "scroll" || key === "cycle") {
          const shouldCycle = key === "scroll" ? vars.proxScroll === 1 : vars.proxCycle === 1;
          const travel = key === "scroll" ? (vars.proxScrollTravel || 100) : (vars.proxCycleTravel || 100);
          const currentState = item._scrollState || "resting";
          
          if (shouldCycle && currentState !== "hovered") {
            item._scrollState = "hovered";
            gsap.killTweensOf(item, "yPercent,clipPath");
            gsap.to(item, {
              yPercent: -travel, clipPath: `inset(${travel}% 0% 0% 0%)`, duration: dur * 0.5, delay: del, ease: ez, overwrite: "auto",
              onComplete: () => { gsap.fromTo(item, { yPercent: travel, clipPath: `inset(0% 0% ${travel}% 0%)` }, { yPercent: 0, clipPath: `inset(0% 0% 0% 0%)`, duration: dur * 0.5, ease: ez }); }
            });
          } else if (!shouldCycle && currentState === "hovered") {
            item._scrollState = "resting";
            gsap.killTweensOf(item, "yPercent,clipPath");
            gsap.to(item, {
              yPercent: travel, clipPath: `inset(0% 0% ${travel}% 0%)`, duration: dur * 0.5, delay: del, ease: ez, overwrite: "auto",
              onComplete: () => { gsap.fromTo(item, { yPercent: -travel, clipPath: `inset(${travel}% 0% 0% 0%)` }, { yPercent: 0, clipPath: `inset(0% 0% 0% 0%)`, duration: dur * 0.5, ease: ez }); }
            });
          }
          return;
        }
  
        if (key === "cycleSide") {
          const shouldCycle = vars.proxCycleSide === 1;
          const travel = vars.proxCycleSideTravel || 100;
          const currentState = item._scrollState || "resting";
          if (shouldCycle && currentState !== "hovered") {
            item._scrollState = "hovered";
            gsap.killTweensOf(item, "xPercent,clipPath");
            gsap.to(item, {
              xPercent: -travel, clipPath: `inset(0% 0% 0% ${travel}%)`, duration: dur * 0.5, delay: del, ease: ez, overwrite: "auto",
              onComplete: () => { gsap.fromTo(item, { xPercent: travel, clipPath: `inset(0% ${travel}% 0% 0%)` }, { xPercent: 0, clipPath: `inset(0% 0% 0% 0%)`, duration: dur * 0.5, ease: ez }); }
            });
          } else if (!shouldCycle && currentState === "hovered") {
            item._scrollState = "resting";
            gsap.killTweensOf(item, "xPercent,clipPath");
            gsap.to(item, {
              xPercent: travel, clipPath: `inset(0% ${travel}% 0% 0%)`, duration: dur * 0.5, delay: del, ease: ez, overwrite: "auto",
              onComplete: () => { gsap.fromTo(item, { xPercent: -travel, clipPath: `inset(0% 0% 0% ${travel}%)` }, { xPercent: 0, clipPath: `inset(0% 0% 0% 0%)`, duration: dur * 0.5, ease: ez }); }
            });
          }
          return;
        }
        gsap.to(item, { ...vars, duration: dur, delay: del, ease: ez, overwrite: "auto", onUpdate: key === "cipher" ? cipherUpdate : undefined });
      } else {
        const nonQuickVars: Record<string, any> = {};
        let hasNonQuick = false;
        for (const cssProp in vars) {
          const qt = item._quickTos?.[cssProp];
          if (qt) qt(vars[cssProp] as any); else { nonQuickVars[cssProp] = vars[cssProp]; hasNonQuick = true; }
        }
        if (hasNonQuick) gsap.to(item, { ...nonQuickVars, duration: dur, ease: ez, overwrite: "auto" });
      }
    };

  destroy() {
    this.mediaQuery?.removeEventListener("change", this.handleMotionChange);
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
    clearTimeout(this.resizeTimeout);
    if (this.io) this.io.disconnect();
    gsap.killTweensOf(this.items);
    gsap.set(this.items, { clearProps: "transform,filter,opacity,fontVariationSettings,clipPath" });
  }
}