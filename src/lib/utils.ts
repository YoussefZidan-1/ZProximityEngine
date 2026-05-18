import gsap from "gsap";
import { ItemCenter, AxisLock, ProxHTMLElement } from "./types";
import { PRESET_DEFAULTS, FILTER_PRESETS, ARABIC_DIACRITICS, LAM, ALEFS, ARABIC_NON_CONNECTING_LEFT } from "./constants";

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

export const calculatePresetValues = (
  activePresetString: string,
  allPresetsString: string,
  intensity: number,
  userConfig: Record<string, [number, number] | [string, string] | undefined>,
  dx: number,
  dy: number,
  center: ItemCenter | undefined | null,
  isReset = false,
  maxTravel?: number | [number, number] | { x: number; y: number },
  lockAxis?: AxisLock,
  startStyles?: gsap.TweenVars,
  endStyles?: gsap.TweenVars,
  skipAll = false,
  disabledPresets: Set<string> = new Set(),
  targetCache: Record<string, gsap.TweenVars> = {}
): Record<string, gsap.TweenVars> => {
  if (skipAll) return {};
  for (const k in targetCache) {
    for (const prop in targetCache[k]) {
      targetCache[k][prop] = undefined as any;
    }
  }

  const activeProps = new Set(activePresetString.split("-").filter(Boolean));
  const allPropsArray = allPresetsString.split("-").filter(Boolean);

  const lockX = lockAxis === "y";
  const lockY = lockAxis === "x";
  const w = center?.w || 1;
  const h = center?.h || 1;
  const ml = center?.ml || 0;
  const mr = center?.mr || 0;
  const mt = center?.mt || 0;
  const mb = center?.mb || 0;

  const clampTravel = (val: number, axis: "x" | "y"): number => {
    if (maxTravel == null) return val;
    let limit = Infinity;
    if (typeof maxTravel === "number") limit = maxTravel;
    else if (Array.isArray(maxTravel)) limit = axis === "x" ? maxTravel[0] : maxTravel[1];
    else limit = axis === "x" ? (maxTravel as { x: number; y: number }).x : (maxTravel as { x: number; y: number }).y;
    if (!isFinite(limit)) return val;
    return Math.max(-limit, Math.min(val, limit));
  };

  const filterChunks: string[] =[];

  for (const prop of allPropsArray) {
    if (disabledPresets.has(prop)) continue;

    const bounds = userConfig[prop] ?? PRESET_DEFAULTS[prop];
    if (!bounds) continue;

    const isActive = activeProps.has(prop);
    const useBase = isReset || !isActive;
    const curIntensity = useBase ? 0 : intensity;

    const [base, max] = bounds as [number, number];
    const curValue = base + (max - base) * curIntensity;

    if (prop === "blur") { filterChunks.push(`blur(${curValue}px)`); continue; }
    if (prop === "glow") { filterChunks.push(`drop-shadow(0 0 ${curValue}px currentColor)`); continue; }
    if (prop === "brightness") { filterChunks.push(`brightness(${curValue})`); continue; }
    if (prop === "contrast") { filterChunks.push(`contrast(${curValue})`); continue; }
    if (prop === "grayScale") { filterChunks.push(`grayscale(${curValue})`); continue; }

    if (!targetCache[prop]) targetCache[prop] = {};
    const res = targetCache[prop];

    switch (prop) {
      case "weight":
        res.fontWeight = Math.round(curValue);
        res.fontVariationSettings = `'wght' ${Math.round(curValue)}`;
        break;
      case "borderRadius":
        res.borderRadius = `${curValue}%`;
        break;
      case "letterSpacing":
        res.letterSpacing = `${curValue}em`;
        break;
      case "rotate":
        res.rotation = curValue;
        break;
      case "skew":
        res.skewX = curValue;
        break;
      case "cipher":
        res.proxCipher = curValue;
        break;
      case "reveal":
        res.y = `${curValue}%`;
        res.clipPath = `inset(0% 0% ${curValue}% 0%)`;
        break;
        case "color": {
          const [cBase, cMax] = bounds as [string, string];
          res.color = useBase ? cBase : gsap.utils.interpolate(cBase, cMax, curIntensity);
          break;
        }
        case "background": {
          const [bgBase, bgMax] = bounds as [string, string];
          res.backgroundColor = useBase ? bgBase : gsap.utils.interpolate(bgBase, bgMax, curIntensity);
          break;
        }
      case "scroll":
        res.proxScroll = curIntensity > 0.5 ? 1 : 0;
        res.proxScrollTravel = max;
        break;
      case "cycle": {
        res.proxCycle = curIntensity > 0.5 ? 1 : 0;
        res.proxCycleTravel = max;
        break;
       }
      case "cycleSide": {
        res.proxCycleSide = curIntensity > 0.5 ? 1 : 0;
        res.proxCycleSideTravel = max;
        break;
      }
      case "magnetic": {
        const pullX = lockX ? 0 : dx * curIntensity * max;
        const pullY = lockY ? 0 : dy * curIntensity * max;
        res.x = useBase ? 0 : clampTravel(pullX, "x");
        res.y = useBase ? 0 : clampTravel(pullY, "y");
        break;
      }
      case "repel": {
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const safeDx = dx === 0 ? 0.1 : dx;
        const safeDy = dy === 0 ? 0.1 : dy;
        const push = max * 100 * curIntensity;
        res.x = useBase || lockX ? 0 : clampTravel(-(safeDx / dist) * push, "x");
        res.y = useBase || lockY ? 0 : clampTravel(-(safeDy / dist) * push, "y");
        break;
      }
      case "tilt":
        res.rotationX = useBase || lockY ? 0 : -dy * curIntensity * (max / 10);
        res.rotationY = useBase || lockX ? 0 : dx * curIntensity * (max / 10);
        res.transformPerspective = 1000;
        break;
      case "tiltCard":
        res.rotationX = useBase || lockY ? 0 : (dy / (h / 2)) * -max * curIntensity;
        res.rotationY = useBase || lockX ? 0 : (dx / (w / 2)) * max * curIntensity;
        res.transformPerspective = 1000;
        break;
      case "scale":
        res.scaleX = curValue;
        res.scaleY = curValue;
        break;
      case "flexScale": {
        res.scaleX = curValue;
        res.scaleY = curValue;
        const ew = (w * (curValue - 1)) / 2;
        const eh = (h * (curValue - 1)) / 2;
        res.marginLeft = ml + ew;
        res.marginRight = mr + ew;
        res.marginTop = mt + eh;
        res.marginBottom = mb + eh;
        break;
      }
      case "fill":
      case "fillText": {
        const radius = curIntensity * 150;
        res["--prox-radius"] = radius; 

        if (!isReset) {
          const mx = w === 0 ? 50 : ((dx + w / 2) / w) * 100;
          const my = h === 0 ? 50 : ((dy + h / 2) / h) * 100;
          const clampMx = Math.max(-50, Math.min(150, mx));
          const clampMy = Math.max(-50, Math.min(150, my));
          res["--prox-x"] = clampMx;
          res["--prox-y"] = clampMy;
        }
        break;
      }
      default:
        res[prop] = curValue;
    }
  }

  if (!targetCache["_filters"]) targetCache["_filters"] = {};
  targetCache["_filters"].filter = filterChunks.length > 0 ? filterChunks.join(" ") : "none";

  if (startStyles || endStyles) {
    if (!targetCache["customStartEnd"]) targetCache["customStartEnd"] = {};
    const custom = targetCache["customStartEnd"];
    for (const k in custom) delete custom[k];

    const keys = new Set([...Object.keys(startStyles ?? {}), ...Object.keys(endStyles ?? {})]);
    keys.forEach((k) => {
      const sVal = startStyles?.[k];
      const eVal = endStyles?.[k];
      if (sVal !== undefined && eVal !== undefined) {
        custom[k] = gsap.utils.interpolate(sVal, eVal, isReset ? 0 : intensity);
      } else if (isReset && sVal !== undefined) {
        custom[k] = sVal;
      } else if (!isReset && eVal !== undefined) {
        custom[k] = eVal;
      }
    });
  }

  return targetCache;
};

