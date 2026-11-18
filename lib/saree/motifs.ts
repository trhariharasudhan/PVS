/**
 * Traditional South Indian saree motifs drawn with canvas paths (no images, no AI art).
 *
 * Every motif draws into a unit box centred on (0,0), roughly −0.5…0.5, facing right.
 * `fill` is the main colour (usually zari gold); `cut` is the "negative space" colour used
 * for eyes, veins and inner lines, exactly like the ground silk showing through zari.
 */

export type MotifId = "peacock" | "elephant" | "lotus" | "annam" | "mango" | "chakram" | "rudraksha" | "flower";

export const MOTIF_IDS: MotifId[] = ["peacock", "elephant", "lotus", "annam", "mango", "chakram", "rudraksha", "flower"];

type Ctx = CanvasRenderingContext2D;
type Paint = string | CanvasGradient | CanvasPattern;

function strokeLine(ctx: Ctx, w: number, paint: Paint) {
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = paint;
  ctx.stroke();
}

/* ---------------------------------------------------------------- peacock (mayil) */
function peacock(ctx: Ctx, fill: Paint, cut: Paint) {
  ctx.fillStyle = fill;
  // tail feathers sweeping back and down, each ending in an "eye" (mayil kann)
  const feathers = [150, 165, 180, 195, 210];
  feathers.forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const len = 0.38 + (i === 2 ? 0.04 : 0);
    const bx = -0.04;
    const by = 0.1;
    const ex = bx + Math.cos(a) * len;
    const ey = by + Math.sin(a) * len * 0.75;
    ctx.beginPath();
    ctx.moveTo(bx, by - 0.025);
    ctx.quadraticCurveTo((bx + ex) / 2, (by + ey) / 2 - 0.06, ex, ey);
    ctx.quadraticCurveTo((bx + ex) / 2, (by + ey) / 2 + 0.06, bx, by + 0.025);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ex, ey, 0.06, 0.045, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cut;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 0.035, 0.024, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(ex, ey, 0.013, 0, Math.PI * 2);
    ctx.fill();
  });
  // body
  ctx.beginPath();
  ctx.ellipse(0.06, 0.1, 0.17, 0.12, -0.35, 0, Math.PI * 2);
  ctx.fill();
  // neck
  ctx.beginPath();
  ctx.moveTo(0.1, 0.06);
  ctx.bezierCurveTo(0.24, -0.02, 0.17, -0.22, 0.25, -0.31);
  ctx.lineTo(0.31, -0.28);
  ctx.bezierCurveTo(0.25, -0.18, 0.33, 0.0, 0.2, 0.12);
  ctx.closePath();
  ctx.fill();
  // head + beak
  ctx.beginPath();
  ctx.arc(0.285, -0.33, 0.052, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0.33, -0.35);
  ctx.lineTo(0.41, -0.33);
  ctx.lineTo(0.33, -0.31);
  ctx.fill();
  // crest
  for (const dx of [-0.03, 0, 0.03]) {
    ctx.beginPath();
    ctx.moveTo(0.28, -0.37);
    ctx.lineTo(0.28 + dx, -0.47);
    strokeLine(ctx, 0.012, fill);
    ctx.beginPath();
    ctx.arc(0.28 + dx, -0.48, 0.017, 0, Math.PI * 2);
    ctx.fill();
  }
  // legs
  ctx.beginPath();
  ctx.moveTo(0.04, 0.2);
  ctx.lineTo(0.02, 0.4);
  ctx.moveTo(0.12, 0.19);
  ctx.lineTo(0.13, 0.4);
  strokeLine(ctx, 0.022, fill);
  // details: eye and wing lines
  ctx.fillStyle = cut;
  ctx.beginPath();
  ctx.arc(0.295, -0.335, 0.012, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-0.04, 0.08);
  ctx.quadraticCurveTo(0.05, 0.02, 0.15, 0.08);
  ctx.moveTo(-0.02, 0.14);
  ctx.quadraticCurveTo(0.06, 0.08, 0.15, 0.13);
  strokeLine(ctx, 0.014, cut);
}

