import React, { useRef, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDeepMemo } from "../hooks";
import { calculatePresetValues, cipherUpdate } from "../utils";
import { addWillChange, removeWillChange, parseScrollPosition, getScrollFocusValue } from "../utils/proximityHelpers";
import { PRESET_DEFAULTS, EASE_MAP, FILTER_PRESETS, QUICK_TO_PROPS } from "../constants";
import { 
  ProximityProps, ProxHTMLElement, ItemCenter, ItemState, ItemSetters, 
  ContainerBounds, ProximityTargetOverride, ProximityScrollConfig
} from "../types";

gsap.registerPlugin(ScrollTrigger);

export const ProximityScroll: React.FC<ProximityProps> = ({
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

    let isCancelled = false;
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
          left: rect.left - cRect.left, right: rect.right - cRect.left,
          top: rect.top - cRect.top, bottom: rect.bottom - cRect.top,
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

        
        item._quickTos = {};
        item._scrollState = "resting";
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
      i: number, target: HTMLElement, list: HTMLElement[], staggerVal: number | gsap.StaggerVars
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
      ez: string
    ): void => {
      const needsGsapTo =
        key === "cipher" ||
        key === "reveal" ||
        key === "scroll" ||
        key === "cycle" ||
        key === "cycleSide" ||
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
        const nonQuickVars: Record<string, any> = {};
        let hasNonQuick = false;
    
        for (const cssProp in vars) {
          const qt = item._quickTos?.[cssProp];
          if (qt) {
            qt(vars[cssProp] as any);
          } else {
            nonQuickVars[cssProp] = vars[cssProp];
            hasNonQuick = true;
          }
        }
    
        if (hasNonQuick) {
          gsap.to(item, {
            ...nonQuickVars, 
            duration: dur, 
            ease: ez, 
            overwrite: "auto" 
          });
        }
      }
    };

    const setupScroll = (): void => {
      if (isCancelled) return;
      initItems();
      scrollTriggersRef.current.forEach((t) => t.kill());
      scrollTriggersRef.current = [];

      const isTriggerMode = activeScrollConfig.scrub === false;
      const scrollerTarget = scrollerRef?.current ?? activeScrollConfig.scroller ?? window;
      const parsedStart = parseScrollPosition(activeScrollConfig.start ?? activeScrollStart, true);
      const parsedEnd = parseScrollPosition(activeScrollConfig.end ?? activeScrollEnd, false);
      const focusPoint = getScrollFocusValue(activeScrollConfig.focus ?? activeScrollFocus);
      const isOnce = activeScrollConfig.once ?? true;

      const animStates = itemsRef.current.map(() => ({
        isEntering: false, isLeaving: false, enterEndTime: 0, leaveEndTime: 0, queuedCall: null as gsap.core.Tween | null,
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
          pin: activeScrollConfig.pin,
          pinSpacing: activeScrollConfig.pinSpacing,
          start: parsedStart, end: parsedEnd,
          scrub: isTriggerMode ? false : activeScrub,
          once: isOnce, markers: activeScrollConfig.markers ?? false,
          onEnter: () => guarded(runEnter, activeWaitForLeaveAnimationEnd ?? false, false, i),
          onLeave: () => guarded(runLeave, false, activeWaitForEnterAnimationEnd ?? false, i),
          onEnterBack: () => guarded(runEnter, activeWaitForLeaveAnimationEnd ?? false, false, i),
          onLeaveBack: () => guarded(runLeave, false, activeWaitForEnterAnimationEnd ?? false, i),
          onUpdate: isTriggerMode ? undefined : (self) => {
            let nd = 0;
            const env = activeScrollConfig.envelope;
            
            if (env) {
              const [inEnd, outStart] = env;
              if (self.progress <= inEnd) {
                nd = inEnd === 0 ? 1 : self.progress / inEnd;
              } else if (self.progress >= outStart) {
                nd = outStart === 1 ? 1 : 1 - ((self.progress - outStart) / (1 - outStart));
              } else {
                nd = 1;
              }
            } else {
              if (focusPoint === 0) nd = 1 - self.progress;
              else if (focusPoint === 1) nd = self.progress;
              else nd = self.progress < focusPoint ? self.progress / focusPoint : (1 - self.progress) / (1 - focusPoint);
            }

            const intens = Math.pow(nd, activeFalloff);
            const vel = self.getVelocity();
            const simDy = Math.min(Math.max(vel * 0.05, -100), 100);

            // Velocity & Parallax Awwwards Upgrades
            const clampedVel = gsap.utils.clamp(-3000, 3000, vel);
            const normalizedVel = clampedVel / 3000;
            
            if (activePresetKeys.includes('velocitySkew')) {
              const maxSkew = (mergedBounds.velocitySkew ?? PRESET_DEFAULTS.velocitySkew)[1] as number;
              item._quickTos?.skewY?.(normalizedVel * maxSkew);
            }
            if (activePresetKeys.includes('velocityScale')) {
              const maxScale = (mergedBounds.velocityScale ?? PRESET_DEFAULTS.velocityScale)[1] as number;
              const scaleDiff = maxScale - 1;
              item._quickTos?.scaleY?.(1 + Math.abs(normalizedVel * scaleDiff));
              item._quickTos?.scaleX?.(1 - Math.abs(normalizedVel * scaleDiff * 0.5));
            }
            if (activePresetKeys.includes('parallax')) {
              const maxTravel = (mergedBounds.parallax ?? PRESET_DEFAULTS.parallax)[1] as number;
              const speed = parseFloat(item.dataset.speed || "1");
              const yOffset = gsap.utils.interpolate(maxTravel * speed, -maxTravel * speed, self.progress);
              item._quickTos?.y?.(yOffset);
            }

            if (Math.abs(intens - statesRef.current[i].lastIntensity) < activePrecision && Math.abs(simDy - statesRef.current[i].lastDy) < 1.0) return;

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
      style={{ position: "relative", touchAction: "auto", ...style }}
      {...restProps}
    >
      {children}
    </div>
  );
};