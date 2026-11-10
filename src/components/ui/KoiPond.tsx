"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import { useZen } from "@/lib/useZen";

// One koi per this much viewport area
const PX_PER_KOI = 170_000;
const MIN_KOI = 3;
const MAX_KOI = 9;

// A koi is a chain of points: the head swims, the rest is pulled along behind
const NODES = 14;
// The body is this much of the length; the tail fin is the rest
const BODY = 0.78;
// Half the body's widest point, as a share of the length
const GIRTH = 0.11;

// Koi turn away from a moving pointer inside this radius
const SHY_REACH = 150;

// The page's content sits in the pond like stones: koi steer round whatever is
// inside the element marked data-pond-stones
const STONES = "[data-pond-stones] > *";
// Breathing room kept around a stone
const STONE_PAD = 16;
// Koi only steer round the content if that leaves them water to swim in: this
// much room beside it, or this much of the viewport clear of it
const MIN_CHANNEL = 120;
const MIN_OPEN_WATER = 0.5;
// How much of itself a koi keeps while it's under the content, where there's
// no way round (a phone) or the page was scrolled over it
const UNDER_STONE = 0.45;

// A click on the water throws in a handful of pellets, which float for a while
// and then sink
const HANDFUL = [4, 6];
const THROW_SPREAD = 30;
const MAX_PELLETS = 24;
const PELLET_LIFE = 14;
const PELLET_SINK = 4;
// How far off a koi notices food
const SMELL_REACH = 520;
// Clicks on these are for the page, not the pond
const NOT_WATER = "a, button, input, textarea, select, label, [role='button']";

const SKIN = {
  white: "243, 238, 229",
  red: "216, 70, 42",
  orange: "236, 122, 45",
  gold: "237, 170, 62",
  black: "34, 32, 31",
};

// The koi are kept soft, as if a little way under the surface. White koi need
// an outline to show on the light page. A shadow can't darken the dark page,
// so there each koi gets a faint pool of light on the pond floor for its
// shadow to fall across.
const LOOKS = {
  dark: {
    opacity: 0.6,
    outline: null,
    shadow: "rgba(0, 0, 0, 0.75)",
    pool: "255, 255, 255",
    ripple: "205, 228, 232",
    pellet: "214, 168, 104",
  },
  light: {
    opacity: 0.8,
    outline: "rgba(60, 50, 40, 0.22)",
    shadow: "rgba(40, 50, 60, 0.1)",
    pool: null,
    ripple: "70, 100, 112",
    pellet: "150, 104, 52",
  },
};

type Point = { x: number; y: number };
type Box = { left: number; top: number; right: number; bottom: number };

type Pellet = {
  x: number;
  y: number;
  // A slow drift once it's floating
  vx: number;
  vy: number;
  age: number;
  // It's in the air until this age, and koi can't eat it yet
  landAt: number;
  landed: boolean;
};

// A marking: where along the spine, how far to one side, and how big
type Patch = { node: number; side: number; size: number; color: string };

type Koi = {
  spine: Point[];
  length: number;
  heading: number;
  turn: number;
  speed: number;
  cruise: number;
  // Tail-beat phase
  beat: number;
  // Wandering: a gentle turn that's re-rolled every few seconds
  drift: number;
  driftFor: number;
  // Where it heads back to after swimming off the edge
  home: Point;
  // How hurried it is, 0 to 1: up near the pointer, easing back down
  rush: number;
  // The pellet it's going for. It sticks with one, so a second handful
  // doesn't yank it around.
  food: Pellet | null;
  // Fades down while it's under the page's content
  alpha: number;
  skin: string;
  patches: Patch[];
};

