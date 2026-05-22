import { CSSProperties, HTMLAttributes  } from "react";

export type EasePreset =
  | "smooth" | "heavy" | "sharp" | "fluid" | "bouncy" | "elastic"
  | "jello" | "bounce" | "swing" | "vibrate" | "robot" | "ghost"
  | "expo" | "circus" | "glitch" | "slowmo" | "spring" | "heavySpring"
  | "anticipate" | "launch" | "drift" | "whiplash" | (string & {});

export type ProximityPreset =
  | "scale" | "flexScale" | "y" | "x" | "opacity" | "blur" | "rotate"
  | "weight" | "skew" | "magnetic" | "tilt" | "tiltCard" | "repel"
  | "cipher" | "reveal" | "color" | "background" | "glow" | "brightness"
  | "contrast" | "borderRadius" | "letterSpacing" | "grayScale" | "cycle" | "cycleSide"
  | "fill" | "fillText" | "scroll" | "parallax" | "velocitySkew" | "velocityScale" | (string & {});

export type ProximityMode = "pointer" | "scroll";
export type AxisLock = "x" | "y" | "both" | "none";

export interface ProximityScrollConfig {
  start?: "appear" | "top" | "center" | "middle" | "bottom" | (string & {});
  end?: "top" | "center" | "middle" | "bottom" | "disappear" | (string & {});
  focus?: "appear" | "top" | "center" | "middle" | "bottom" | "disappear" | number;
  scroller?: string | Element | Window;
  scrub?: boolean | number;
  markers?: boolean;
  once?: boolean;
  stagger?: number | gsap.StaggerVars;
  resetStagger?: number | gsap.StaggerVars;
  pin?: boolean | string | Element;
  pinSpacing?: boolean | string;
  envelope?: [number, number];
  mode?: "lens" | "progress" | (string & {});
  lensCenter?: [number, number];
  lensRadius?: number;
  triggerMode?: "individual" | "group";
  trigger?: string | Element;
  horizontal?: boolean;
  onScrollDown?: Partial<ProximityConfig>;
  onScrollUp?: Partial<ProximityConfig>;
  velocityDriven?: boolean;
  velocityMap?: Record<string, [number, number]>;
}

export interface ProximityTimelineConfig {
  duration?: number;
  resetDuration?: number;
  delay?: number;
  resetDelay?: number;
  ease?: EasePreset;
  resetEase?: EasePreset;
}

export interface ProximityTargetOverride extends ProximityConfig {
  selector: string;
}

export interface ProximityConfig {
  mode?: ProximityMode;
  scroll?: ProximityScrollConfig | [number, number];
  scrollFocus?: "top" | "center" | "middle" | "bottom" | number;
  scrollStart?: string;
  scrollEnd?: string;
  reach?: number;
  falloff?: number;
  duration?: number;
  resetDuration?: number;
  delay?: number;
  resetDelay?: number;
  stagger?: number | gsap.StaggerVars;
  resetStagger?: number | gsap.StaggerVars;
  scrub?: boolean | number;
  resetScrub?: boolean | number;
  start?: gsap.TweenVars;
  end?: gsap.TweenVars;
  global?: boolean;
  explicit?: boolean;
  preset?: ProximityPreset;
  nearestPreset?: ProximityPreset;
  neighborPreset?: ProximityPreset;
  ease?: EasePreset;
  resetEase?: EasePreset;
  maxTravel?: number | [number, number] | { x: number; y: number };
  lockAxis?: AxisLock;
  splitBy?: "letter" | "word" | "line";
  targets?: ProximityTargetOverride[];
  timeline?: Record<string, ProximityTimelineConfig>;
  precision?: number;
  scale?: [number, number];
  flexScale?: [number, number];
  y?: [number, number];
  x?: [number, number];
  opacity?: [number, number];
  blur?: [number, number];
  rotate?: [number, number];
  weight?: [number, number];
  skew?: [number, number];
  magnetic?: [number, number];
  tilt?: [number, number];
  tiltCard?: [number, number];
  repel?: [number, number];
  cipher?: [number, number];
  reveal?: [number, number];
  glow?: [number, number];
  brightness?: [number, number];
  contrast?: [number, number];
  borderRadius?: [number, number];
  letterSpacing?: [number, number];
  grayScale?: [number, number];
  color?: [string, string];
  background?: [string, string];
  parallax?: [number, number];
  velocitySkew?: [number, number];
  velocityScale?: [number, number];
  onCalculate?: (intensity: number, distance: number, dx: number, dy: number, isNearest: boolean) => gsap.TweenVars;
  onReset?: () => gsap.TweenVars;
  disableOnMobile?: boolean | string | string[];
  waitForAnimationEnd?: boolean;
  waitForEnterAnimationEnd?: boolean;
  waitForLeaveAnimationEnd?: boolean;
  horizontal?: boolean;
  lensCenter?: [number, number];
  lensRadius?: number;
  triggerMode?: "individual" | "group";
  onScrollDown?: Partial<ProximityConfig>;
  onScrollUp?: Partial<ProximityConfig>;
  velocityMap?: Record<string, [number, number]>;
}

export interface ProximityProps extends ProximityConfig, Omit<HTMLAttributes<HTMLDivElement>, "color" | "onReset"> {
  children?: React.ReactNode;
  selector?: string;
  config?: ProximityConfig;
  ignoreSelectors?: string[];
  excludeElements?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  scrollerRef?: React.RefObject<HTMLElement | null>;
}

export interface ProxHTMLElement extends HTMLElement {
  proxCipher?: number;
  _lastCipherUpdate?: number;
  _quickTos?: Record<string, gsap.QuickToFunc>;
  _isProxVisible?: boolean;
  _willChangeCount?: number;
  _scrollState?: "resting" | "hovered";
}

export interface ItemCenter {
  left: number; right: number; top: number; bottom: number;
  x: number; y: number; w: number; h: number;
  ml: number; mr: number; mt: number; mb: number;
}

export interface ItemState {
  isOutside: boolean;
  lastIntensity: number;
  lastDx: number;
  lastDy: number;
}

export interface ItemSetters {
  intensity: (val: number | string) => void;
  dx: (val: number | string) => void;
  dy: (val: number | string) => void;
}

export interface ContainerBounds {
  left: number; right: number; top: number; bottom: number;
  globalLeft: number; globalTop: number;
}

export interface ProximityTextProps extends ProximityProps {
  text: string;
  splitBy?: "letter" | "word" | "line";
  textClassName?: string;
  fontFamily?: string;
  lineHeight?: number;
  textLetterSpacing?: number;
  wordSpacing?: number;
  clipFix?: string;
  ignoreText?: (string | RegExp)[];
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  dir?: 'ltr' | 'rtl' | 'auto';
}