import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const PRESET_DEFAULTS = {
  scale: [1, 1.5],
  y: [0, -30],
  opacity: [0.2, 1],
  blur: [8, 0],
  rotate: [0, 90],
  weight: [100, 900],
};

const EASE_MAP = {
  // Smooth & Classic
  smooth: "power1.inOut",
  heavy: "power4.out",
  sharp: "expo.out",
  fluid: "circ.inOut",
  
  // Fun & Energetic
  bouncy: "back.out(1.7)",
  elastic: "elastic.out(1, 0.3)",
  jello: "elastic.out(1.5, 0.2)",
  bounce: "bounce.out",
  swing: "back.inOut(3)",
  
  // Technical & Weird
  vibrate: "rough({ strength: 2, points: 20, template: 'none', taper: 'none', randomize: true })",
  robot: "steps(8)",
  ghost: "slow(0.6, 0.8, false)",
  expo: "expo.inOut",
  circus: "back.out(4)",
  
  // New Additions
  glitch: "rough({ template: 'none', strength: 3, points: 50, taper: 'both', randomize: true })",
  slowmo: "slow(0.7, 0.7, false)"
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
  preset = "",
  config = {},
  onCalculate,
  onReset,
  reach = 2,
  falloff = 2.4,
  duration = 0.2,
  resetDuration = 0.4,
  className = "",
  style = {},
  ...props
}) => {
  const containerRef = useRef(null);

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll(selector);
    let centers = [];
    let animationFrameId;

    const setters = Array.from(items).map(item => ({
      intensity: gsap.quickSetter(item, "--prox-intensity"),
      dx: gsap.quickSetter(item, "--prox-dx", "px"),
      dy: gsap.quickSetter(item, "--prox-dy", "px")
    }));

    const updateCenters = () => {
      centers = Array.from(items).map((item) => {
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
      let initialProps = onReset ? onReset() : (preset ? calculatePresetValues(preset, 0, config, true) : {});
      initialProps.willChange = "transform, filter, opacity, font-variation-settings";
      if (Object.keys(initialProps).length > 0) gsap.set(items, initialProps);
    };

    // تأخير بسيط لضمان أن المتصفح انتهى من ترتيب الحروف
    setTimeout(updateCenters, 50);
    setInitialState();

    window.addEventListener("resize", updateCenters);

    const actualSpread = reach * 10000;

    const handleMouseMove = (e) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const mouseX = e.pageX;
        const mouseY = e.pageY;

        items.forEach((item, i) => {
          const bounds = centers[i];
          if (!bounds) return;
          
          const dxEdge = Math.max(bounds.left - mouseX, 0, mouseX - bounds.right);
          const dyEdge = Math.max(bounds.top - mouseY, 0, mouseY - bounds.bottom);
          const distance = Math.sqrt(dxEdge * dxEdge + dyEdge * dyEdge);
          const intensity = Math.exp(-(Math.pow(distance, falloff)) / actualSpread);

          setters[i].intensity(intensity.toFixed(3));
          setters[i].dx(mouseX - bounds.x);
          setters[i].dy(mouseY - bounds.y);

          const animationProps = onCalculate ? onCalculate(intensity, distance) : (preset ? calculatePresetValues(preset, intensity, config, false) : {});
          const targetEase = EASE_MAP[config.ease] || config.ease || "power1.out";

          gsap.to(item, {
            ...animationProps,
            duration: config.duration ?? duration,
            overwrite: "auto",
            ease: targetEase,
          });
        });
      });
    };

    const handleMouseLeave = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      const resetProps = onReset ? onReset() : (preset ? calculatePresetValues(preset, 0, config, true) : {});
      gsap.to(items, {
        ...resetProps,
        "--prox-intensity": 0,
        duration: config.resetDuration ?? resetDuration,
        overwrite: "auto",
        ease: EASE_MAP[config.resetEase] || config.resetEase || "power2.out",
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", updateCenters);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(items); // مسح أي أنيميشن معلق
    };
  }, [selector, preset, reach, falloff, duration, resetDuration, JSON.stringify(config)]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', ...style }} {...props}>
      {children}
    </div>
  );
};