type Ripple = {
  x: number;
  y: number;
  age: number;
  life: number;
  reach: number;
  rings: number;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
// The shortest way round from one angle to another
const turnTo = (from: number, to: number) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

// Half-width along the body, 0 at the head to 1 at the tail: a blunt head,
// widest at the shoulders, tapering to the tail stalk
const girth = (s: number) =>
  s < 0.25
    ? 0.6 + 0.4 * Math.sin((s / 0.25) * (Math.PI / 2))
    : 1 - 0.86 * Math.pow((s - 0.25) / 0.75, 1.3);

const paint = (): Pick<Koi, "skin" | "patches"> => {
  const patch = (color: string, size: number, node = rand(1, 10)): Patch => ({
    node: Math.round(node),
    side: rand(-0.7, 0.7),
    size,
    color,
  });
  const some = (count: number, make: () => Patch) =>
    Array.from({ length: Math.round(count) }, make);
  const warm = Math.random() < 0.5 ? SKIN.red : SKIN.orange;

  const kind = Math.random();
  // Kohaku: white with red
  if (kind < 0.4) {
    return {
      skin: SKIN.white,
      patches: some(rand(3, 5), () => patch(warm, rand(0.7, 1.3))),
    };
  }
  // Sanke: white with red and a few flecks of black
  if (kind < 0.65) {
    return {
      skin: SKIN.white,
      patches: [
        ...some(rand(2, 4), () => patch(warm, rand(0.7, 1.2))),
        ...some(rand(2, 4), () => patch(SKIN.black, rand(0.25, 0.5))),
      ],
    };
  }
  // Tancho: white with a single red spot on the head
  if (kind < 0.8) {
    return {
      skin: SKIN.white,
      patches: [{ node: 1, side: 0, size: 0.55, color: SKIN.red }],
    };
  }
  // Ogon: one solid colour
  return { skin: Math.random() < 0.5 ? SKIN.gold : SKIN.orange, patches: [] };
};

const inside = (box: Box, x: number, y: number, pad = 0) =>
  x > box.left - pad &&
  x < box.right + pad &&
  y > box.top - pad &&
  y < box.bottom + pad;

// A random spot in the viewport, clear of the stones if a few tries find one
const openWater = (width: number, height: number, stones: Box[]): Point => {
  let spot = { x: 0, y: 0 };
  for (let tries = 0; tries < 12; tries++) {
    spot = { x: width * rand(0.05, 0.95), y: height * rand(0.05, 0.95) };
    if (!stones.some((stone) => inside(stone, spot.x, spot.y, 40))) break;
  }
  return spot;
};

const spawn = (head: Point, scale: number): Koi => {
  // Mostly grown koi, with the odd young one
  const length = (Math.random() < 0.25 ? rand(55, 75) : rand(90, 150)) * scale;
  const heading = rand(0, Math.PI * 2);
  const gap = (length * BODY) / (NODES - 1);
  const cruise = rand(16, 30);
  return {
    spine: Array.from({ length: NODES }, (_, i) => ({
      x: head.x - Math.cos(heading) * gap * i,
      y: head.y - Math.sin(heading) * gap * i,
    })),
    length,
    heading,
    turn: 0,
    speed: cruise,
    cruise,
    beat: rand(0, Math.PI * 2),
    drift: 0,
    driftFor: 0,
    home: head,
    rush: 0,
    food: null,
    alpha: 1,
    ...paint(),
  };
};

// A closed curve through the midpoints of a ring of points (x, y, x, y, …),
// which rounds every corner off
const smooth = (ring: number[]) => {
  const path = new Path2D();
  const count = ring.length / 2;
  const mid = (i: number, j: number) =>
    [
      (ring[i * 2] + ring[j * 2]) / 2,
      (ring[i * 2 + 1] + ring[j * 2 + 1]) / 2,
    ] as const;
  path.moveTo(...mid(count - 1, 0));
  for (let i = 0; i < count; i++) {
    path.quadraticCurveTo(
      ring[i * 2],
      ring[i * 2 + 1],
      ...mid(i, (i + 1) % count),
    );
  }
  path.closePath();
  return path;
};

const PondCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  // A ref, so switching theme restyles the pond without restarting it
  const look = useRef<(typeof LOOKS)[keyof typeof LOOKS]>(LOOKS.dark);
  look.current = resolvedTheme === "light" ? LOOKS.light : LOOKS.dark;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    const school: Koi[] = [];
    const ripples: Ripple[] = [];
    let pellets: Pellet[] = [];

    const ring = (x: number, y: number, reach: number, rings = 2) =>
      ripples.push({ x, y, age: 0, life: 2 + reach / 60, reach, rings });

    // Pages come and go, so the list of stones is re-read now and then. They
    // move as the page scrolls, so they're measured every frame.
    let stoneEls: Element[] = [];
    let stones: Box[] = [];
    // Whether there's enough water left around the stones to swim round them
    let roundStones = false;
    const findStones = () => {
      stoneEls = Array.from(document.querySelectorAll(STONES));
    };
    const measure = () => {
      stones = [];
      let covered = 0;
      let channel = Infinity;
      for (const el of stoneEls) {
        const rect = el.getBoundingClientRect();
        const left = Math.max(rect.left, 0);
        const right = Math.min(rect.right, width);
        const top = Math.max(rect.top, 0);
        const bottom = Math.min(rect.bottom, height);
        if (right <= left || bottom <= top) continue;
        stones.push({
          left: rect.left - STONE_PAD,
          top: rect.top - STONE_PAD,
          right: rect.right + STONE_PAD,
          bottom: rect.bottom + STONE_PAD,
        });
        covered += (right - left) * (bottom - top);
        channel = Math.min(channel, Math.max(left, width - right));
      }
      roundStones =
        channel >= MIN_CHANNEL ||
        covered < width * height * (1 - MIN_OPEN_WATER);
    };

    // The push a point feels from the stones near it: away from an edge within
    // `reach`, or out through the nearest edge if it's inside one
    const push = (x: number, y: number, reach: number, out: Point) => {
      for (const stone of stones) {
        const dx = x - clamp(x, stone.left, stone.right);
        const dy = y - clamp(y, stone.top, stone.bottom);
        const distance = Math.hypot(dx, dy);
        if (distance > reach) continue;
        if (distance > 0) {
          const near = 1 - distance / reach;
          out.x += (dx / distance) * near;
          out.y += (dy / distance) * near;
          continue;
        }
        const exits = [
          x - stone.left,
          stone.right - x,
          y - stone.top,
          stone.bottom - y,
        ];
        const nearest = exits.indexOf(Math.min(...exits));
        out.x += nearest === 0 ? -1 : nearest === 1 ? 1 : 0;
        out.y += nearest === 2 ? -1 : nearest === 3 ? 1 : 0;
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = clamp(
        Math.round((width * height) / PX_PER_KOI),
        MIN_KOI,
        MAX_KOI,
      );
      // Smaller koi on a phone, so they don't crowd it
      const scale = clamp(width / 1100, 0.6, 1);
      measure();
      while (school.length < count) {
        school.push(spawn(openWater(width, height, stones), scale));
      }
      school.length = count;
      // Big ones last, so the young swim underneath them
      school.sort((a, b) => a.length - b.length);
    };
    findStones();
    resize();
    window.addEventListener("resize", resize);
    const findTimer = setInterval(findStones, 1000);

    const pointer = { x: 0, y: 0, time: -Infinity };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.time = performance.now();
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // A click or tap on the water throws in a handful of food. Links, buttons
    // and text being selected are left alone, and so is the content itself
    // where koi can't get to it.
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(NOT_WATER)) return;
      if (document.querySelector("[aria-modal='true']")) return;
      if (window.getSelection()?.toString()) return;
      const { clientX: x, clientY: y } = e;
      if (roundStones && stones.some((stone) => inside(stone, x, y))) return;

      ring(x, y, 46);
      const [min, max] = HANDFUL;
      // A full pond takes no more, rather than dropping pellets koi are after
      const count = Math.min(
        Math.round(rand(min, max)),
        MAX_PELLETS - pellets.length,
      );
      for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const far = Math.sqrt(Math.random()) * THROW_SPREAD;
        const drift = rand(2, 5);
        pellets.push({
          x: x + Math.cos(angle) * far,
          y: y + Math.sin(angle) * far,
          vx: Math.cos(angle) * drift,
          vy: Math.sin(angle) * drift,
          age: 0,
          landAt: rand(0.1, 0.45),
          landed: false,
        });
      }
    };
    window.addEventListener("click", onClick);

    const float = (dt: number) => {
      const slow = Math.exp(-dt * 0.3);
      pellets = pellets.filter((pellet) => {
        pellet.age += dt;
        if (!pellet.landed && pellet.age >= pellet.landAt) {
          pellet.landed = true;
          ring(pellet.x, pellet.y, 12, 1);
        }
        if (pellet.landed) {
          pellet.vx *= slow;
          pellet.vy *= slow;
          pellet.x += pellet.vx * dt;
          pellet.y += pellet.vy * dt;
        }
        return pellet.age < PELLET_LIFE;
      });
    };

    // The nearest pellet it can smell, keeping to the one it's already after
    const smell = (koi: Koi) => {
      if (koi.food && pellets.includes(koi.food)) return koi.food;
      const [head] = koi.spine;
      let nearest: Pellet | null = null;
      let reach = SMELL_REACH;
      for (const pellet of pellets) {
        if (!pellet.landed) continue;
        const distance = Math.hypot(pellet.x - head.x, pellet.y - head.y);
        if (distance < reach) {
          reach = distance;
          nearest = pellet;
        }
      }
      return (koi.food = nearest);
    };

    const swim = (koi: Koi, dt: number, now: number) => {
      const [head] = koi.spine;

      koi.driftFor -= dt;
      if (koi.driftFor <= 0) {
        koi.drift = rand(-0.3, 0.3);
        koi.driftFor = rand(2, 6);
        koi.home = openWater(width, height, roundStones ? stones : []);
      }
      let steer = koi.drift;

      // Let it slip off the edge a little, then bring it back round
      const margin = koi.length * 0.4;
      if (
        head.x < -margin ||
        head.x > width + margin ||
        head.y < -margin ||
        head.y > height + margin
      ) {
        const back = Math.atan2(koi.home.y - head.y, koi.home.x - head.x);
        steer = clamp(turnTo(koi.heading, back) * 1.5, -0.8, 0.8);
      }

      // Food comes before wandering: it turns for the pellet, and only speeds
      // up once it's pointing at it, so it doesn't circle one it can't reach
      const food = smell(koi);
      let hunger = 0;
      if (food) {
        const to = Math.atan2(food.y - head.y, food.x - head.x);
        const off = turnTo(koi.heading, to);
        steer = clamp(off * 3, -2.4, 2.4);
        hunger = Math.max(0, Math.cos(off));

        const mouth = koi.length * 0.1 + 6;
        if (Math.hypot(food.x - head.x, food.y - head.y) < mouth) {
          pellets = pellets.filter((pellet) => pellet !== food);
          koi.food = null;
          ring(head.x, head.y, 26);
        }
      }

      // Round the stones. It feels for them at its head and a little way ahead,
      // so it starts to turn before it arrives.
      if (roundStones) {
        const reach = koi.length * 0.35 + 20;
        const look = koi.length * 0.5;
        const away = { x: 0, y: 0 };
        push(head.x, head.y, reach, away);
        push(
          head.x + Math.cos(koi.heading) * look,
          head.y + Math.sin(koi.heading) * look,
          reach,
          away,
        );
        const force = Math.min(1, Math.hypot(away.x, away.y));
        if (force > 0) {
          const out = Math.atan2(away.y, away.x);
          steer += clamp(turnTo(koi.heading, out) * 2.5, -2, 2) * force;
        }
      }

      // Under a stone it fades, by how much of it is under
      let under = 0;
      for (let i = 0; i < NODES; i += 2) {
        const { x, y } = koi.spine[i];
        if (stones.some((stone) => inside(stone, x, y, -STONE_PAD))) under++;
      }
      const alpha = 1 - (1 - UNDER_STONE) * (under / (NODES / 2));
      koi.alpha += (alpha - koi.alpha) * Math.min(1, dt * 2.5);

      // Shy of a pointer that's moving nearby, but not of one left parked, and
      // not when there's food about
      const fromPointer = Math.hypot(head.x - pointer.x, head.y - pointer.y);
      if (!food && now - pointer.time < 1500 && fromPointer < SHY_REACH) {
        const near = 1 - fromPointer / SHY_REACH;
        const away = Math.atan2(head.y - pointer.y, head.x - pointer.x);
        steer += clamp(turnTo(koi.heading, away) * 2, -1.4, 1.4) * near;
        koi.rush = Math.max(koi.rush, near * 0.35);
      }
      koi.rush = Math.max(koi.rush * Math.exp(-dt * 1.1), hunger * 0.3);

      // Eased, so it never jerks into a turn or a sprint
      koi.turn += (steer - koi.turn) * Math.min(1, dt * 3);
      koi.heading += koi.turn * dt;
      const pace = koi.cruise * (1 + koi.rush * 4);
      koi.speed += (pace - koi.speed) * Math.min(1, dt * 4);
      // Small koi beat their tails faster
      koi.beat += dt * (2 + koi.speed * 0.09) * Math.sqrt(110 / koi.length);

      head.x += Math.cos(koi.heading) * koi.speed * dt;
      head.y += Math.sin(koi.heading) * koi.speed * dt;

      const gap = (koi.length * BODY) / (NODES - 1);
      for (let i = 1; i < NODES; i++) {
        const lead = koi.spine[i - 1];
        const node = koi.spine[i];
        const dx = node.x - lead.x;
        const dy = node.y - lead.y;
        const stretch = gap / (Math.hypot(dx, dy) || 1);
        node.x = lead.x + dx * stretch;
        node.y = lead.y + dy * stretch;
      }
    };

    const draw = (koi: Koi) => {
      const { outline, shadow, pool } = look.current;
      const half = koi.length * GIRTH;

      // Each node's position once the swimming wave is added, the way it's
      // facing (fx, fy) and its left-hand side (nx, ny)
      const xs: number[] = [];
      const ys: number[] = [];
      const fxs: number[] = [];
      const fys: number[] = [];
      for (let i = 0; i < NODES; i++) {
        const ahead = koi.spine[Math.max(i - 1, 0)];
        const behind = koi.spine[Math.min(i + 1, NODES - 1)];
        const dx = ahead.x - behind.x;
        const dy = ahead.y - behind.y;
        const d = Math.hypot(dx, dy) || 1;
        const fx = dx / d;
        const fy = dy / d;
        // The wave travels down the body and grows towards the tail
        const s = i / (NODES - 1);
        const wave =
          Math.sin(koi.beat - i * 0.45) * koi.length * 0.05 * Math.pow(s, 1.6);
        xs.push(koi.spine[i].x - fy * wave);
        ys.push(koi.spine[i].y + fx * wave);
        fxs.push(fx);
        fys.push(fy);
      }
      // A point on the body: `along` the facing and `across` to the left
      const at = (i: number, along: number, across: number) =>
        [
          xs[i] + fxs[i] * along - fys[i] * across,
          ys[i] + fys[i] * along + fxs[i] * across,
        ] as const;

      // Up the left side from the nose, round the tail stalk, back down the right
      const ring: number[] = [...at(0, half * 0.9, 0)];
      for (let i = 0; i < NODES; i++) {
        ring.push(...at(i, 0, half * girth(i / (NODES - 1))));
      }
      for (let i = NODES - 1; i >= 0; i--) {
        ring.push(...at(i, 0, -half * girth(i / (NODES - 1))));
      }
      const body = smooth(ring);

      // A fin: a leaf from `root` pointing along `angle`
      const fins = new Path2D();
      const fin = (
        root: readonly [number, number],
        angle: number,
        long: number,
        wide: number,
      ) => {
        const x = root[0] + (Math.cos(angle) * long) / 2;
        const y = root[1] + (Math.sin(angle) * long) / 2;
        fins.moveTo(
          x + Math.cos(angle) * (long / 2),
          y + Math.sin(angle) * (long / 2),
        );
        fins.ellipse(x, y, long / 2, wide / 2, angle, 0, Math.PI * 2);
      };
      const facing = (i: number) => Math.atan2(fys[i], fxs[i]);
      // Pectorals at the shoulders, sculling with the tail; pelvics further back
      const scull = Math.sin(koi.beat) * 0.18;
      for (const side of [-1, 1]) {
        fin(
          at(3, 0, side * half * 0.8),
          facing(3) + Math.PI - side * (0.95 + side * scull),
          half * 1.9,
          half * 0.85,
        );
        fin(
          at(8, 0, side * half * 0.45),
          facing(8) + Math.PI - side * 0.6,
          half * 0.95,
          half * 0.4,
        );
      }

      // The tail fin: two lobes that trail the wave by a beat
      const last = NODES - 1;
      const swing = Math.sin(koi.beat - last * 0.45 - 0.7) * 0.45;
      const back = facing(last) + Math.PI + swing;
      const tailLength = koi.length * (1 - BODY) * 1.25;
      const lobe = (angle: number, reach: number) =>
        [
          xs[last] + Math.cos(back + angle) * tailLength * reach,
          ys[last] + Math.sin(back + angle) * tailLength * reach,
        ] as const;
      const stalk = half * girth(1);
      fins.moveTo(...at(last, 0, stalk));
      fins.quadraticCurveTo(...lobe(0.75, 0.55), ...lobe(0.42, 1));
      fins.quadraticCurveTo(...lobe(0.12, 0.7), ...lobe(0, 0.5));
      fins.quadraticCurveTo(...lobe(-0.12, 0.7), ...lobe(-0.42, 1));
      fins.quadraticCurveTo(...lobe(-0.75, 0.55), ...at(last, 0, -stalk));
      fins.closePath();

      ctx.globalAlpha = koi.alpha;

      // The shadow on the pond floor
      ctx.save();
      ctx.translate(koi.length * 0.05, koi.length * 0.08);
      if (pool) {
        const mid = Math.floor(NODES / 2);
        const glow = ctx.createRadialGradient(
          xs[mid],
          ys[mid],
          0,
          xs[mid],
          ys[mid],
          koi.length * 0.8,
        );
        glow.addColorStop(0, `rgba(${pool}, 0.1)`);
        glow.addColorStop(1, `rgba(${pool}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(xs[mid], ys[mid], koi.length * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = shadow;
      ctx.fill(body);
      ctx.restore();

      ctx.fillStyle = `rgba(${koi.skin}, 0.5)`;
      ctx.fill(fins);
      ctx.fillStyle = `rgb(${koi.skin})`;
      ctx.fill(body);
      if (outline) {
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1;
        ctx.stroke(fins);
        ctx.stroke(body);
      }

      // Markings are painted on the skin, so they bend with the body
      ctx.save();
      ctx.clip(body);
      for (const { node, side, size, color } of koi.patches) {
        const [x, y] = at(node, 0, side * half * girth(node / (NODES - 1)));
        ctx.beginPath();
        ctx.ellipse(
          x,
          y,
          size * half * 1.5,
          size * half,
          facing(node),
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = `rgb(${color})`;
        ctx.fill();
      }
      ctx.restore();

      // The dorsal fin, as a soft ridge down the back
      ctx.beginPath();
      ctx.moveTo(xs[4], ys[4]);
      for (let i = 5; i <= 9; i++) ctx.lineTo(xs[i], ys[i]);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.14)";
      ctx.lineWidth = half * 0.16;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.beginPath();
      for (const side of [-1, 1]) {
        const [x, y] = at(0, half * 0.3, side * half * 0.5);
        ctx.moveTo(x, y);
        ctx.arc(x, y, Math.max(1, half * 0.09), 0, Math.PI * 2);
      }
      ctx.fillStyle = "rgba(20, 20, 20, 0.85)";
      ctx.fill();
    };

    let frame = 0;
    let last = performance.now();
    // Now and then something breaks the surface on its own
    let nextDrop = 2;
    const tick = (now: number) => {
      // Capped, so koi don't leap after the tab has been in the background
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx.clearRect(0, 0, width, height);

      measure();
      float(dt);
      for (const koi of school) {
        swim(koi, dt, now);
        draw(koi);
      }
      ctx.globalAlpha = 1;

      // Pellets fade as they sink
      for (const pellet of pellets) {
        if (!pellet.landed) continue;
        const left = (PELLET_LIFE - pellet.age) / PELLET_SINK;
        ctx.beginPath();
        ctx.arc(pellet.x, pellet.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${look.current.pellet}, ${Math.min(1, left)})`;
        ctx.fill();
      }

      nextDrop -= dt;
      if (nextDrop <= 0) {
        nextDrop = rand(2.5, 6);
        ripples.push({
          x: rand(0, width),
          y: rand(0, height),
          age: 0,
          life: 3,
          reach: rand(22, 38),
          rings: 2,
        });
      }

      ctx.lineWidth = 1.2;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.age += dt;
        if (ripple.age >= ripple.life) {
          ripples.splice(i, 1);
          continue;
        }
        // Each ring sets off a little after the one before, and is fainter
        for (let ring = 0; ring < ripple.rings; ring++) {
          const delay = ring * 0.16;
          const t = (ripple.age / ripple.life - delay) / (1 - delay);
          if (t <= 0) continue;
          ctx.beginPath();
          ctx.arc(
            ripple.x,
            ripple.y,
            ripple.reach * (1 - (1 - t) * (1 - t)),
            0,
            Math.PI * 2,
          );
          const alpha = (1 - t) * (1 - t) * 0.55 * (1 - ring * 0.25);
          ctx.strokeStyle = `rgba(${look.current.ripple}, ${alpha})`;
          ctx.stroke();
        }
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(findTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      aria-hidden
      // Behind the page, so the koi swim under the text
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: look.current.opacity }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6 }}
    />
  );
};

// Easter egg: a koi pond behind the whole page, toggled from the command
// palette. The koi swim round the content, and a click on the water feeds them.
export const KoiPond = () => {
  const { isZen } = useZen();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isZen && !reduceMotion && <PondCanvas />}
    </AnimatePresence>
  );
};
