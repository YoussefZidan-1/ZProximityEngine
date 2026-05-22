import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useProximityConfig } from "../core/useProximityConfig";
import { ProximityEngine } from "../core/ProximityEngine";
import { calculatePresetValues } from "../utils";
import { addWillChange, removeWillChange, parseScrollPosition, getScrollFocusValue } from "../utils/proximityHelpers";
import { PRESET_DEFAULTS, EASE_MAP, QUICK_TO_PROPS } from "../constants";
import { ProximityProps, ProxHTMLElement } from "../types";

gsap.registerPlugin(ScrollTrigger);

export const ProximityScroll: React.FC<ProximityProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = useProximityConfig(props);
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);

  useGSAP(() => {
    if (!containerRef.current) return;
    let isCancelled = false;

    const engine = new ProximityEngine(containerRef.current, config);

    // CRITICAL FIX: Guard _savedTransform to avoid race overwrites during multiple resize events.
    const onRefreshInit = () => {
      engine.items.forEach((item) => {
        if (item.style.transform && (item as any)._savedTransform === undefined) {
          (item as any)._savedTransform = item.style.transform;
          item.style.transform = "";
        }
      });
    };
    
    // CRITICAL FIX: Direct restore of transforms, followed instantly by engine.updateCenters()
    // This perfectly delegates responsive layout updates to ScrollTrigger's managed lifecycle.
    const onRefresh = () => {
      engine.items.forEach((item) => {
        if ((item as any)._savedTransform !== undefined) {
          item.style.transform = (item as any)._savedTransform;
          (item as any)._savedTransform = undefined;
        }
      });
      engine.updateCenters();
    };

    ScrollTrigger.addEventListener("refreshInit", onRefreshInit);
    ScrollTrigger.addEventListener("refresh", onRefresh);

    const getStaggerValue = (i: number, target: HTMLElement, list: HTMLElement[], staggerVal: number | gsap.StaggerVars): number => {
      if (!staggerVal) return 0;
      if (typeof staggerVal === "number") return i * staggerVal;
      return gsap.utils.distribute(staggerVal)(i, target, list);
    };

    const setupScroll = (): void => {
      if (isCancelled) return;
      scrollTriggersRef.current.forEach((t) => t.kill());
      scrollTriggersRef.current = [];

      const isTriggerMode = config.activeScrollConfig.scrub === false;
      const scrollerTarget = config.scrollerRef?.current ?? config.activeScrollConfig.scroller ?? window;
      const parsedStart = parseScrollPosition(config.activeScrollConfig.start ?? config.activeScrollStart, true);
      const parsedEnd = parseScrollPosition(config.activeScrollConfig.end ?? config.activeScrollEnd, false);
      const focusPoint = getScrollFocusValue(config.activeScrollConfig.focus ?? config.activeScrollFocus);
      const isOnce = config.activeScrollConfig.once ?? true;
      const isHorizontal = config.activeScrollConfig.horizontal ?? false;
      const isGroupTrigger = config.activeScrollConfig.triggerMode === "group";

      const animStates = engine.items.map(() => ({ isEntering: false, isLeaving: false, enterEndTime: 0, leaveEndTime: 0, queuedCall: null as gsap.core.Tween | null }));

      const executeItemEnter = (item: any, i: number, direction: number) => {
        item.dataset.proxScrollActive = "true";
        if (!engine.skipAllAnimations) addWillChange(item);
        if (!isTriggerMode) return;

        const lc = engine.targetMap.get(item);
        const localPreset = lc?.preset ?? config.activePreset;
        const localDuration = lc?.duration ?? config.activeDuration;
        const localEase = EASE_MAP[lc?.ease as string] ?? lc?.ease ?? config.targetEase;

        const dirCfg = direction > 0 ? config.activeScrollConfig.onScrollDown : config.activeScrollConfig.onScrollUp;
        let activePreset = localPreset;
        
        let activeBounds: Record<string, any> = { ...config.mergedBounds, ...(lc || {}) };
        
        let activeEase = localEase;
        let activeDuration = localDuration;

        if (dirCfg) {
          if (dirCfg.preset !== undefined) activePreset = dirCfg.preset;
          if (dirCfg.ease !== undefined) activeEase = EASE_MAP[dirCfg.ease] ?? dirCfg.ease;
          if (dirCfg.duration !== undefined) activeDuration = dirCfg.duration;
          activeBounds = { ...activeBounds, ...dirCfg };
        }

        const gp = engine.skipAllAnimations ? {} : config.activeOnCalculate ? { custom: config.activeOnCalculate(1, 0, 0, 0, true) } : calculatePresetValues(activePreset, config.allPresetsStr, 1, activeBounds, 0, 0, engine.centers[i], false, config.parsedMaxTravel, config.activeLockAxis, config.activeStartStyles, config.activeEndStyles, engine.skipAllAnimations, engine.disabledPresets);
        let maxDur = 0;
        const keys = config.activeOnCalculate ? ["custom"] : config.activePresetKeys;
        for (const key of keys) {
          const vars = gp[key]; if (!vars) continue;
          const tl = config.activeTimeline?.[key] ?? {};
          const stV = config.activeWaitForAnimationEnd ? (activeDuration + (tl.delay ?? config.activeDelay)) : config.memoizedStagger;
          const del = (tl.delay ?? config.activeDelay) + getStaggerValue(i, item, engine.items, stV);
          maxDur = Math.max(maxDur, activeDuration + del);
          engine.applyVars(item, key, vars, activeDuration, del, activeEase);
        }
        if (config.activeWaitForEnterAnimationEnd) {
          animStates[i].isEntering = true; animStates[i].enterEndTime = Date.now() + maxDur * 1000;
          gsap.delayedCall(maxDur, () => { animStates[i].isEntering = false; });
        }
      };

      const executeItemLeave = (item: any, i: number, direction: number) => {
        item.dataset.proxScrollActive = "false";
        if (!isTriggerMode || isOnce) { if (!isTriggerMode && !engine.skipAllAnimations) removeWillChange(item); return; }

        const lc = engine.targetMap.get(item);
        const localResetDuration = lc?.resetDuration ?? config.activeResetDuration;

        const dirCfg = direction > 0 ? config.activeScrollConfig.onScrollDown : config.activeScrollConfig.onScrollUp;
        let activeResetDuration = localResetDuration;
        let activeResetEase = config.targetResetEase;

        if (dirCfg) {
          if (dirCfg.resetDuration !== undefined) activeResetDuration = dirCfg.resetDuration;
          if (dirCfg.resetEase !== undefined) activeResetEase = EASE_MAP[dirCfg.resetEase] ?? dirCfg.resetEase;
        }

        const gr = engine.resetProps[i] ?? {};
        let maxWait = activeResetDuration + config.activeResetDelay;
        const keys = config.activeOnCalculate ? ["custom"] : config.activePresetKeys;
        for (const key of keys) {
          const vars = gr[key]; if (!vars) continue;
          const tl = config.activeTimeline?.[key] ?? {};
          const rsV = config.activeWaitForAnimationEnd ? (activeResetDuration + (tl.resetDelay ?? config.activeResetDelay)) : config.memoizedResetStagger;
          const del = (tl.resetDelay ?? config.activeResetDelay) + getStaggerValue(i, item, engine.items, rsV);
          maxWait = Math.max(maxWait, activeResetDuration + del);
          engine.applyVars(item, key, vars, activeResetDuration, del, activeResetEase);
        }
        if (config.activeWaitForLeaveAnimationEnd) {
          animStates[i].isLeaving = true; animStates[i].leaveEndTime = Date.now() + maxWait * 1000;
          gsap.delayedCall(maxWait, () => { animStates[i].isLeaving = false; });
        }
        if (!engine.skipAllAnimations) gsap.delayedCall(maxWait, () => { if (item.dataset.proxScrollActive !== "true") removeWillChange(item); });
      };

      // PERFORMANCE FIX: Cache shared reads
      let cachedGroupRect: DOMRect | null = null;
      let lastGroupTick = -1;

      const executeGroupUpdateTick = (self: ScrollTrigger) => {
        const vel = self.getVelocity();
        const container = engine.container as any;
        const currentSmooth = container._smoothVel ?? vel;
        const smoothedVel = currentSmooth + (vel - currentSmooth) * 0.15;
        container._smoothVel = smoothedVel;
        
        const simDy = Math.min(Math.max(smoothedVel * 0.05, -100), 100);
        const clampedVel = gsap.utils.clamp(-3000, 3000, smoothedVel);
        const normalizedVel = clampedVel / 3000;
        const absNormalizedVel = Math.abs(normalizedVel);

        // PERFORMANCE FIX: Shared viewport layout reads
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const now = gsap.ticker.frame;

        if (config.activeScrollConfig.mode === "lens") {
          if (now !== lastGroupTick) {
            cachedGroupRect = engine.container.getBoundingClientRect();
            lastGroupTick = now;
          }
        }
        const cRect = cachedGroupRect;

        engine.items.forEach((item, i) => {
          const lc = engine.targetMap.get(item);
          let activePreset = lc?.preset ?? config.activePreset;
          let activeBounds: Record<string, any> = { ...config.mergedBounds, ...(lc || {}) };
          
          const dirCfg = self.direction > 0 ? config.activeScrollConfig.onScrollDown : config.activeScrollConfig.onScrollUp;
          
          if (dirCfg) {
            if (dirCfg.preset !== undefined) activePreset = dirCfg.preset;
            activeBounds = { ...activeBounds, ...dirCfg };
          }

          let nd = 0;
          if (config.activeScrollConfig.mode === "lens" && cRect) {
            const lensCenter = config.activeScrollConfig.lensCenter ?? [0.5, 0.5];
            const lensRadius = config.activeScrollConfig.lensRadius ?? 0.35;
            
            const pxCenterX = lensCenter[0] * winW;
            const pxCenterY = lensCenter[1] * winH;
            
            const itemX = cRect.left + engine.centers[i].x;
            const itemY = cRect.top + engine.centers[i].y;
            
            const dx = itemX - pxCenterX;
            const dy = itemY - pxCenterY;
            const distPx = Math.sqrt(dx * dx + dy * dy);
            
            const maxDist = lensRadius * Math.min(winW, winH);
            const coreDist = maxDist * 0.20;
            
            if (distPx <= coreDist) {
              nd = 1;
            } else if (distPx <= maxDist) {
              nd = 1 - ((distPx - coreDist) / (maxDist - coreDist));
            }
          } else {
            const staggerVal = typeof config.activeStagger === "number" ? config.activeStagger : 0.1;
            const itemDuration = 1; 
            const totalDuration = (engine.items.length - 1) * staggerVal + itemDuration;
            const currentTime = self.progress * totalDuration;
            const itemStart = i * staggerVal;
            const itemProgress = Math.max(0, Math.min(1, (currentTime - itemStart) / itemDuration));
            
            const env = config.activeScrollConfig.envelope;
            if (env) {
              const [inEnd, outStart] = env;
              if (itemProgress <= inEnd) nd = inEnd === 0 ? 1 : itemProgress / inEnd;
              else if (itemProgress >= outStart) nd = outStart === 1 ? 1 : 1 - ((itemProgress - outStart) / (1 - outStart));
              else nd = 1;
            } else {
              if (focusPoint === 0) nd = 1 - itemProgress; 
              else if (focusPoint === 1) nd = itemProgress;
              else nd = itemProgress < focusPoint ? itemProgress / focusPoint : (1 - itemProgress) / (1 - focusPoint);
            }
          }

          const falloff = Math.max(0.01, config.activeFalloff);
          const expDenominator = 1 - Math.exp(-falloff);
          let intens = (Math.exp(-falloff * (1 - nd)) - Math.exp(-falloff)) / expDenominator;
          intens = Math.max(0, Math.min(1, intens));

          const nonQuickVars: Record<string, any> = {};
          let hasNonQuick = false;

          const velMap = config.activeScrollConfig.velocityMap;
          if (velMap && typeof velMap === "object") {
            for (const prop in velMap) {
              const bounds = velMap[prop];
              if (Array.isArray(bounds) && bounds.length === 2) {
                const [minVal, maxVal] = bounds;
                const isSigned = ["rotation", "x", "y", "skewX", "skewY", "rotate"].includes(prop);
                const factor = isSigned ? normalizedVel : absNormalizedVel;
                const targetValue = minVal + (maxVal - minVal) * factor;
                
                if (prop === "blur") {
                  nonQuickVars.filter = `${nonQuickVars.filter ?? ""} blur(${targetValue}px)`.trim();
                  hasNonQuick = true;
                } else if (prop === "brightness") {
                  nonQuickVars.filter = `${nonQuickVars.filter ?? ""} brightness(${targetValue})`.trim();
                  hasNonQuick = true;
                } else if (prop === "glow") {
                  nonQuickVars.filter = `${nonQuickVars.filter ?? ""} drop-shadow(0 0 ${targetValue}px currentColor)`.trim();
                  hasNonQuick = true;
                } else {
                  if (item._quickTos?.[prop] && QUICK_TO_PROPS.includes(prop)) {
                    item._quickTos[prop](targetValue);
                  } else {
                    nonQuickVars[prop] = targetValue;
                    hasNonQuick = true;
                  }
                }
              }
            }
          }

          const skewProp = isHorizontal ? 'skewX' : 'skewY';
          if (config.activePresetKeys.includes('velocitySkew')) {
            item._quickTos?.[skewProp]?.(normalizedVel * ((activeBounds.velocitySkew ?? PRESET_DEFAULTS.velocitySkew)[1] as number));
          }

          if (config.activePresetKeys.includes('velocityScale')) {
            const maxScale = (activeBounds.velocityScale ?? PRESET_DEFAULTS.velocityScale)[1] as number;
            const scalePropY = isHorizontal ? 'scaleX' : 'scaleY';
            const scalePropX = isHorizontal ? 'scaleY' : 'scaleX';
            item._quickTos?.[scalePropY]?.(1 + Math.abs(normalizedVel * (maxScale - 1)));
            item._quickTos?.[scalePropX]?.(1 - Math.abs(normalizedVel * (maxScale - 1) * 0.5));
          }

          const parallaxProp = isHorizontal ? 'x' : 'y';
          if (config.activePresetKeys.includes('parallax')) {
            item._quickTos?.[parallaxProp]?.(gsap.utils.interpolate(
              ((activeBounds.parallax ?? PRESET_DEFAULTS.parallax)[1] as number) * parseFloat(item.dataset.speed || "1"),
              -((activeBounds.parallax ?? PRESET_DEFAULTS.parallax)[1] as number) * parseFloat(item.dataset.speed || "1"),
              self.progress
            ));
          }

          if (Math.abs(intens - engine.states[i].lastIntensity) < config.activePrecision && Math.abs(simDy - engine.states[i].lastDy) < 1.0) return;

          engine.states[i].lastIntensity = intens; engine.states[i].lastDy = simDy;

          const gp = engine.skipAllAnimations ? {} : config.activeOnCalculate ? { custom: config.activeOnCalculate(intens, 0, 0, simDy, true) } : calculatePresetValues(activePreset, config.allPresetsStr, intens, activeBounds, 0, simDy, engine.centers[i], false, config.parsedMaxTravel, config.activeLockAxis, config.activeStartStyles, config.activeEndStyles, engine.skipAllAnimations, engine.disabledPresets);
          const keys = config.activeOnCalculate ? ["custom"] : config.activePresetKeys;

          for (const key of keys) {
            const vars = gp[key]; if (!vars) continue;
            
            const needsGsapTo = key === "cipher" || key === "reveal" || key === "scroll" || key === "cycle" || key === "cycleSide" || key === "custom" || key === "customStartEnd" || !!config.activeTimeline?.[key];

            if (needsGsapTo) {
              engine.applyVars(item, key, vars, 0.05, 0, "none");
            } else {
              for (const cssProp in vars) {
                const qt = item._quickTos?.[cssProp];
                if (qt) {
                  qt(vars[cssProp] as any);
                } else {
                  if (cssProp === "filter" && nonQuickVars.filter) {
                    nonQuickVars.filter = `${nonQuickVars.filter} ${vars[cssProp]}`;
                  } else {
                    nonQuickVars[cssProp] = vars[cssProp];
                  }
                  hasNonQuick = true;
                }
              }
            }
          }

          if (hasNonQuick) {
            gsap.set(item, nonQuickVars);
          }

          engine.setters[i].intensity(intens.toFixed(3));
        });
      };

      // PERFORMANCE FIX: Eliminate duplicate BoundingClientRect calls during parallel loops
      let cachedIndvRect: DOMRect | null = null;
      let lastIndvTick = -1;

      const executeIndividualUpdateTick = (self: ScrollTrigger, item: ProxHTMLElement, i: number) => {
        const vel = self.getVelocity();
        const currentSmooth = (item as any)._smoothVel ?? vel;
        const smoothedVel = currentSmooth + (vel - currentSmooth) * 0.15;
        (item as any)._smoothVel = smoothedVel;

        const simDy = Math.min(Math.max(smoothedVel * 0.05, -100), 100);
        const clampedVel = gsap.utils.clamp(-3000, 3000, smoothedVel);
        const normalizedVel = clampedVel / 3000;
        const absNormalizedVel = Math.abs(normalizedVel);

        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const now = gsap.ticker.frame;

        const lc = engine.targetMap.get(item);
        let activePreset = lc?.preset ?? config.activePreset;
        let activeBounds: Record<string, any> = { ...config.mergedBounds, ...(lc || {}) };
        
        const dirCfg = self.direction > 0 ? config.activeScrollConfig.onScrollDown : config.activeScrollConfig.onScrollUp;
        
        if (dirCfg) {
          if (dirCfg.preset !== undefined) activePreset = dirCfg.preset;
          activeBounds = { ...activeBounds, ...dirCfg };
        }

        let nd = 0;
        if (config.activeScrollConfig.mode === "lens") {
          if (now !== lastIndvTick) {
            cachedIndvRect = engine.container.getBoundingClientRect();
            lastIndvTick = now;
          }
          const cRect = cachedIndvRect!;

          const lensCenter = config.activeScrollConfig.lensCenter ?? [0.5, 0.5];
          const lensRadius = config.activeScrollConfig.lensRadius ?? 0.35;
          
          const pxCenterX = lensCenter[0] * winW;
          const pxCenterY = lensCenter[1] * winH;
          
          const itemX = cRect.left + engine.centers[i].x;
          const itemY = cRect.top + engine.centers[i].y;
          
          const dx = itemX - pxCenterX;
          const dy = itemY - pxCenterY;
          const distPx = Math.sqrt(dx * dx + dy * dy);
          
          const maxDist = lensRadius * Math.min(winW, winH);
          const coreDist = maxDist * 0.20;
          
          if (distPx <= coreDist) {
            nd = 1;
          } else if (distPx <= maxDist) {
            nd = 1 - ((distPx - coreDist) / (maxDist - coreDist));
          }
        } else {
          const env = config.activeScrollConfig.envelope;
          if (env) {
            const [inEnd, outStart] = env;
            if (self.progress <= inEnd) nd = inEnd === 0 ? 1 : self.progress / inEnd;
            else if (self.progress >= outStart) nd = outStart === 1 ? 1 : 1 - ((self.progress - outStart) / (1 - outStart));
            else nd = 1;
          } else {
            if (focusPoint === 0) nd = 1 - self.progress; 
            else if (focusPoint === 1) nd = self.progress;
            else nd = self.progress < focusPoint ? self.progress / focusPoint : (1 - self.progress) / (1 - focusPoint);
          }
        }

        const falloff = Math.max(0.01, config.activeFalloff);
        const expDenominator = 1 - Math.exp(-falloff);
        let intens = (Math.exp(-falloff * (1 - nd)) - Math.exp(-falloff)) / expDenominator;
        intens = Math.max(0, Math.min(1, intens));

        const nonQuickVars: Record<string, any> = {};
        let hasNonQuick = false;

        const velMap = config.activeScrollConfig.velocityMap;
        if (velMap && typeof velMap === "object") {
          for (const prop in velMap) {
            const bounds = velMap[prop];
            if (Array.isArray(bounds) && bounds.length === 2) {
              const [minVal, maxVal] = bounds;
              const isSigned = ["rotation", "x", "y", "skewX", "skewY", "rotate"].includes(prop);
              const factor = isSigned ? normalizedVel : absNormalizedVel;
              const targetValue = minVal + (maxVal - minVal) * factor;
              
              if (prop === "blur") {
                nonQuickVars.filter = `${nonQuickVars.filter ?? ""} blur(${targetValue}px)`.trim();
                hasNonQuick = true;
              } else if (prop === "brightness") {
                nonQuickVars.filter = `${nonQuickVars.filter ?? ""} brightness(${targetValue})`.trim();
                hasNonQuick = true;
              } else if (prop === "glow") {
                nonQuickVars.filter = `${nonQuickVars.filter ?? ""} drop-shadow(0 0 ${targetValue}px currentColor)`.trim();
                hasNonQuick = true;
              } else {
                if (item._quickTos?.[prop] && QUICK_TO_PROPS.includes(prop)) {
                  item._quickTos[prop](targetValue);
                } else {
                  nonQuickVars[prop] = targetValue;
                  hasNonQuick = true;
                }
              }
            }
          }
        }

        const skewProp = isHorizontal ? 'skewX' : 'skewY';
        if (config.activePresetKeys.includes('velocitySkew')) {
          item._quickTos?.[skewProp]?.(normalizedVel * ((activeBounds.velocitySkew ?? PRESET_DEFAULTS.velocitySkew)[1] as number));
        }

        if (config.activePresetKeys.includes('velocityScale')) {
          const maxScale = (activeBounds.velocityScale ?? PRESET_DEFAULTS.velocityScale)[1] as number;
          const scalePropY = isHorizontal ? 'scaleX' : 'scaleY';
          const scalePropX = isHorizontal ? 'scaleY' : 'scaleX';
          item._quickTos?.[scalePropY]?.(1 + Math.abs(normalizedVel * (maxScale - 1)));
          item._quickTos?.[scalePropX]?.(1 - Math.abs(normalizedVel * (maxScale - 1) * 0.5));
        }

        const parallaxProp = isHorizontal ? 'x' : 'y';
        if (config.activePresetKeys.includes('parallax')) {
          item._quickTos?.[parallaxProp]?.(gsap.utils.interpolate(
            ((activeBounds.parallax ?? PRESET_DEFAULTS.parallax)[1] as number) * parseFloat(item.dataset.speed || "1"),
            -((activeBounds.parallax ?? PRESET_DEFAULTS.parallax)[1] as number) * parseFloat(item.dataset.speed || "1"),
            self.progress
          ));
        }

        if (Math.abs(intens - engine.states[i].lastIntensity) < config.activePrecision && Math.abs(simDy - engine.states[i].lastDy) < 1.0) return;

        engine.states[i].lastIntensity = intens; engine.states[i].lastDy = simDy;

        const gp = engine.skipAllAnimations ? {} : config.activeOnCalculate ? { custom: config.activeOnCalculate(intens, 0, 0, simDy, true) } : calculatePresetValues(activePreset, config.allPresetsStr, intens, activeBounds, 0, simDy, engine.centers[i], false, config.parsedMaxTravel, config.activeLockAxis, config.activeStartStyles, config.activeEndStyles, engine.skipAllAnimations, engine.disabledPresets);
        const keys = config.activeOnCalculate ? ["custom"] : config.activePresetKeys;

        for (const key of keys) {
          const vars = gp[key]; if (!vars) continue;
          
          const needsGsapTo = key === "cipher" || key === "reveal" || key === "scroll" || key === "cycle" || key === "cycleSide" || key === "custom" || key === "customStartEnd" || !!config.activeTimeline?.[key];

          if (needsGsapTo) {
            engine.applyVars(item, key, vars, 0.05, 0, "none");
          } else {
            for (const cssProp in vars) {
              const qt = item._quickTos?.[cssProp];
              if (qt) {
                qt(vars[cssProp] as any);
              } else {
                if (cssProp === "filter" && nonQuickVars.filter) {
                  nonQuickVars.filter = `${nonQuickVars.filter} ${vars[cssProp]}`;
                } else {
                  nonQuickVars[cssProp] = vars[cssProp];
                }
                hasNonQuick = true;
              }
            }
          }
        }

        if (hasNonQuick) {
          gsap.set(item, nonQuickVars);
        }

        engine.setters[i].intensity(intens.toFixed(3));
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

      if (isGroupTrigger) {
        scrollTriggersRef.current.push(ScrollTrigger.create({
          trigger: containerRef.current, scroller: scrollerTarget, pin: config.activeScrollConfig.pin, pinSpacing: config.activeScrollConfig.pinSpacing,
          start: parsedStart, end: parsedEnd, scrub: isTriggerMode ? false : config.activeScrub, once: isOnce, markers: config.activeScrollConfig.markers ?? false,
          horizontal: isHorizontal,
          onEnter: (self) => {
            engine.items.forEach((item, i) => {
              guarded(() => executeItemEnter(item, i, self.direction), config.activeWaitForLeaveAnimationEnd ?? false, false, i);
            });
          },
          onLeave: (self) => {
            engine.items.forEach((item, i) => {
              guarded(() => executeItemLeave(item, i, self.direction), false, config.activeWaitForEnterAnimationEnd ?? false, i);
            });
          },
          onEnterBack: (self) => {
            engine.items.forEach((item, i) => {
              guarded(() => executeItemEnter(item, i, self.direction), config.activeWaitForLeaveAnimationEnd ?? false, false, i);
            });
          },
          onLeaveBack: (self) => {
            engine.items.forEach((item, i) => {
              guarded(() => executeItemLeave(item, i, self.direction), false, config.activeWaitForEnterAnimationEnd ?? false, i);
            });
          },
          onUpdate: isTriggerMode ? undefined : executeGroupUpdateTick,
        }));
      } else {
        engine.items.forEach((item, i) => {
          scrollTriggersRef.current.push(ScrollTrigger.create({
            trigger: item, scroller: scrollerTarget, pin: config.activeScrollConfig.pin, pinSpacing: config.activeScrollConfig.pinSpacing,
            start: parsedStart, end: parsedEnd, scrub: isTriggerMode ? false : config.activeScrub, once: isOnce, markers: config.activeScrollConfig.markers ?? false,
            horizontal: isHorizontal,
            onEnter: (self) => guarded(() => executeItemEnter(item, i, self.direction), config.activeWaitForLeaveAnimationEnd ?? false, false, i),
            onLeave: (self) => guarded(() => executeItemLeave(item, i, self.direction), false, config.activeWaitForEnterAnimationEnd ?? false, i),
            onEnterBack: (self) => guarded(() => executeItemEnter(item, i, self.direction), config.activeWaitForLeaveAnimationEnd ?? false, false, i),
            onLeaveBack: (self) => guarded(() => executeItemLeave(item, i, self.direction), false, config.activeWaitForEnterAnimationEnd ?? false, i),
            onUpdate: isTriggerMode ? undefined : (self) => executeIndividualUpdateTick(self, item, i),
          }));
        });
      }

      // CRITICAL FIX: Ensure triggers added after the parent structure is built are forced into correct execution order
      ScrollTrigger.sort();
    };

    engine.onItemsChanged = () => {
      if (!isCancelled) setupScroll();
    };

    if (document.fonts) document.fonts.ready.then(() => engine.setup()); else engine.setup();

    return () => {
      isCancelled = true;
      engine.destroy();
      ScrollTrigger.removeEventListener("refreshInit", onRefreshInit);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      scrollTriggersRef.current.forEach((t) => t.kill());
    };
  }, { dependencies: config.deps, scope: containerRef });

  return (
    <div ref={containerRef} className={`proximity-container ${config.className}`.trim()} style={{ position: "relative", touchAction: "auto", ...config.style }} {...config.restProps}>
      {config.children}
    </div>
  );
};