/**
 * Split an integer total into integer parts proportional to weights, using the largest
 * remainder method. The parts always sum exactly to `total`.
 */
export function allocate(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  if (total < 0) return allocate(-total, weights).map((x) => (x === 0 ? 0 : -x));
  const wSum = weights.reduce((a, b) => a + Math.max(0, b), 0);
  const w = wSum > 0 ? weights.map((x) => Math.max(0, x)) : weights.map(() => 1);
  const ws = wSum > 0 ? wSum : n;
  const raw = w.map((x) => (total * x) / ws);
  const parts = raw.map((x) => Math.floor(x + 1e-9));
  let rest = total - parts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - parts[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; rest > 0; k = (k + 1) % n, rest--) parts[order[k].i]++;
  return parts;
}

export const splitEqual = (total: number, n: number) => allocate(total, Array(n).fill(1));
