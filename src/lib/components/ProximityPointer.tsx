import React, { useRef, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDeepMemo } from "../hooks";
import { calculatePresetValues, cipherUpdate } from "../utils";
import { addWillChange, removeWillChange } from "../utils/proximityHelpers";
import { PRESET_DEFAULTS, EASE_MAP, FILTER_PRESETS, QUICK_TO_PROPS } from "../constants";
import { 
  ProximityProps, ProxHTMLElement, ItemCenter, ItemState, ItemSetters, 
  ContainerBounds, ProximityTargetOverride, ProximityScrollConfig
} from "../types";

export const ProximityPointer: React.FC<ProximityProps> = ({
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
  borderRadius, letterSpacing, grayScale, parallax, velocitySkew, velocityScale,
  timeline, delay, resetDelay, scrub, resetScrub,
  start, end, stagger, resetStagger, targets,
  ignoreSelectors = [],
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
  const activeTargets = config.targets ?? targets ?? [];
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
    parallax: config.parallax ?? parallax,
    velocitySkew: config.velocitySkew ?? velocitySkew,
    velocityScale: config.velocityScale ?? velocityScale,
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

    let io: IntersectionObserver | null = null;

    const updateCenters = (): void => {
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      containerBoundsRef.current = {
        left: 0, right: cRect.width, top: 0, bottom: cRect.height,
      };
      
      const hasFlexScale = allPresetsStr.includes("flexScale");
      const saved = itemsRef.current.map((item) => {
        const s: any = { tf: item.style.transform };
        item.style.transform = "";
        if (hasFlexScale) {
          s.ml = item.style.marginLeft; s.mr = item.style.marginRight;
          s.mt = item.style.marginTop; s.mb = item.style.marginBottom;
          item.style.marginLeft = item.style.marginRight = item.style.marginTop = item.style.marginBottom = "";
        }
        return s;
      });

      const measurements = itemsRef.current.map((item) => {
        const rect = item.getBoundingClientRect();
        const comp = window.getComputedStyle(item);
        return {
          rect,
          ml: parseFloat(comp.marginLeft) || 0, mr: parseFloat(comp.marginRight) || 0,
          mt: parseFloat(comp.marginTop) || 0, mb: parseFloat(comp.marginBottom) || 0
        };
      });

      centersRef.current = itemsRef.current.map((item, i) => {
        const s = saved[i];
        item.style.transform = s.tf;
        if (hasFlexScale) {
          item.style.marginLeft = s.ml; item.style.marginRight = s.mr;
          item.style.marginTop = s.mt; item.style.marginBottom = s.mb;
        }

        const { rect, ml, mr, mt, mb } = measurements[i];
        
        return {
          left: rect.left - cRect.left, 
          right: rect.right - cRect.left,
          top: rect.top - cRect.top, 
          bottom: rect.bottom - cRect.top,
          x: (rect.left + rect.width / 2) - cRect.left,
          y: (rect.top + rect.height / 2) - cRect.top,
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
        
        const lc = targetMapRef.current.get(item);
        const itemPresetStr = `${lc?.preset ?? activePreset}-${lc?.nearestPreset ?? activeNearestPreset}-${lc?.neighborPreset ?? activeNeighborPreset}`;
        
        if (itemPresetStr.includes("fillText")) {
          if (!item.dataset.proxColorSaved) item.dataset.proxColorSaved = window.getComputedStyle(item).color;
          item.style.setProperty("--prox-original-color", item.dataset.proxColorSaved); 
          item.style.color = "transparent";
          item.style.webkitTextStroke = "var(--prox-stroke-width, 1px) var(--prox-stroke-color, var(--prox-original-color))";
          item.style.setProperty("--prox-radius", "0");
          item.style.backgroundImage = "radial-gradient(circle at calc(var(--prox-x, 50) * 1%) calc(var(--prox-y, 50) * 1%), var(--prox-fill-color, var(--prox-original-color)) calc(var(--prox-radius, 0) * 1%), transparent calc(var(--prox-radius, 0) * 1%))";
          item.style.webkitBackgroundClip = "text";
          item.style.backgroundClip = "text";
          item.style.backgroundRepeat = "no-repeat";
        } 
        else if (itemPresetStr.includes("fill")) {
          if (!item.dataset.proxColorSaved) item.dataset.proxColorSaved = window.getComputedStyle(item).color;
          item.style.setProperty("--prox-original-color", item.dataset.proxColorSaved);
          
          item.style.setProperty("--prox-radius", "0");
          item.style.backgroundImage = "radial-gradient(circle at calc(var(--prox-x, 50) * 1%) calc(var(--prox-y, 50) * 1%), var(--prox-fill-color, var(--prox-original-color)) calc(var(--prox-radius, 0) * 1%), transparent calc(var(--prox-radius, 0) * 1%))";
          item.style.backgroundRepeat = "no-repeat";
        }

        if (itemPresetStr.includes("color")) {
          const bounds = (lc?.color ?? mergedBounds.color ?? PRESET_DEFAULTS.color) as [string, string];
          if (item._colorTween) item._colorTween.kill();
          item._colorTween = gsap.fromTo(item, { color: bounds[0] }, { color: bounds[1], paused: true, ease: "none" });
        }
        
        if (itemPresetStr.includes("background")) {
          const bounds = (lc?.background ?? mergedBounds.background ?? PRESET_DEFAULTS.background) as [string, string];
          const safeBase = bounds[0] === "transparent" ? "rgba(255,255,255,0)" : bounds[0];
          const safeMax = bounds[1] === "transparent" ? "rgba(255,255,255,0)" : bounds[1];
          if (item._bgTween) item._bgTween.kill();
          item._bgTween = gsap.fromTo(item, { backgroundColor: safeBase }, { backgroundColor: safeMax, paused: true, ease: "none" });
        }
        
        item._quickTos = {};
        item._scrollState = "resting";
        const dur = lc?.duration ?? activeDuration;
        const ez = EASE_MAP[lc?.ease as string] ?? lc?.ease ?? targetEase;

        QUICK_TO_PROPS.forEach((prop) => {
          item._quickTos![prop] = gsap.quickTo(item, prop, { duration: dur, ease: ez });
        });
        if (item._colorTween) {
          item._quickTos!["color"] = gsap.quickTo(item._colorTween, "progress", { duration: dur, ease: ez });
        }
        if (item._bgTween) {
          item._quickTos!["backgroundColor"] = gsap.quickTo(item._bgTween, "progress", { duration: dur, ease: ez });
        }
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

    const applyVars = (
          item: ProxHTMLElement, 
          key: string, 
          vars: gsap.TweenVars, 
          dur: number, 
          del: number, 
          ez: string
        ): void => {
          const needsGsapTo =
            key === "cipher" ||
            key === "reveal" ||
            key === "cycle" ||
            key === "cycleSide" ||
            key === "scroll" ||
            key === "custom" ||
            key === "customStartEnd" ||
            del > 0 ||
            !!activeTimeline?.[key];
    
          if (needsGsapTo) {
            if (key === "scroll" || key === "cycle") {
              const shouldCycle = key === "scroll" ? vars.proxScroll === 1 : vars.proxCycle === 1;
              const travel = key === "scroll" ? (vars.proxScrollTravel || 100) : (vars.proxCycleTravel || 100);
              const currentState = item._scrollState || "resting";
              
              if (shouldCycle && currentState !== "hovered") {
                item._scrollState = "hovered";
                gsap.killTweensOf(item, "yPercent,clipPath");
                
                gsap.to(item, {
                  yPercent: -travel, 
                  clipPath: `inset(${travel}% 0% 0% 0%)`, 
                  duration: dur * 0.5, 
                  delay: del, 
                  ease: ez, 
                  overwrite: "auto",
                  onComplete: () => {
                    gsap.fromTo(item,
                      { yPercent: travel, clipPath: `inset(0% 0% ${travel}% 0%)` },
                      { 
                        yPercent: 0, 
                        clipPath: `inset(0% 0% 0% 0%)`, 
                        duration: dur * 0.5, 
                        ease: ez 
                      }
                    );
                  }
                });
              } else if (!shouldCycle && currentState === "hovered") {
                item._scrollState = "resting";
                gsap.killTweensOf(item, "yPercent,clipPath");
                
                gsap.to(item, {
                  yPercent: travel, 
                  clipPath: `inset(0% 0% ${travel}% 0%)`, 
                  duration: dur * 0.5, 
                  delay: del, 
                  ease: ez, 
                  overwrite: "auto",
                  onComplete: () => {
                    gsap.fromTo(item,
                      { yPercent: -travel, clipPath: `inset(${travel}% 0% 0% 0%)` },
                      { 
                        yPercent: 0, 
                        clipPath: `inset(0% 0% 0% 0%)`, 
                        duration: dur * 0.5, 
                        ease: ez 
                      }
                    );
                  }
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
                  xPercent: -travel, 
                  clipPath: `inset(0% 0% 0% ${travel}%)`, 
                  duration: dur * 0.5, 
                  delay: del, 
                  ease: ez, 
                  overwrite: "auto",
                  onComplete: () => {
                    gsap.fromTo(item,
                      { xPercent: travel, clipPath: `inset(0% ${travel}% 0% 0%)` },
                      { 
                        xPercent: 0, 
                        clipPath: `inset(0% 0% 0% 0%)`, 
                        duration: dur * 0.5, 
                        ease: ez 
                      }
                    );
                  }
                });
              } else if (!shouldCycle && currentState === "hovered") {
                item._scrollState = "resting";
                gsap.killTweensOf(item, "xPercent,clipPath");
                
                gsap.to(item, {
                  xPercent: travel, 
                  clipPath: `inset(0% ${travel}% 0% 0%)`, 
                  duration: dur * 0.5, 
                  delay: del, 
                  ease: ez, 
                  overwrite: "auto",
                  onComplete: () => {
                    gsap.fromTo(item,
                      { xPercent: -travel, clipPath: `inset(0% 0% 0% ${travel}%)` },
                      { 
                        xPercent: 0, 
                        clipPath: `inset(0% 0% 0% 0%)`, 
                        duration: dur * 0.5, 
                        ease: ez 
                      }
                    );
                  }
                });
              }
              return;
            }
            gsap.to(item, {
              ...vars, 
              duration: dur, 
              delay: del, 
              ease: ez, 
              overwrite: "auto",
              onUpdate: key === "cipher" ? cipherUpdate : undefined,
            });
          } else {
            for (const cssProp in vars) {
              const qt = item._quickTos?.[cssProp];
              if (qt) {
                qt(vars[cssProp] as any);
              } else {
                gsap.to(item, { 
                  [cssProp]: vars[cssProp], 
                  duration: dur, 
                  ease: ez, 
                  overwrite: "auto" 
                });
              }
            }
          }
        };

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

      if (pointer.current.x === lastPointer.current.x && pointer.current.y === lastPointer.current.y) {
        return;
      }

      lastPointer.current.x = pointer.current.x;
      lastPointer.current.y = pointer.current.y;

      if (!pointer.current.active || !container || skipAllAnimations) return;
      
      const cRect = container.getBoundingClientRect();
      const localX = pointer.current.x - cRect.left;
      const localY = pointer.current.y - cRect.top;

      const isBlocked = ignoreSelectors.some((sel) => (pointer.current.target as HTMLElement)?.closest?.(sel));

      if (containerBoundsRef.current && !activeGlobal) {
        const cb = containerBoundsRef.current;
        if (
          (localX < cb.left - maxDistance || localX > cb.right + maxDistance ||
           localY < cb.top - maxDistance || localY > cb.bottom + maxDistance || isBlocked) &&
          statesRef.current.every((s) => s.isOutside)
        ) return;
      }

      const toCheck = new Set<number>();
      if (activeGlobal) {
        itemsRef.current.forEach((_, i) => toCheck.add(i));
      } else {
        const CELL = 150;
        const cellRadius = Math.ceil(maxDistance / CELL);
        const cx = Math.floor(localX / CELL);
        const cy = Math.floor(localY / CELL);
        for (let ox = -cellRadius; ox <= cellRadius; ox++) {
          for (let oy = -cellRadius; oy <= cellRadius; oy++) {
            const cells = spatialGridRef.current.get(`${cx + ox},${cy + oy}`);
            if (cells) for (const idx of cells) toCheck.add(idx);
          }
        }
      }

      statesRef.current.forEach((s, i) => { if (!s.isOutside) toCheck.add(i); });

      const dData: { d: number; dx: number; dy: number }[] = itemsRef.current.map(() => ({ d: Infinity, dx: 0, dy: 0 }));
      let nearestIndex = -1;
      let minDist = Infinity;

      for (const i of toCheck) {
        const b = centersRef.current[i];
        if (!b) continue;
        const dx = localX - b.x;
        const dy = localY - b.y;
        const inside = localX >= b.left && localX <= b.right && localY >= b.top && localY <= b.bottom;
        const offScreen = (itemsRef.current[i] as ProxHTMLElement)._isProxVisible === false;
        
        const d = isBlocked || (activeExplicit && !inside) || offScreen ? Infinity : Math.sqrt(dx * dx + dy * dy);
                    
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
              "--prox-intensity": 0, duration: activeResetDuration, delay: activeResetDelay, ease: targetResetEase, overwrite: "auto",
              onComplete: () => { if (statesRef.current[i].isOutside) removeWillChange(item); },
            });
            const keys = activeOnCalculate ? ["custom"] : activePresetKeys;
            for (const k of keys) {
              if (!gr[k]) continue;
              const tl = activeTimeline?.[k] ?? {};
              applyVars(item, k, gr[k], tl.resetDuration ?? activeResetDuration, tl.resetDelay ?? activeResetDelay, EASE_MAP[tl.resetEase as string] ?? tl.resetEase ?? targetResetEase);
            }
            statesRef.current[i].isOutside = true;
            statesRef.current[i].lastIntensity = 0;
          }
          continue;
        }

        const intensity = Math.pow(Math.max(0, 1 - (d / maxDistance)), activeFalloff);
        const hasMoved = Math.abs(intensity - statesRef.current[i].lastIntensity) >= activePrecision || Math.abs(dx - statesRef.current[i].lastDx) >= 1.0;

        if (!hasMoved) continue;

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

      const onFocusIn = (e: FocusEvent) => {
        const targetNode = e.target as HTMLElement;
        const index = itemsRef.current.indexOf(targetNode as ProxHTMLElement);
        if (index !== -1 && centersRef.current[index]) {
          const b = centersRef.current[index];
          const cRect = container.getBoundingClientRect();
          upd(b.x + cRect.left, b.y + cRect.top, e.target);
        }
      };

      const handleReset = (): void => {
        pointer.current.active = false;
        itemsRef.current.forEach((item, i) => {
          const gr = resetPropsRef.current[i] ?? {};
          gsap.to(item, {
            "--prox-intensity": 0, duration: activeResetDuration, delay: activeResetDelay, ease: targetResetEase, overwrite: "auto",
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
      target.addEventListener("focusin", onFocusIn as EventListener);
      target.addEventListener("focusout", handleReset as EventListener);

      return () => {
        gsap.ticker.remove(onTick);
        target.removeEventListener("pointermove", onMove as EventListener);
        target.removeEventListener("pointerleave", handleReset as EventListener);
        target.removeEventListener("touchmove", onTMove as EventListener);
        target.removeEventListener("touchmove", onTMove as EventListener, { passive: true } as unknown as EventListenerOptions);
        target.removeEventListener("touchend", handleReset as EventListener);
        target.removeEventListener("focusin", onFocusIn as EventListener);
        target.removeEventListener("focusout", handleReset as EventListener);
        
        mediaQuery.removeEventListener("change", handleMotionChange);
        mutationObserver.disconnect();
        resizeObserver.disconnect();
        if (io) io.disconnect();
        gsap.killTweensOf(itemsRef.current);
        gsap.set(itemsRef.current, { clearProps: "transform,filter,opacity,fontVariationSettings,clipPath" });
      };
    }

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      if (io) io.disconnect();
      gsap.killTweensOf(itemsRef.current);
      gsap.set(itemsRef.current, { clearProps: "transform,filter,opacity,fontVariationSettings,clipPath" });
    };
  }, {
    dependencies:[
      selector, excludeElements, activePreset, activeNearestPreset, activeNeighborPreset,
      activeReach, activeFalloff, activeDuration, activePrecision, parsedMaxTravel, activeLockAxis,
      activeResetDuration, activeDelay, activeResetDelay, activeGlobal, activeExplicit,
      mergedBounds, activeStartStyles, activeEndStyles, parsedTargets, allPresetsStr, activeTimeline, 
      activeScrollConfig, ignoreSelectors.join(","), targetEase, targetResetEase, activeMode,
      activeScrollFocus, activeScrollStart, activeScrollEnd, memoizedStagger, memoizedResetStagger,
      memoizedDisableOnMobile, activeWaitForAnimationEnd, activeWaitForEnterAnimationEnd, activeWaitForLeaveAnimationEnd,
    ],
    scope: containerRef,
  });

  return (
    <div
      ref={containerRef}
      className={`proximity-container ${className}`.trim()}
      style={{ position: "relative", touchAction: "pan-y", ...style }}
      {...restProps}
    >
      {children}
    </div>
  );
};