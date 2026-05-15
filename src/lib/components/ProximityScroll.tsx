import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useProximityConfig } from "../core/useProximityConfig";
import { ProximityEngine } from "../core/ProximityEngine";
import { calculatePresetValues } from "../utils";
import { addWillChange, removeWillChange, parseScrollPosition, getScrollFocusValue } from "../utils/proximityHelpers";
import { PRESET_DEFAULTS, EASE_MAP } from "../constants";
import { ProximityProps } from "../types";

export const ProximityScroll: React.FC<ProximityProps> = (props) => {
  gsap.registerPlugin(ScrollTrigger);

  const containerRef = useRef<HTMLDivElement>(null);
  const config = useProximityConfig(props);
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);

  useGSAP(() => {
    if (!containerRef.current) return;
    const engine = new ProximityEngine(containerRef.current, config);
    engine.setup();
    let isCancelled = false;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    const onScroll = (): void => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(engine.updateCenters, 100);
    };
    const scrollListenTarget = config.scrollerRef?.current;
    if (scrollListenTarget && scrollListenTarget !== (window as unknown) && scrollListenTarget !== document.documentElement && scrollListenTarget !== document.body) {
      scrollListenTarget.addEventListener("scroll", onScroll as EventListener, { passive: true });
    }

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

      const animStates = engine.items.map(() => ({ isEntering: false, isLeaving: false, enterEndTime: 0, leaveEndTime: 0, queuedCall: null as gsap.core.Tween | null }));

      engine.items.forEach((item, i) => {
        const lc = engine.targetMap.get(item);
        const localPreset = lc?.preset ?? config.activePreset;
        const localDuration = lc?.duration ?? config.activeDuration;
        const localResetDuration = lc?.resetDuration ?? config.activeResetDuration;
        const localEase = EASE_MAP[lc?.ease as string] ?? lc?.ease ?? config.targetEase;

        const runEnter = (): void => {
          item.dataset.proxScrollActive = "true";
          if (!engine.skipAllAnimations) addWillChange(item);
          if (!isTriggerMode) return;

          const gp = engine.skipAllAnimations ? {} : config.activeOnCalculate ? { custom: config.activeOnCalculate(1, 0, 0, 0, true) } : calculatePresetValues(localPreset, config.allPresetsStr, 1, config.mergedBounds, 0, 0, engine.centers[i], false, config.parsedMaxTravel, config.activeLockAxis, config.activeStartStyles, config.activeEndStyles, engine.skipAllAnimations, engine.disabledPresets);
          let maxDur = 0;
          const keys = config.activeOnCalculate ? ["custom"] : config.activePresetKeys;
          for (const key of keys) {
            const vars = gp[key]; if (!vars) continue;
            const tl = config.activeTimeline?.[key] ?? {};
            const stV = config.activeWaitForAnimationEnd ? (localDuration + (tl.delay ?? config.activeDelay)) : config.memoizedStagger;
            const del = (tl.delay ?? config.activeDelay) + getStaggerValue(i, item, engine.items, stV);
            maxDur = Math.max(maxDur, localDuration + del);
            engine.applyVars(item, key, vars, localDuration, del, localEase);
          }
          if (config.activeWaitForEnterAnimationEnd) {
            animStates[i].isEntering = true; animStates[i].enterEndTime = Date.now() + maxDur * 1000;
            gsap.delayedCall(maxDur, () => { animStates[i].isEntering = false; });
          }
        };

        const runLeave = (): void => {
          item.dataset.proxScrollActive = "false";
          if (!isTriggerMode || isOnce) { if (!isTriggerMode && !engine.skipAllAnimations) removeWillChange(item); return; }

          const gr = engine.resetProps[i] ?? {};
          let maxWait = localResetDuration + config.activeResetDelay;
          const keys = config.activeOnCalculate ? ["custom"] : config.activePresetKeys;
          for (const key of keys) {
            const vars = gr[key]; if (!vars) continue;
            const tl = config.activeTimeline?.[key] ?? {};
            const rsV = config.activeWaitForAnimationEnd ? (localResetDuration + (tl.resetDelay ?? config.activeResetDelay)) : config.memoizedResetStagger;
            const del = (tl.resetDelay ?? config.activeResetDelay) + getStaggerValue(i, item, engine.items, rsV);
            maxWait = Math.max(maxWait, localResetDuration + del);
            engine.applyVars(item, key, vars, localResetDuration, del, config.targetResetEase);
          }
          if (config.activeWaitForLeaveAnimationEnd) {
            animStates[i].isLeaving = true; animStates[i].leaveEndTime = Date.now() + maxWait * 1000;
            gsap.delayedCall(maxWait, () => { animStates[i].isLeaving = false; });
          }
          if (!engine.skipAllAnimations) gsap.delayedCall(maxWait, () => { if (item.dataset.proxScrollActive !== "true") removeWillChange(item); });
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
          trigger: item, scroller: scrollerTarget, pin: config.activeScrollConfig.pin, pinSpacing: config.activeScrollConfig.pinSpacing,
          start: parsedStart, end: parsedEnd, scrub: isTriggerMode ? false : config.activeScrub, once: isOnce, markers: config.activeScrollConfig.markers ?? false,
          onEnter: () => guarded(runEnter, config.activeWaitForLeaveAnimationEnd ?? false, false, i),
          onLeave: () => guarded(runLeave, false, config.activeWaitForEnterAnimationEnd ?? false, i),
          onEnterBack: () => guarded(runEnter, config.activeWaitForLeaveAnimationEnd ?? false, false, i),
          onLeaveBack: () => guarded(runLeave, false, config.activeWaitForEnterAnimationEnd ?? false, i),
          onUpdate: isTriggerMode ? undefined : (self) => {
            let nd = 0; const env = config.activeScrollConfig.envelope;
            if (env) {
              const [inEnd, outStart] = env;
              if (self.progress <= inEnd) nd = inEnd === 0 ? 1 : self.progress / inEnd;
              else if (self.progress >= outStart) nd = outStart === 1 ? 1 : 1 - ((self.progress - outStart) / (1 - outStart));
              else nd = 1;
            } else {
              if (focusPoint === 0) nd = 1 - self.progress; else if (focusPoint === 1) nd = self.progress;
              else nd = self.progress < focusPoint ? self.progress / focusPoint : (1 - self.progress) / (1 - focusPoint);
            }
            const intens = Math.pow(nd, config.activeFalloff);
            const vel = self.getVelocity();
            const simDy = Math.min(Math.max(vel * 0.05, -100), 100);

            const clampedVel = gsap.utils.clamp(-3000, 3000, vel);
            const normalizedVel = clampedVel / 3000;
            if (config.activePresetKeys.includes('velocitySkew')) item._quickTos?.skewY?.(normalizedVel * ((config.mergedBounds.velocitySkew ?? PRESET_DEFAULTS.velocitySkew)[1] as number));
            if (config.activePresetKeys.includes('velocityScale')) {
              const maxScale = (config.mergedBounds.velocityScale ?? PRESET_DEFAULTS.velocityScale)[1] as number;
              item._quickTos?.scaleY?.(1 + Math.abs(normalizedVel * (maxScale - 1)));
              item._quickTos?.scaleX?.(1 - Math.abs(normalizedVel * (maxScale - 1) * 0.5));
            }
            if (config.activePresetKeys.includes('parallax')) item._quickTos?.y?.(gsap.utils.interpolate(((config.mergedBounds.parallax ?? PRESET_DEFAULTS.parallax)[1] as number) * parseFloat(item.dataset.speed || "1"), -((config.mergedBounds.parallax ?? PRESET_DEFAULTS.parallax)[1] as number) * parseFloat(item.dataset.speed || "1"), self.progress));

            if (Math.abs(intens - engine.states[i].lastIntensity) < config.activePrecision && Math.abs(simDy - engine.states[i].lastDy) < 1.0) return;

            engine.states[i].lastIntensity = intens; engine.states[i].lastDy = simDy;

            const gp = engine.skipAllAnimations ? {} : config.activeOnCalculate ? { custom: config.activeOnCalculate(intens, 0, 0, simDy, true) } : calculatePresetValues(localPreset, config.allPresetsStr, intens, config.mergedBounds, 0, simDy, engine.centers[i], false, config.parsedMaxTravel, config.activeLockAxis, config.activeStartStyles, config.activeEndStyles, engine.skipAllAnimations, engine.disabledPresets);
            const keys = config.activeOnCalculate ? ["custom"] : config.activePresetKeys;
            for (const key of keys) {
              const vars = gp[key]; if (!vars) continue;
              const tl = config.activeTimeline?.[key] ?? {};
              engine.applyVars(item, key, vars, tl.duration ?? 0.1, tl.delay ?? 0, EASE_MAP[tl.ease as string] ?? tl.ease ?? "none");
            }
            engine.setters[i].intensity(intens.toFixed(3));
          },
        }));
      });
    };

    if (document.fonts) document.fonts.ready.then(setupScroll); else setupScroll();

    return () => {
      isCancelled = true;
      engine.destroy();
      if (scrollListenTarget && scrollListenTarget !== (window as unknown) && scrollListenTarget !== document.documentElement && scrollListenTarget !== document.body) {
        scrollListenTarget.removeEventListener("scroll", onScroll as EventListener);
      }
      clearTimeout(scrollTimeout!);
      scrollTriggersRef.current.forEach((t) => t.kill());
    };
  }, { dependencies: config.deps, scope: containerRef });

  return (
    <div ref={containerRef} className={`proximity-container ${config.className}`.trim()} style={{ position: "relative", touchAction: "auto", ...config.style }} {...config.restProps}>
      {config.children}
    </div>
  );
};