/* ---------------------------------------------------------------- elephant (yaanai) */
function elephant(ctx: Ctx, fill: Paint, cut: Paint) {
  ctx.fillStyle = fill;
  // body
  ctx.beginPath();
  ctx.ellipse(-0.06, 0.02, 0.3, 0.19, 0, 0, Math.PI * 2);
  ctx.fill();
  // legs
  for (const x of [-0.3, -0.16, 0.03, 0.15]) {
    ctx.beginPath();
    ctx.roundRect(x, 0.08, 0.09, 0.3, 0.025);
    ctx.fill();
  }
  // head
  ctx.beginPath();
  ctx.arc(0.23, -0.06, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // trunk (curling outward at the tip)
  ctx.beginPath();
  ctx.moveTo(0.31, 0.0);
  ctx.bezierCurveTo(0.42, 0.1, 0.35, 0.25, 0.42, 0.34);
  ctx.quadraticCurveTo(0.47, 0.37, 0.47, 0.31);
  strokeLine(ctx, 0.075, fill);
  // tail
  ctx.beginPath();
  ctx.moveTo(-0.35, -0.03);
  ctx.quadraticCurveTo(-0.42, 0.06, -0.39, 0.17);
  strokeLine(ctx, 0.018, fill);
  // details: ear, eye, tusk, saddle cloth with diamond
  ctx.beginPath();
  ctx.ellipse(0.17, -0.04, 0.075, 0.11, 0.15, 0, Math.PI * 2);
  strokeLine(ctx, 0.018, cut);
  ctx.fillStyle = cut;
  ctx.beginPath();
  ctx.arc(0.29, -0.1, 0.014, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0.3, 0.05);
  ctx.quadraticCurveTo(0.38, 0.08, 0.4, 0.04);
  strokeLine(ctx, 0.018, cut);
  ctx.beginPath();
  ctx.moveTo(-0.22, -0.15);
  ctx.lineTo(0.05, -0.15);
  ctx.lineTo(0.03, 0.06);
  ctx.lineTo(-0.2, 0.06);
  ctx.closePath();
  strokeLine(ctx, 0.016, cut);
  ctx.beginPath();
  ctx.moveTo(-0.085, -0.1);
  ctx.lineTo(-0.035, -0.045);
  ctx.lineTo(-0.085, 0.01);
  ctx.lineTo(-0.135, -0.045);
  ctx.closePath();
  ctx.fill();
}

/* ---------------------------------------------------------------- lotus (thamarai) */
function lotus(ctx: Ctx, fill: Paint, cut: Paint) {
  ctx.fillStyle = fill;
  const petal = (angle: number, h: number, w: number) => {
    ctx.save();
    ctx.translate(0, 0.14);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-w, -h * 0.35, -w * 0.55, -h * 0.85, 0, -h);
    ctx.bezierCurveTo(w * 0.55, -h * 0.85, w, -h * 0.35, 0, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.12);
    ctx.lineTo(0, -h * 0.78);
    strokeLine(ctx, 0.012, cut);
    ctx.restore();
  };
  for (const [a, h, w] of [
    [-1.15, 0.34, 0.11],
    [1.15, 0.34, 0.11],
    [-0.75, 0.44, 0.13],
    [0.75, 0.44, 0.13],
    [-0.36, 0.52, 0.14],
    [0.36, 0.52, 0.14],
    [0, 0.58, 0.15],
  ] as const)
    petal(a, h, w);
  // base bowl + stem + leaves
  ctx.beginPath();
  ctx.ellipse(0, 0.16, 0.22, 0.06, 0, 0, Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0.2);
  ctx.lineTo(0, 0.42);
  strokeLine(ctx, 0.022, fill);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0.36);
    ctx.quadraticCurveTo(s * 0.18, 0.26, s * 0.28, 0.34);
    ctx.quadraticCurveTo(s * 0.16, 0.42, 0, 0.36);
    ctx.fill();
  }
}