export function cipherUpdate(this: gsap.core.Tween) {
  const item = this.targets()[0] as ProxHTMLElement;
  if (!item || item.children.length > 0) return;
  const val = item.proxCipher;
  if (val === undefined) return;
  const orig = item.dataset.proxOriginal;
  if (!orig || orig.trim() === "") return;
  if (val <= 0.01) {
    if (item.textContent !== orig) item.textContent = orig;
    return;
  }
  const now = Date.now();
  if (item._lastCipherUpdate && now - item._lastCipherUpdate < 60) return;
  item._lastCipherUpdate = now;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$*&%0123456789";
  let scrambled = "";
  for (let i = 0; i < orig.length; i++) {
    if (orig[i] === " " || orig[i] === "\n") { scrambled += orig[i]; continue; }
    scrambled += Math.random() < val ? chars[Math.floor(Math.random() * chars.length)] : orig[i];
  }
  if (item.textContent !== scrambled) item.textContent = scrambled;
}

export const getArabicSegments = (word: string) => {
  const segments: string[] =[];
  const characters = Array.from(word);
  let i = 0;
  
  while (i < characters.length) {
    let char = characters[i];
    
    if (char === LAM && i + 1 < characters.length) {
      let nextIdx = i + 1;
      let tempDiacritics = "";
      while (nextIdx < characters.length && ARABIC_DIACRITICS.test(characters[nextIdx])) {
        tempDiacritics += characters[nextIdx];
        nextIdx++;
      }
      if (nextIdx < characters.length && ALEFS.test(characters[nextIdx])) {
        char += tempDiacritics + characters[nextIdx];
        i = nextIdx;
      }
    }
    
    if (ARABIC_DIACRITICS.test(char) && segments.length > 0) {
      segments[segments.length - 1] += char;
    } else {
      segments.push(char);
    }
    i++;
  }
  return segments;
};

export const doesSegmentConnectLeft = (seg: string) => {
  const baseStr = seg.replace(ARABIC_DIACRITICS, '');
  if (!baseStr) return false;
  return !ARABIC_NON_CONNECTING_LEFT.test(baseStr[baseStr.length - 1]);
};