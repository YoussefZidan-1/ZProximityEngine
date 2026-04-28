import React, { useRef, useMemo, ReactNode, CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * EXPORTED TYPES FOR LIBRARY USAGE
 */
export type EasePreset = 
  | "smooth" | "heavy" | "sharp" | "fluid" | "bouncy" | "elastic" 
  | "jello" | "bounce" | "swing" | "vibrate" | "robot" | "ghost" 
  | "expo" | "circus" | "glitch" | "slowmo" | (string & {});

export interface ProximityConfig {
  reach?: number;
  falloff?: number;
  duration?: number;
  resetDuration?: number;
  global?: boolean;
  preset?: string;
  ease?: EasePreset;
  resetEase?: EasePreset;
  scale?: [number, number];
  y?:[number, number];
  opacity?: [number, number];
  blur?: [number, number];
  rotate?: [number, number];
  weight?: [number, number];
  onCalculate?: (intensity: number, distance: number) => gsap.TweenVars;
  onReset?: () => gsap.TweenVars;
}

export interface ProximityProps extends ProximityConfig {
  children: ReactNode;
  selector?: string;
  config?: ProximityConfig;
  ignoreSelectors?: string[];
  excludeElements?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * CONSTANTS & MAPS
 */
const PRESET_DEFAULTS: Record<string, [number, number]> = {
  scale: [1, 1.5],
  y: [0, -30],
  opacity: [0.2, 1],
  blur: [8, 0],
  rotate:[0, 90],
  weight: [100, 900],
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
  slowmo: "slow(0.7, 0.7, false)"
};

/**
 * HELPER: CALCULATION ENGINE
 */
const calculatePresetValues = (
  presetString: string, 
  intensity: number, 
  userConfig: Record<string, [number, number] | undefined>, 
  isReset: boolean = false
): gsap.TweenVars => {
  const props = presetString.split("-");
  const result: gsap.TweenVars = {};

  props.forEach((prop) => {
    const bounds = userConfig[prop] || PRESET_DEFAULTS[prop];
    if (!bounds) return;

    const [base, max] = bounds;
    const currentValue = isReset ? base : base + (max - base) * intensity;

    if (prop === "blur") {
      result.filter = `blur(${currentValue}px)`;
    } else if (prop === "weight") {
      const weightVal = Math.round(currentValue);
      result.fontWeight = weightVal;
      result.fontVariationSettings = `'wght' ${weightVal}`;
    } else if (prop === "rotate") {
      result.rotation = currentValue;
    } else {
      result[prop] = currentValue;
    }
  });

  return result;
};

export const Proximity: React.FC<ProximityProps> = ({
  children,
  selector = ".prox-item",
  config = {},
  preset = "",
  reach = 2,
  falloff = 2.4,
  duration = 0.2,
  resetDuration = 0.4,
  global = false,
  onCalculate,
  onReset,
  ease,
  resetEase,
  scale,
  y,
  opacity,
  blur,
  rotate,
  weight,
  ignoreSelectors =[],
  excludeElements,
  className = "",
  style = {},
  ...restProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track Mouse/Touch coords
  const pointer = useRef({ x: 0, y: 0, target: null as EventTarget | null, active: false });

  // Resolve config with fallbacks
  const activeReach = config.reach ?? reach;
  const activeFalloff = config.falloff ?? falloff;
  const activeDuration = config.duration ?? duration;
  const activeResetDuration = config.resetDuration ?? resetDuration;
  const activeGlobal = config.global ?? global;
  const activePreset = config.preset ?? preset;
  const activeOnCalculate = config.onCalculate ?? onCalculate;
  const activeOnReset = config.onReset ?? onReset;

  const targetEase = EASE_MAP[config.ease ?? (ease as string)] || config.ease || ease || "power1.out";
  const targetResetEase = EASE_MAP[config.resetEase ?? (resetEase as string)] || config.resetEase || resetEase || "power2.out";

  // PERFORMANCE OPTIMIZATION 1: Memoize merged bounds so React doesn't recreate arrays on every render
  const mergedBoundsStr = JSON.stringify({
    scale: config.scale ?? scale,
    y: config.y ?? y,
    opacity: config.opacity ?? opacity,
    blur: config.blur ?? blur,
    rotate: config.rotate ?? rotate,
    weight: config.weight ?? weight,
  });
  
  const mergedBounds = useMemo(() => JSON.parse(mergedBoundsStr), [mergedBoundsStr]);

  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    
    const container = containerRef.current;
    if (!container) return;

    let items: HTMLElement[] =[];
    let states: { isOutside: boolean; lastIntensity: number }[] =[];
    let centers: { left: number; right: number; top: number; bottom: number; x: number; y: number }[] =[];
    
    let setters: { 
      intensity: (val: string | number) => void; 
      dx: (val: string | number) => void; 
      dy: (val: string | number) => void; 
    }[] =[];

    const updateCenters = () => {
      centers = items.map((item) => {
        const rect = item.getBoundingClientRect();
        return {
          left: rect.left + window.scrollX,
          right: rect.right + window.scrollX,
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY,
          x: rect.left + window.scrollX + rect.width / 2,
          y: rect.top + window.scrollY + rect.height / 2,
        };
      });
    };

    const setInitialState = () => {
      const initialProps = activeOnReset ? activeOnReset() : (activePreset ? calculatePresetValues(activePreset, 0, mergedBounds, true) : {});
      initialProps.willChange = "transform, filter, opacity, font-variation-settings";
      if (Object.keys(initialProps).length > 0 && items.length > 0) gsap.set(items, initialProps);
    };

    const initItems = () => {
      if (items.length > 0) gsap.killTweensOf(items);
      
      // Smart injection of CSS :not() pseudo-class to safely ignore elements
      const targetSelector = excludeElements 
        ? selector.split(',').map(s => `${s.trim()}:not(${excludeElements})`).join(', ')
        : selector;

      items = Array.from(container.querySelectorAll(targetSelector));
      states = items.map(() => ({ isOutside: true, lastIntensity: 0 }));
      setters = items.map(item => ({
        intensity: gsap.quickSetter(item, "--prox-intensity") as (val: string | number) => void,
        dx: gsap.quickSetter(item, "--prox-dx", "px") as (val: string | number) => void,
        dy: gsap.quickSetter(item, "--prox-dy", "px") as (val: string | number) => void
      }));
      updateCenters();
      setInitialState();
    };

    if (document.fonts) {
      document.fonts.ready.then(initItems);
    } else {
      initItems();
    }

    const mutationObserver = new MutationObserver((mutationsList) => {
      const needsReinit = mutationsList.some(mutation => 
        mutation.type === "childList" && (
          Array.from(mutation.addedNodes).some(n => n instanceof HTMLElement && (n.matches(selector) || n.querySelector(selector))) ||
          Array.from(mutation.removedNodes).some(n => n instanceof HTMLElement && (n.matches(selector) || n.querySelector(selector)))
        )
      );
      if (needsReinit) initItems();
    });

    const resizeObserver = new ResizeObserver(() => updateCenters());
    mutationObserver.observe(container, { childList: true, subtree: true });
    resizeObserver.observe(container);

    const actualSpread = activeReach * 10000;
    const maxDistance = activeReach * 200;

    /**
     * CORE TICK LOOP
     */
    const onTick = () => {
      if (!pointer.current.active) return;

      const { x: pageX, y: pageY, target } = pointer.current;
      const isBlocked = ignoreSelectors.some((sel) => (target as HTMLElement)?.closest?.(sel));

      items.forEach((item, i) => {
        const bounds = centers[i];
        if (!bounds) return;
        
        let distance: number;
        if (isBlocked) {
          distance = Infinity;
        } else {
          const dxEdge = Math.max(bounds.left - pageX, 0, pageX - bounds.right);
          const dyEdge = Math.max(bounds.top - pageY, 0, pageY - bounds.bottom);
          distance = Math.sqrt(dxEdge * dxEdge + dyEdge * dyEdge);
        }

        if (distance > maxDistance) {
          if (!states[i].isOutside) {
            const resetProps = activeOnReset ? activeOnReset() : (activePreset ? calculatePresetValues(activePreset, 0, mergedBounds, true) : {});
            gsap.to(item, {
              ...resetProps,
              "--prox-intensity": 0,
              duration: activeResetDuration,
              overwrite: true,
              ease: targetResetEase,
            });
            states[i].isOutside = true;
            states[i].lastIntensity = 0;
          }
          return;
        }

        const intensity = Math.exp(-(Math.pow(distance, activeFalloff)) / actualSpread);
        
        if (Math.abs(intensity - states[i].lastIntensity) > 0.01) {
          setters[i].intensity(intensity.toFixed(3));
          setters[i].dx(pageX - bounds.x);
          setters[i].dy(pageY - bounds.y);

          const animationProps = activeOnCalculate 
            ? activeOnCalculate(intensity, distance) 
            : (activePreset ? calculatePresetValues(activePreset, intensity, mergedBounds, false) : {});
          
          gsap.to(item, {
            ...animationProps,
            duration: activeDuration,
            overwrite: "auto", 
            ease: targetEase,
          });

          states[i].lastIntensity = intensity;
          states[i].isOutside = false;
        }
      });
    };

    gsap.ticker.add(onTick);

    const updatePointer = (x: number, y: number, target: EventTarget | null) => {
      pointer.current = { x, y, target, active: true };
    };

    const onPointerMove = (e: PointerEvent) => updatePointer(e.pageX, e.pageY, e.target);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches?.[0]) updatePointer(e.touches[0].pageX, e.touches[0].pageY, e.target);
    };

    const handleReset = () => {
      pointer.current.active = false;
      const resetProps = activeOnReset ? activeOnReset() : (activePreset ? calculatePresetValues(activePreset, 0, mergedBounds, true) : {});
      const activeItems = items.filter((_, i) => !states[i].isOutside);
      
      if (activeItems.length > 0) {
        gsap.to(activeItems, {
          ...resetProps,
          "--prox-intensity": 0,
          duration: activeResetDuration,
          overwrite: true,
          ease: targetResetEase,
        });
        items.forEach((_, i) => { 
            states[i].isOutside = true; 
            states[i].lastIntensity = 0;
        });
      }
    };

    const targetElement: EventTarget = activeGlobal ? window : container;
    
    targetElement.addEventListener("pointermove", onPointerMove as EventListener);
    targetElement.addEventListener("pointerleave", handleReset as EventListener);
    targetElement.addEventListener("pointerup", handleReset as EventListener);
    targetElement.addEventListener("pointercancel", handleReset as EventListener);
    targetElement.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });
    targetElement.addEventListener("touchstart", onTouchMove as EventListener, { passive: true });
    targetElement.addEventListener("touchend", handleReset as EventListener);
    targetElement.addEventListener("touchcancel", handleReset as EventListener);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      gsap.ticker.remove(onTick);
      targetElement.removeEventListener("pointermove", onPointerMove as EventListener);
      targetElement.removeEventListener("pointerleave", handleReset as EventListener);
      targetElement.removeEventListener("pointerup", handleReset as EventListener);
      targetElement.removeEventListener("pointercancel", handleReset as EventListener);
      targetElement.removeEventListener("touchmove", onTouchMove as EventListener);
      targetElement.removeEventListener("touchstart", onTouchMove as EventListener);
      targetElement.removeEventListener("touchend", handleReset as EventListener);
      targetElement.removeEventListener("touchcancel", handleReset as EventListener);
      gsap.killTweensOf(items);
    };
  },[
    selector, excludeElements, activePreset, activeReach, activeFalloff, activeDuration, 
    activeResetDuration, activeGlobal, mergedBoundsStr, 
    ignoreSelectors.join(','), targetEase, targetResetEase
  ]);

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ position: 'relative', touchAction: 'none', ...style }} 
      {...restProps}
    >
      {children}
    </div>
  );
};