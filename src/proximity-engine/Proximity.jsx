import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const PRESET_DEFAULTS = {
  scale: [1, 1.5],
  y:[0, -30],
  opacity:[0.2, 1],
  blur: [8, 0],
  rotate:[0, 90],
  weight:[100, 900],
};

const EASE_MAP = {
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

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const calculatePresetValues = (presetString, intensity, userConfig = {}, isReset = false) => {
  const props = presetString.split("-");
  const result = {};

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

export const Proximity = ({
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
  className = "",
  style = {},
  ...restProps
}) => {
  const containerRef = useRef(null);

  const activeReach = config.reach ?? reach;
  const activeFalloff = config.falloff ?? falloff;
  const activeDuration = config.duration ?? duration;
  const activeResetDuration = config.resetDuration ?? resetDuration;
  const activeGlobal = config.global ?? global;
  const activePreset = config.preset ?? preset;
  const activeOnCalculate = config.onCalculate ?? onCalculate;
  const activeOnReset = config.onReset ?? onReset;

  const rawEase = config.ease ?? ease ?? "power1.out";
  const targetEase = EASE_MAP[rawEase] || rawEase;

  const rawResetEase = config.resetEase ?? resetEase ?? "power2.out";
  const targetResetEase = EASE_MAP[rawResetEase] || rawResetEase;

  const mergedBounds = {
    scale: config.scale ?? scale,
    y: config.y ?? y,
    opacity: config.opacity ?? opacity,
    blur: config.blur ?? blur,
    rotate: config.rotate ?? rotate,
    weight: config.weight ?? weight,
  };

  useGSAP(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
     if (prefersReducedMotion) return;
      const container = containerRef.current;
      if (!container) return;
    
      let items = [];
      let states = [];
      let centers = [];
      let setters =[];
      let animationFrameId;
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
  
      const debouncedUpdateCenters = debounce(updateCenters, 200);
  
      const setInitialState = () => {
        let initialProps = activeOnReset ? activeOnReset() : (activePreset ? calculatePresetValues(activePreset, 0, mergedBounds, true) : {});
        initialProps.willChange = "transform, filter, opacity, font-variation-settings";
        if (Object.keys(initialProps).length > 0 && items.length > 0) gsap.set(items, initialProps);
      };
  
      const initItems = () => {
        if (items.length > 0) gsap.killTweensOf(items);
  
        items = Array.from(container.querySelectorAll(selector));
        states = items.map(() => ({ isOutside: true }));
        setters = items.map(item => ({
          intensity: gsap.quickSetter(item, "--prox-intensity"),
          dx: gsap.quickSetter(item, "--prox-dx", "px"),
          dy: gsap.quickSetter(item, "--prox-dy", "px")
        }));
  
        updateCenters();
        setInitialState();
      };
  
      if (document.fonts) {
        document.fonts.ready.then(initItems);
      } else {
        setTimeout(initItems, 100);
      }

      const observer = new MutationObserver(() => {
        initItems();
      });
      observer.observe(container, { childList: true, subtree: true });
  
      window.addEventListener("resize", debouncedUpdateCenters);
  
      const actualSpread = activeReach * 10000;
      const maxDistance = activeReach * 200;
  
      const handlePointerMove = (e) => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          const mouseX = e.pageX;
          const mouseY = e.pageY;
  
          const isBlocked = ignoreSelectors.length > 0 && ignoreSelectors.some((sel) => e.target?.closest?.(sel));
  
          items.forEach((item, i) => {
            const bounds = centers[i];
            if (!bounds) return;
            
            let distance;
  
            if (isBlocked) {
              distance = Infinity;
            } else {
              const dxEdge = Math.max(bounds.left - mouseX, 0, mouseX - bounds.right);
              const dyEdge = Math.max(bounds.top - mouseY, 0, mouseY - bounds.bottom);
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
              }
              return;
            }
  
            const intensity = Math.exp(-(Math.pow(distance, activeFalloff)) / actualSpread);
  
            setters[i].intensity(intensity.toFixed(3));
            setters[i].dx(mouseX - bounds.x);
            setters[i].dy(mouseY - bounds.y);
  
            const animationProps = activeOnCalculate ? activeOnCalculate(intensity, distance) : (activePreset ? calculatePresetValues(activePreset, intensity, mergedBounds, false) : {});
  
            gsap.to(item, {
              ...animationProps,
              duration: activeDuration,
              overwrite: true,
              ease: targetEase,
            });
            
            states[i].isOutside = false;
          });
        });
      };
  
      const handlePointerLeave = () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        const resetProps = activeOnReset ? activeOnReset() : (activePreset ? calculatePresetValues(activePreset, 0, mergedBounds, true) : {});
        
        const activeItems =[];
        items.forEach((item, i) => {
          if (!states[i].isOutside) {
            activeItems.push(item);
            states[i].isOutside = true;
          }
        });
  
        if (activeItems.length > 0) {
          gsap.to(activeItems, {
            ...resetProps,
            "--prox-intensity": 0,
            duration: activeResetDuration,
            overwrite: true,
            ease: targetResetEase,
          });
        }
      };
  
      const handleTouchMove = (e) => {
        if (e.touches && e.touches.length > 0) {
          handlePointerMove({ pageX: e.touches[0].pageX, pageY: e.touches[0].pageY, target: e.target });
        }
      };
  
      const targetElement = activeGlobal ? window : container;
      targetElement.addEventListener("pointermove", handlePointerMove);
      targetElement.addEventListener("pointerleave", handlePointerLeave);
      targetElement.addEventListener("pointerup", handlePointerLeave);
      targetElement.addEventListener("pointercancel", handlePointerLeave);
      targetElement.addEventListener("touchmove", handleTouchMove, { passive: true });
      targetElement.addEventListener("touchstart", handleTouchMove, { passive: true });
      targetElement.addEventListener("touchend", handlePointerLeave);
      targetElement.addEventListener("touchcancel", handlePointerLeave);
  
      return () => {
        observer.disconnect(); // 5. Clean up the observer!
        window.removeEventListener("resize", debouncedUpdateCenters);
        targetElement.removeEventListener("pointermove", handlePointerMove);
        targetElement.removeEventListener("pointerleave", handlePointerLeave);
        targetElement.removeEventListener("pointerup", handlePointerLeave);
        targetElement.removeEventListener("pointercancel", handlePointerLeave);
        targetElement.removeEventListener("touchmove", handleTouchMove);
        targetElement.removeEventListener("touchstart", handleTouchMove);
        targetElement.removeEventListener("touchend", handlePointerLeave);
        targetElement.removeEventListener("touchcancel", handlePointerLeave);
        gsap.killTweensOf(items); 
      };
    },[
      selector, 
      activePreset, 
      activeReach, 
      activeFalloff, 
      activeDuration, 
      activeResetDuration, 
      activeGlobal, 
      JSON.stringify(mergedBounds), 
      ignoreSelectors.join(','),
      targetEase,
      targetResetEase
    ]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', touchAction: 'none', ...style }} {...restProps}>
      {children}
    </div>
  );
};