export const PRESET_DEFAULTS: Record<string, [number, number] | [string, string]> = {
  scale: [1, 1.5],
  flexScale: [1, 1.5],
  y: [0, -30],
  x: [0, 30],
  opacity: [0.2, 1],
  blur: [8, 0],
  rotate: [0, 90],
  weight: [100, 900],
  skew: [0, 20],
  magnetic: [0, 0.1],
  tilt: [0, 30],
  tiltCard: [0, 15],
  repel: [0, 0.4],
  cipher: [0, 1],
  reveal: [110, 0],
  cycle: [0, 100],
  cycleSide: [0, 100],
  scroll: [0, 100],
  parallax: [0, 100],
  velocitySkew: [-15, 15],
  velocityScale: [0.95, 1.05],
  glow: [0, 20],
  brightness: [0.6, 1.2],
  contrast: [0.8, 1.4],
  borderRadius: [0, 50],
  letterSpacing: [-0.05, 0.2],
  grayScale: [1, 0],
  color: ["#888888", "#ffffff"],
  background: ["transparent", "rgba(255,255,255,0.1)"],
  fill: [0, 1],
  fillText: [0, 1],
};

export const EASE_MAP: Record<string, string> = {
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
  slowmo: "slow(0.7, 0.7, false)",
  spring: "elastic.out(1, 0.75)",
  heavySpring: "elastic.out(1.2, 0.3)",
  anticipate: "back.inOut(2)",
  launch: "slow(0.3, 0.4, false)",
  drift: "rough({ template: none, strength: 0.5, points: 10, taper: none, randomize: true, clamp: true })",
  whiplash: "back.out(4)",
};

export const OPTIMIZED_WILL_CHANGE = "transform, filter, opacity, font-variation-settings, clip-path";
export const FILTER_PRESETS = new Set(["blur", "glow", "brightness", "contrast", "grayScale"]);

export const QUICK_TO_PROPS =[
  "scaleX", "scaleY", "x", "y", "rotation", "skewX", "skewY", "opacity",
  "rotationX", "rotationY", "transformPerspective",
  "marginLeft", "marginRight", "marginTop", "marginBottom", "fontWeight",
  "proxCipher", "--prox-x", "--prox-y", "--prox-radius", "proxScroll"
];

export const ARABIC_NON_CONNECTING_LEFT = /[اأإآدذرزوؤءة\s]/;
export const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/;
export const LAM = "\u0644";
export const ALEFS = /[\u0622\u0623\u0625\u0627]/;
export const ZWJ = "\u200D";