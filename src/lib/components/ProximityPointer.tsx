import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useProximityConfig } from "../core/useProximityConfig";
import { ProximityEngine } from "../core/ProximityEngine";
import { calculatePresetValues, cipherUpdate } from "../utils";
import { addWillChange, removeWillChange } from "../utils/proximityHelpers";
import { EASE_MAP } from "../constants";
import { ProximityProps, ProxHTMLElement } from "../types";

export const ProximityPointer: React.FC<ProximityProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = useProximityConfig(props);
  
  const pointer = useRef({ x: -1, y: -1, target: null as EventTarget | null, active: false });
  const lastPointer = useRef({ x: -1, y: -1 });

  useGSAP(() => {
      if (!containerRef.current) return;
      const engine = new ProximityEngine(containerRef.current, config);
      engine.setup();
  
      let cipherInterval: ReturnType<typeof setInterval>;
      const hasCipher = config.allPresetsStr.includes("cipher");
      if (hasCipher && !engine.skipAllAnimations) {
        cipherInterval = setInterval(() => {
          for (let i = 0; i < engine.items.length; i++) {
            const item = engine.items[i];
            if (item.proxCipher! > 0.01) {
              cipherUpdate.call({ targets: () => [item] } as unknown as gsap.core.Tween);
            }
          }
        }, 60);
      }
  
      const maxDistance = config.activeReach * 200;
      let isTickerActive = false;

      const onTick = (): void => {

      if (pointer.current.x === lastPointer.current.x && pointer.current.y === lastPointer.current.y) return;
      lastPointer.current.x = pointer.current.x;
      lastPointer.current.y = pointer.current.y;

      if (!pointer.current.active || engine.skipAllAnimations) return;
      const cRect = engine.container.getBoundingClientRect();
      const localX = pointer.current.x - cRect.left;
      const localY = pointer.current.y - cRect.top;
      const isBlocked = config.ignoreSelectors.some((sel) => (pointer.current.target as HTMLElement)?.closest?.(sel));

      if (engine.containerBounds && !config.activeGlobal) {
        const cb = engine.containerBounds;
        if ((localX < cb.left - maxDistance || localX > cb.right + maxDistance || localY < cb.top - maxDistance || localY > cb.bottom + maxDistance || isBlocked) && engine.states.every((s) => s.isOutside)) return;
      }
      const toCheck = engine.toCheckSet;
      toCheck.clear();

      if (config.activeGlobal) {
        engine.items.forEach((_, i) => toCheck.add(i));
      } else {
              const CELL = Math.max(50, maxDistance / 2);
              const cellRadius = Math.ceil(maxDistance / CELL);
        const cx = Math.floor(localX / CELL);
        const cy = Math.floor(localY / CELL);
        for (let ox = -cellRadius; ox <= cellRadius; ox++) {
          for (let oy = -cellRadius; oy <= cellRadius; oy++) {
            const cells = engine.spatialGrid.get(`${cx + ox},${cy + oy}`);
            if (cells) {
              for (let j = 0; j < cells.length; j++) toCheck.add(cells[j]);
            }
          }
        }
      }

      engine.states.forEach((s, i) => { if (!s.isOutside) toCheck.add(i); });

      const maxDistanceSq = maxDistance * maxDistance;
      let nearestIndex = -1;
      let minDistSq = Infinity;

      for (const i of toCheck) {
        engine.dArray[i] = Infinity;
      }

      for (const i of toCheck) {
        const b = engine.centers[i];
        if (!b) continue;
        
        const dx = localX - b.x;
        const dy = localY - b.y;
        engine.dxArray[i] = dx;
        engine.dyArray[i] = dy;

        const distX = Math.max(0, Math.abs(dx) - b.w / 2);
        const distY = Math.max(0, Math.abs(dy) - b.h / 2);
        
        const dBoxSq = distX * distX + distY * distY;
        
        const inside = localX >= b.left && localX <= b.right && localY >= b.top && localY <= b.bottom;
        const offScreen = (engine.items[i] as ProxHTMLElement)._isProxVisible === false;
        
        if (isBlocked || (config.activeExplicit && !inside) || offScreen) continue; 
        
        if (dBoxSq > maxDistanceSq) {
          continue; 
        }
        
        engine.dArray[i] = Math.sqrt(dBoxSq); 
        
        if (dBoxSq < minDistSq) { 
          minDistSq = dBoxSq; 
          nearestIndex = i; 
        }
      }

      const falloff = Math.max(0.01, config.activeFalloff);
      const expDenominator = 1 - Math.exp(-falloff);

      for (const i of toCheck) {
        const item = engine.items[i];
        const d = engine.dArray[i];
        const dx = engine.dxArray[i];
        const dy = engine.dyArray[i];
        const isNearest = i === nearestIndex && d <= maxDistance;
        const lc = engine.targetMap.get(item);

        if (d > maxDistance) {
          if (!engine.states[i].isOutside) {
            const gr = engine.resetProps[i] ?? {};
            gsap.to(item, {
              "--prox-intensity": 0, duration: config.activeResetDuration, delay: config.activeResetDelay, ease: config.targetResetEase, overwrite: "auto",
              onComplete: () => { if (engine.states[i].isOutside) removeWillChange(item); },
            });
            const keys = config.activeOnCalculate ? ["custom"] : config.activePresetKeys;
            for (const k of keys) {
              if (!gr[k]) continue;
              const tl = config.activeTimeline?.[k] ?? {};
              engine.applyVars(item, k, gr[k], tl.resetDuration ?? config.activeResetDuration, tl.resetDelay ?? config.activeResetDelay, EASE_MAP[tl.resetEase as string] ?? tl.resetEase ?? config.targetResetEase);
            }
            engine.states[i].isOutside = true;
            engine.states[i].lastIntensity = 0;
          }
          continue;
        }

        const x = d / maxDistance;
        let intensity = (Math.exp(-falloff * x) - Math.exp(-falloff)) / expDenominator;
        intensity = Math.max(0, Math.min(1, intensity));

        const hasMoved = Math.abs(intensity - engine.states[i].lastIntensity) >= config.activePrecision || Math.abs(dx - engine.states[i].lastDx) >= 1.0;

        if (!hasMoved) continue;

        if (engine.states[i].isOutside && !engine.skipAllAnimations) addWillChange(item);

        engine.setters[i].intensity(intensity.toFixed(3));
        engine.setters[i].dx(dx);
        engine.setters[i].dy(dy);

        let cp = lc?.preset ?? config.activePreset ?? "";
        const nearestP = lc?.nearestPreset ?? config.activeNearestPreset;
        const neighborP = lc?.neighborPreset ?? config.activeNeighborPreset;
        if (isNearest && nearestP) cp = cp ? `${cp}-${nearestP}` : nearestP;
        else if (!isNearest && neighborP) cp = cp ? `${cp}-${neighborP}` : neighborP;

        const gp = engine.skipAllAnimations ? {} : config.activeOnCalculate
          ? { custom: config.activeOnCalculate(intensity, d, dx, dy, isNearest) }
          : calculatePresetValues(cp, config.allPresetsStr, intensity, config.mergedBounds, dx, dy,
                      engine.centers[i], false, config.parsedMaxTravel, config.activeLockAxis,
                      config.activeStartStyles, config.activeEndStyles, engine.skipAllAnimations, engine.disabledPresets, engine.cachedValues[i]);

        const keys = config.activeOnCalculate ? ["custom"] : config.activePresetKeys;
        for (const k of keys) {
          const vars = gp[k]; if (!vars) continue;
          const tl = config.activeTimeline?.[k] ?? {};
          const dur = tl.duration ?? (lc?.duration ?? config.activeDuration);
          const del = tl.delay ?? config.activeDelay;
          const ez = EASE_MAP[tl.ease as string] ?? tl.ease ?? (lc?.ease ?? config.targetEase);
          engine.applyVars(item, k, vars, dur, del, ez);
        }

        engine.states[i].lastIntensity = intensity;
        engine.states[i].lastDx = dx;
        engine.states[i].lastDy = dy;
        engine.states[i].isOutside = false;
      }
    };

      if (!engine.skipAllAnimations) {
            const startTicker = () => {
              if (!isTickerActive && !engine.skipAllAnimations) {
                gsap.ticker.add(onTick);
                isTickerActive = true;
              }
            };
            
            const stopTicker = () => {
              if (isTickerActive) {
                gsap.ticker.remove(onTick);
                isTickerActive = false;
              }
            };
      
            const target = config.activeGlobal ? window : engine.container;
            const upd = (px: number, py: number, tgt: EventTarget | null) => { 
              pointer.current = { x: px, y: py, target: tgt, active: true }; 
              startTicker(); // Wake up!
            };
            
            const onMove = (e: PointerEvent) => upd(e.clientX, e.clientY, e.target);
            const onTMove = (e: TouchEvent) => { if (e.touches[0]) upd(e.touches[0].clientX, e.touches[0].clientY, e.target); };
            const onFocusIn = (e: FocusEvent) => {
              const targetNode = e.target as HTMLElement;
              const index = engine.items.indexOf(targetNode as ProxHTMLElement);
              if (index !== -1 && engine.centers[index]) {
                const b = engine.centers[index];
                const cRect = engine.container.getBoundingClientRect();
                upd(b.x + cRect.left, b.y + cRect.top, e.target);
              }
            };
      
            const handleReset = (): void => {
              pointer.current.active = false;
              stopTicker();
              engine.items.forEach((item, i) => {
                const gr = engine.resetProps[i] ?? {};
                gsap.to(item, {
                  "--prox-intensity": 0, duration: config.activeResetDuration, delay: config.activeResetDelay, ease: config.targetResetEase, overwrite: "auto",
                  onComplete: () => { if (engine.states[i].isOutside) removeWillChange(item); },
                });
                const keys = config.activeOnCalculate ? ["custom"] : config.activePresetKeys;
                for (const k of keys) {
                  if (!gr[k]) continue;
                  engine.applyVars(item, k, gr[k], config.activeResetDuration, config.activeResetDelay, config.targetResetEase);
                }
              });
              engine.states.forEach((s) => { s.isOutside = true; s.lastIntensity = 0; });
            };
      
            target.addEventListener("pointermove", onMove as EventListener);
            target.addEventListener("pointerleave", handleReset as EventListener);
            target.addEventListener("touchmove", onTMove as EventListener, { passive: true });
            target.addEventListener("touchend", handleReset as EventListener);
            target.addEventListener("focusin", onFocusIn as EventListener);
            target.addEventListener("focusout", handleReset as EventListener);
      
            return () => {
              if (cipherInterval) clearInterval(cipherInterval);
              engine.destroy();
              gsap.ticker.remove(onTick);
              stopTicker();
              target.removeEventListener("pointermove", onMove as EventListener);
              target.removeEventListener("pointerleave", handleReset as EventListener);
              target.removeEventListener("touchmove", onTMove as EventListener, { passive: true } as unknown as EventListenerOptions);
              target.removeEventListener("touchend", handleReset as EventListener);
              target.removeEventListener("focusin", onFocusIn as EventListener);
              target.removeEventListener("focusout", handleReset as EventListener);
            };
          }

    return () => engine.destroy();
  }, { dependencies: config.deps, scope: containerRef });

  return (
    <div ref={containerRef} className={`proximity-container ${config.className}`.trim()} style={{ position: "relative", touchAction: "pan-y", ...config.style }} {...config.restProps}>
      {config.children}
    </div>
  );
};