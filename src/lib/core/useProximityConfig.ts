// src/lib/core/useProximityConfig.ts
import { useMemo } from "react";
import { useDeepMemo } from "../hooks";
import { FILTER_PRESETS, EASE_MAP } from "../constants";
import { ProximityProps, ProximityScrollConfig } from "../types";

export function useProximityConfig(props: ProximityProps) {
  const {
    children, selector = ".prox-item", config = {}, preset = "", nearestPreset = "", neighborPreset = "",
    reach = 2, falloff = 2.4, duration = 0.2, resetDuration = 0.4, global = false, explicit = false,
    mode = "pointer", scrollerRef, scrollFocus = "center", scrollStart = "top bottom", scrollEnd = "bottom top",
    lockAxis, precision = 0.002, maxTravel, onCalculate, onReset, ease, resetEase, disableOnMobile,
    waitForAnimationEnd, waitForEnterAnimationEnd, waitForLeaveAnimationEnd, scale, flexScale, y, x, opacity, blur, rotate, weight, skew,
    magnetic, tilt, tiltCard, repel, cipher, reveal, scroll, color, background, glow, brightness, contrast,
    borderRadius, letterSpacing, grayScale, parallax, velocitySkew, velocityScale, timeline, delay, resetDelay, scrub, resetScrub,
    start, end, stagger, resetStagger, targets, ignoreSelectors = [], excludeElements, className = "", style = {}, ...restProps
  } = props;

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
    scale: config.scale ?? scale, flexScale: config.flexScale ?? flexScale, y: config.y ?? y, x: config.x ?? x,
    opacity: config.opacity ?? opacity, blur: config.blur ?? blur, rotate: config.rotate ?? rotate, weight: config.weight ?? weight,
    skew: config.skew ?? skew, magnetic: config.magnetic ?? magnetic, tilt: config.tilt ?? tilt, tiltCard: config.tiltCard ?? tiltCard,
    repel: config.repel ?? repel, cipher: config.cipher ?? cipher, reveal: config.reveal ?? reveal,
    scroll: Array.isArray(config.scroll) ? config.scroll : (Array.isArray(scroll) ? scroll : undefined),
    parallax: config.parallax ?? parallax, velocitySkew: config.velocitySkew ?? velocitySkew, velocityScale: config.velocityScale ?? velocityScale,
    color: config.color ?? color, background: config.background ?? background, glow: config.glow ?? glow,
    brightness: config.brightness ?? brightness, contrast: config.contrast ?? contrast, borderRadius: config.borderRadius ?? borderRadius,
    letterSpacing: config.letterSpacing ?? letterSpacing, grayScale: config.grayScale ?? grayScale,
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
    const base = [activePreset, activeNearestPreset, activeNeighborPreset].filter(Boolean).flatMap((p) => p.split("-"));
    const tgt = parsedTargets.flatMap((t) => [t.preset, t.nearestPreset, t.neighborPreset]).filter(Boolean).flatMap((p) => (p as string).split("-"));
    return Array.from(new Set([...base, ...tgt])).join("-");
  }, [activePreset, activeNearestPreset, activeNeighborPreset, parsedTargets]);

  const activePresetKeys = useMemo(() => {
    const keys = new Set<string>();
    allPresetsStr.split("-").forEach((k) => {
      if (!k) return;
      if (FILTER_PRESETS.has(k)) keys.add("_filters");
      else keys.add(k);
    });
    if (Object.keys(activeStartStyles).length > 0 || Object.keys(activeEndStyles).length > 0) keys.add("customStartEnd");
    if (activeOnCalculate) keys.add("custom");
    return Array.from(keys);
  }, [allPresetsStr, activeStartStyles, activeEndStyles, activeOnCalculate]);

  const deps = [
    selector, excludeElements, activePreset, activeNearestPreset, activeNeighborPreset,
    activeReach, activeFalloff, activeDuration, activePrecision, parsedMaxTravel, activeLockAxis,
    activeResetDuration, activeDelay, activeResetDelay, activeGlobal, activeExplicit,
    mergedBounds, activeStartStyles, activeEndStyles, parsedTargets, allPresetsStr, activeTimeline, 
    activeScrollConfig, ignoreSelectors.join(","), targetEase, targetResetEase, activeMode,
    activeScrollFocus, activeScrollStart, activeScrollEnd, memoizedStagger, memoizedResetStagger,
    memoizedDisableOnMobile, activeWaitForAnimationEnd, activeWaitForEnterAnimationEnd, activeWaitForLeaveAnimationEnd,
  ];

  return {
    selector, excludeElements, ignoreSelectors, className, style, children, scrollerRef, restProps,
    activeMode, activeReach, activeFalloff, activeDuration, activeResetDuration, activeDelay, activeResetDelay,
    activeGlobal, activeExplicit, activePreset, activeNearestPreset, activeNeighborPreset, activeMaxTravel,
    activeLockAxis, activePrecision, activeOnCalculate, activeOnReset, activeTargets, activeScrollStart,
    activeScrollEnd, activeScrollFocus, activeDisableOnMobile, activeWaitForAnimationEnd, activeWaitForEnterAnimationEnd,
    activeWaitForLeaveAnimationEnd, activeStagger, activeResetStagger, activeScrub, targetEase, targetResetEase,
    mergedBounds, activeTimeline, activeScrollConfig, activeStartStyles, activeEndStyles, parsedMaxTravel,
    parsedTargets, memoizedStagger, memoizedResetStagger, memoizedDisableOnMobile, allPresetsStr, activePresetKeys, deps
  };
}