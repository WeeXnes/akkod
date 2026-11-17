// Parse a VIA definition's KLE-style layout into positioned keys.
// Each key: { row, col, x, y, w, h, x2, y2, w2, h2, group, option, encoder, color }

export function parseKle(rows) {
  const keys = [];
  let y = 0;
  let cur = { c: '#cccccc' };
  for (const row of rows) {
    let x = 0;
    let next = {};
    for (const item of row) {
      if (typeof item === 'object') {
        if (item.x !== undefined) x += item.x;
        if (item.y !== undefined) y += item.y;
        if (item.c) cur.c = item.c;
        Object.assign(next, item);
        continue;
      }
      const labels = item.split('\n');
      const [r, c] = (labels[0] || '').split(',').map(Number);
      const opt = labels[3] ? labels[3].split(',').map(Number) : null;
      const enc = labels[9] && /^e\d+$/.test(labels[9]) ? Number(labels[9].slice(1)) : null;
      const w = next.w ?? 1;
      const h = next.h ?? 1;
      keys.push({
        row: r,
        col: c,
        x,
        y,
        w,
        h,
        x2: next.x2 ?? 0,
        y2: next.y2 ?? 0,
        w2: next.w2 ?? w,
        h2: next.h2 ?? h,
        group: opt ? opt[0] : null,
        option: opt ? opt[1] : null,
        encoder: enc,
        color: cur.c
      });
      x += w;
      next = {};
    }
    y += 1;
  }
  return keys;
}

/**
 * Pick the keys for the chosen layout options (VIA semantics): option 0 of each
 * group is the reference position; other options are shifted onto it.
 * `selected` maps group index -> option index.
 */
export function resolveLayout(keys, selected = {}) {
  const bbox = new Map();
  for (const k of keys) {
    if (k.group === null) continue;
    const id = `${k.group}:${k.option}`;
    const b = bbox.get(id) || { x: Infinity, y: Infinity };
    b.x = Math.min(b.x, k.x);
    b.y = Math.min(b.y, k.y);
    bbox.set(id, b);
  }
  const out = [];
  for (const k of keys) {
    if (k.group !== null) {
      if ((selected[k.group] ?? 0) !== k.option) continue;
      const ref = bbox.get(`${k.group}:0`);
      const own = bbox.get(`${k.group}:${k.option}`);
      out.push({ ...k, x: k.x + ref.x - own.x, y: k.y + ref.y - own.y });
    } else {
      out.push({ ...k });
    }
  }
  const minX = Math.min(...out.map((k) => k.x + Math.min(0, k.x2)));
  const minY = Math.min(...out.map((k) => k.y));
  for (const k of out) {
    k.x -= minX;
    k.y -= minY;
  }
  return out;
}

export function layoutSize(keys) {
  return {
    width: Math.max(...keys.map((k) => Math.max(k.x + k.w, k.x + k.x2 + k.w2))),
    height: Math.max(...keys.map((k) => Math.max(k.y + k.h, k.y + k.y2 + k.h2)))
  };
}

/**
 * Display-only spacing that matches the physical Akko 5075S case: F-row in
 * groups with 0.25u gaps and a 0.25u gap below it, the nav column set off
 * by 0.5u, and the arrow cluster dropped 0.25u. Matrix positions are untouched.
 * Expects keys from resolveLayout (normalised so Esc is at 0,0).
 */
export function applyPhysicalSpacing(keys) {
  const fRowShift = (col) => {
    if (col === 0) return 0;
    if (col <= 4) return 0.25;
    if (col <= 8) return 0.5;
    if (col <= 12) return 0.75;
    if (col === 13) return 0.5; // Del (VIA file already has a 0.5u gap)
    return 0.5; // knob, lined up with the nav column
  };
  const isArrow = (k) => (k.row === 4 && k.col === 14) || (k.row === 5 && k.col >= 13);
  return keys.map((k) => {
    const out = { ...k };
    if (k.row === 0) {
      out.x += fRowShift(k.col);
      return out;
    }
    out.y += 0.25;
    if (isArrow(k)) out.x += 0.25;
    else if (k.col === 15) out.x += 0.5; // nav column: 0.5u gap, double the F-row gaps
    if (isArrow(k)) out.y += 0.25;
    return out;
  });
}
