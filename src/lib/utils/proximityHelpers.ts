import gsap from "gsap";
import { ProxHTMLElement } from "../types";
import { OPTIMIZED_WILL_CHANGE } from "../constants";

export const parseScrollPosition = (pos: string, isStart: boolean): string => {
  if (pos === "appear") return "top bottom";
  if (pos === "disappear") return "bottom top";
  const m: Record<string, string> = { top: "top top", center: "center center", middle: "center center", bottom: "bottom bottom" };
  return m[pos] ?? pos ?? (isStart ? "top bottom" : "bottom top");
};

export const getScrollFocusValue = (focus: string | number): number => {
  if (typeof focus === "number") return focus / 100;
  switch (focus) {
    case "appear": return 0;
    case "top": return 0.25;
    case "middle":
    case "center": return 0.5;
    case "bottom": return 0.75;
    case "disappear": return 1;
    default: return 0.5;
  }
};

export const addWillChange = (item: ProxHTMLElement): void => {
  item._willChangeCount = (item._willChangeCount ?? 0) + 1;
  if (item._willChangeCount === 1)
    gsap.set(item, { willChange: OPTIMIZED_WILL_CHANGE });
};

export const removeWillChange = (item: ProxHTMLElement): void => {
  if ((item._willChangeCount ?? 0) > 0) item._willChangeCount!--;
  if (item._willChangeCount === 0)
    gsap.set(item, { willChange: "auto" });
};