/* ---------------------------------------------------------------- annam (swan) */
function annam(ctx: Ctx, fill: Paint, cut: Paint) {
  ctx.fillStyle = fill;
  // body (boat shape)
  ctx.beginPath();
  ctx.moveTo(-0.3, 0.02);
  ctx.quadraticCurveTo(-0.22, 0.3, 0.06, 0.28);
  ctx.quadraticCurveTo(0.26, 0.26, 0.26, 0.08);
  ctx.quadraticCurveTo(0.0, 0.14, -0.3, 0.02);
  ctx.fill();
  // neck S-curve and head
  ctx.beginPath();
  ctx.moveTo(0.16, 0.1);
  ctx.bezierCurveTo(0.34, 0.02, 0.06, -0.2, 0.2, -0.33);
  strokeLine(ctx, 0.06, fill);
  ctx.beginPath();
  ctx.arc(0.23, -0.34, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0.27, -0.36);
  ctx.lineTo(0.37, -0.32);
  ctx.lineTo(0.27, -0.31);
  ctx.fill();
  // tail plumes curling up and back
  for (const [r, off] of [
    [0.1, 0],
    [0.08, 0.07],
    [0.06, 0.13],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(-0.24, 0.06 - off);
    ctx.bezierCurveTo(-0.36, -0.06 - off, -0.42, -0.2 - off, -0.3 + r * 0.2, -0.24 - off);
    ctx.arc(-0.31, -0.2 - off, r * 0.4, -1.2, 2.2);
    strokeLine(ctx, 0.03, fill);
  }
  // details: wing feathers and eye
  for (const k of [0, 1, 2]) {
    ctx.beginPath();
    ctx.moveTo(-0.14 + k * 0.08, 0.1);
    ctx.quadraticCurveTo(-0.06 + k * 0.08, 0.06, 0.02 + k * 0.08, 0.13);
    strokeLine(ctx, 0.013, cut);
  }
  ctx.fillStyle = cut;
  ctx.beginPath();
  ctx.arc(0.24, -0.35, 0.011, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------------------------------------------------------------- mango (maanga / paisley) */
function mango(ctx: Ctx, fill: Paint, cut: Paint) {
  const shape = (s: number) => {
    ctx.beginPath();
    ctx.moveTo(0.02 * s, 0.42 * s);
    ctx.bezierCurveTo(-0.38 * s, 0.32 * s, -0.36 * s, -0.22 * s, 0.0, -0.3 * s);
    ctx.bezierCurveTo(0.22 * s, -0.36 * s, 0.34 * s, -0.12 * s, 0.18 * s, 0.02 * s);
    ctx.bezierCurveTo(0.08 * s, 0.12 * s, 0.22 * s, 0.32 * s, 0.02 * s, 0.42 * s);
    ctx.closePath();
  };
  ctx.fillStyle = fill;
  shape(1);
  ctx.fill();
  ctx.save();
  ctx.translate(-0.02, 0.02);
  shape(0.62);
  strokeLine(ctx, 0.022, cut);
  ctx.restore();
  ctx.fillStyle = cut;
  for (const [x, y] of [
    [-0.05, -0.02],
    [-0.08, 0.1],
    [0.0, 0.17],
    [0.04, -0.12],
  ])
    ctx.beginPath(), ctx.arc(x, y, 0.022, 0, Math.PI * 2), ctx.fill();
  // curl at the tip
  ctx.beginPath();
  ctx.arc(0.16, -0.2, 0.06, Math.PI * 0.2, Math.PI * 1.6);
  strokeLine(ctx, 0.02, cut);
}

/* ---------------------------------------------------------------- chakram (wheel) */
function chakram(ctx: Ctx, fill: Paint, cut: Paint) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(0, 0, 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 0.33, 0, Math.PI * 2);
  strokeLine(ctx, 0.02, cut);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, -0.19, 0.045, 0.11, 0, 0, Math.PI * 2);
    strokeLine(ctx, 0.016, cut);
    ctx.restore();
  }
  ctx.fillStyle = cut;
  ctx.beginPath();
  ctx.arc(0, 0, 0.06, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 0.375, Math.sin(a) * 0.375, 0.014, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---------------------------------------------------------------- rudraksha (beads) */
function rudraksha(ctx: Ctx, fill: Paint, cut: Paint) {
  ctx.fillStyle = fill;
  const beads: [number, number, number][] = [
    [0, -0.22, 0.15],
    [-0.2, 0.1, 0.15],
    [0.2, 0.1, 0.15],
    [0, 0.0, 0.09],
  ];
  beads.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = cut;
  beads.slice(0, 3).forEach(([x, y, r]) => {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/* ---------------------------------------------------------------- flower (poo) */
function flower(ctx: Ctx, fill: Paint, cut: Paint) {
  ctx.fillStyle = fill;
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i / 8) * Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(0, -0.24, 0.09, 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = cut;
  ctx.beginPath();
  ctx.arc(0, 0, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(0, 0, 0.065, 0, Math.PI * 2);
  ctx.fill();
}

const DRAW: Record<MotifId, (ctx: Ctx, fill: Paint, cut: Paint) => void> = {
  peacock,
  elephant,
  lotus,
  annam,
  mango,
  chakram,
  rudraksha,
  flower,
};

/** Draw a motif centred at (x, y) with the given size in pixels. */
export function drawMotif(ctx: Ctx, id: MotifId, x: number, y: number, size: number, fill: Paint, cut: Paint, flip = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -size : size, size);
  DRAW[id](ctx, fill, cut);
  ctx.restore();
}
