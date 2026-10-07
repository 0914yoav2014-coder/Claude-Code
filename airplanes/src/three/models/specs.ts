import type { Plane, PlaneId } from '../../data/types'

/**
 * Build parameters for the procedural models, in metres. Overall length, span, fuselage width,
 * engine count/type, wing position, gear, decks, hump and tip style come from `PLANES[i].shape`
 * (Content verifies those); the rest (chords, sweeps, where the wing sits) are read off public
 * three-view drawings and kept proportional. Nose toward −Z, +X = right (starboard), +Y up.
 */
export interface SurfaceSpec {
  /** Root leading edge as a fraction of the fuselage length from the nose. */
  at: number
  rootChord: number
  tipChord: number
  /** Half span (horizontal surfaces) or height (fin). */
  span: number
  sweep: number
  dihedral: number
  thick: number
  /** Root height relative to the fuselage centre line, in fuselage radii (−1 bottom, 1 top). */
  y: number
}

export interface EngineSpec {
  /** Spanwise stations (0..1 of the half span) of the engines on each wing. */
  eta: number[]
  length: number
  diameter: number
  /** How far the nacelle's front sits ahead of the wing's leading edge (fraction of its length). */
  ahead: number
  /** Gap below the wing (turbofans hang on pylons). */
  drop: number
}

export interface FuselageSpec {
  /** Height / width. */
  aspect: number
  /** Super-ellipse exponent of the cross-section (2 = ellipse; boxier above). */
  n: number
  nose: number
  /** 0.5 blunt airliner nose … ~1 sharp cone. */
  nosePow: number
  /** Nose tip height in radii (negative: below the centre line). */
  noseY: number
  tail: number
  /** Tail cone end height in radii (upsweep) and radius. */
  tailY: number
  tailR: number
  /** 747 hump height in radii (0 = none) and where it ends (fraction). */
  hump: number
  humpEnd: number
  /** Concorde: droop hinge (fraction) and angle in degrees. */
  droopAt: number
  droop: number
}

export interface ModelSpec {
  id: PlaneId
  length: number
  width: number
  span: number
  fuselage: FuselageSpec
  wing: SurfaceSpec & { ogee?: boolean; mount: 'low' | 'high' | 'delta' }
  stab: SurfaceSpec | null
  fin: SurfaceSpec
  engines: EngineSpec
  engineType: 'turbofan' | 'turboprop' | 'piston' | 'turbojet'
  tips: 'sharklet' | 'raked' | 'winglet' | 'plain'
  gear: 'retractable' | 'fixed' | 'floats'
  /** Height of the fuselage bottom above the ground at rest (gear down), metres. */
  clearance: number
  decks: 1 | 2
  /** Livery: window line(s) as v around the section (right side; left mirrors), window pitch (m). */
  windows: { v: number[]; pitch: number; w: number; h: number; from: number; to: number; upper?: { v: number; from: number; to: number } }
  doors: number[]
  cockpit: number
  mask: boolean
}

const AIRLINER: FuselageSpec = { aspect: 1.02, n: 2, nose: 0.1, nosePow: 0.5, noseY: -0.32, tail: 0.74, tailY: 0.42, tailR: 0.1, hump: 0, humpEnd: 0, droopAt: 0, droop: 0 }

const BASE: Record<PlaneId, Omit<ModelSpec, 'id' | 'length' | 'width' | 'span' | 'engineType' | 'tips' | 'gear' | 'decks'>> = {
  a350: {
    fuselage: { ...AIRLINER, nose: 0.095 },
    wing: { at: 0.345, rootChord: 11.6, tipChord: 2.3, span: 0, sweep: 33, dihedral: 6, thick: 0.13, y: -0.55, mount: 'low' },
    stab: { at: 0.855, rootChord: 5.4, tipChord: 1.8, span: 9.7, sweep: 36, dihedral: 7, thick: 0.1, y: 0.05 },
    fin: { at: 0.775, rootChord: 10.2, tipChord: 3.3, span: 9.2, sweep: 42, dihedral: 0, thick: 0.11, y: 0.92 },
    engines: { eta: [0.34], length: 7.2, diameter: 3.5, ahead: 0.62, drop: 0.35 },
    clearance: 2.3,
    windows: { v: [0.292], pitch: 0.58, w: 0.27, h: 0.38, from: 0.13, to: 0.79 },
    doors: [0.105, 0.29, 0.56, 0.8],
    cockpit: 0.045,
    mask: true,
  },
  a380: {
    fuselage: { ...AIRLINER, aspect: 1.18, nose: 0.105, noseY: -0.38, tailY: 0.4 },
    wing: { at: 0.33, rootChord: 17.2, tipChord: 4.0, span: 0, sweep: 34, dihedral: 5.6, thick: 0.12, y: -0.6, mount: 'low' },
    stab: { at: 0.85, rootChord: 7.6, tipChord: 2.6, span: 15.0, sweep: 37, dihedral: 6, thick: 0.1, y: 0.0 },
    fin: { at: 0.765, rootChord: 13, tipChord: 4.6, span: 12.6, sweep: 40, dihedral: 0, thick: 0.11, y: 0.9 },
    engines: { eta: [0.29, 0.6], length: 7.2, diameter: 3.5, ahead: 0.6, drop: 0.4 },
    clearance: 2.8,
    windows: { v: [0.282, 0.378], pitch: 0.58, w: 0.27, h: 0.38, from: 0.12, to: 0.81 },
    doors: [0.1, 0.3, 0.56, 0.79],
    cockpit: 0.05,
    mask: false,
  },
  b747: {
    fuselage: { ...AIRLINER, nose: 0.085, noseY: -0.3, hump: 0.48, humpEnd: 0.4 },
    wing: { at: 0.37, rootChord: 14.6, tipChord: 3.0, span: 0, sweep: 38, dihedral: 7, thick: 0.12, y: -0.55, mount: 'low' },
    stab: { at: 0.86, rootChord: 6.6, tipChord: 2.2, span: 11, sweep: 40, dihedral: 7, thick: 0.1, y: 0.05 },
    fin: { at: 0.79, rootChord: 11.6, tipChord: 4.0, span: 10.2, sweep: 46, dihedral: 0, thick: 0.11, y: 0.92 },
    engines: { eta: [0.33, 0.62], length: 6.8, diameter: 3.3, ahead: 0.6, drop: 0.38 },
    clearance: 2.6,
    windows: { v: [0.29], pitch: 0.58, w: 0.27, h: 0.38, from: 0.1, to: 0.8, upper: { v: 0.42, from: 0.075, to: 0.31 } },
    doors: [0.12, 0.3, 0.55, 0.78],
    cockpit: 0.035,
    mask: false,
  },
  concorde: {
    fuselage: { aspect: 1.12, n: 2, nose: 0.17, nosePow: 0.92, noseY: -0.05, tail: 0.84, tailY: 0.2, tailR: 0.16, hump: 0, humpEnd: 0, droopAt: 0.075, droop: 5 },
    wing: { at: 0.3, rootChord: 37, tipChord: 2.8, span: 0, sweep: 0, dihedral: -1.5, thick: 0.035, y: -0.55, mount: 'delta', ogee: true },
    stab: null,
    fin: { at: 0.735, rootChord: 11.2, tipChord: 2.6, span: 6.8, sweep: 52, dihedral: 0, thick: 0.05, y: 0.85 },
    engines: { eta: [0.27, 0.42], length: 12, diameter: 1.25, ahead: 0, drop: 0 },
    clearance: 3.4,
    windows: { v: [0.285], pitch: 0.5, w: 0.17, h: 0.24, from: 0.21, to: 0.77 },
    doors: [0.2, 0.47, 0.76],
    cockpit: 0.115,
    mask: false,
  },
  twinotter: {
    fuselage: { aspect: 1.14, n: 2.7, nose: 0.17, nosePow: 0.62, noseY: -0.2, tail: 0.56, tailY: 0.35, tailR: 0.14, hump: 0, humpEnd: 0, droopAt: 0, droop: 0 },
    wing: { at: 0.27, rootChord: 1.98, tipChord: 1.98, span: 0, sweep: 0, dihedral: 2.5, thick: 0.15, y: 1.0, mount: 'high' },
    stab: { at: 0.84, rootChord: 1.45, tipChord: 1.1, span: 3.2, sweep: 4, dihedral: 0, thick: 0.1, y: 0.35 },
    fin: { at: 0.78, rootChord: 2.5, tipChord: 1.35, span: 2.5, sweep: 28, dihedral: 0, thick: 0.12, y: 0.9 },
    engines: { eta: [0.31], length: 3.3, diameter: 0.85, ahead: 0.62, drop: -0.05 },
    clearance: 1.35,
    windows: { v: [0.3], pitch: 0.92, w: 0.46, h: 0.42, from: 0.27, to: 0.6 },
    doors: [0.62],
    cockpit: 0.16,
    mask: false,
  },
  islander: {
    fuselage: { aspect: 1.22, n: 2.8, nose: 0.15, nosePow: 0.6, noseY: -0.18, tail: 0.55, tailY: 0.3, tailR: 0.15, hump: 0, humpEnd: 0, droopAt: 0, droop: 0 },
    wing: { at: 0.3, rootChord: 2.03, tipChord: 2.03, span: 0, sweep: 0, dihedral: 1.5, thick: 0.15, y: 1.0, mount: 'high' },
    stab: { at: 0.83, rootChord: 1.3, tipChord: 1.0, span: 2.3, sweep: 3, dihedral: 0, thick: 0.1, y: 0.45 },
    fin: { at: 0.77, rootChord: 2.0, tipChord: 1.05, span: 1.9, sweep: 26, dihedral: 0, thick: 0.12, y: 0.9 },
    engines: { eta: [0.3], length: 2.3, diameter: 0.8, ahead: 0.5, drop: 0.0 },
    clearance: 0.75,
    windows: { v: [0.3], pitch: 0.95, w: 0.48, h: 0.4, from: 0.26, to: 0.56 },
    doors: [0.42],
    cockpit: 0.16,
    mask: false,
  },
}

export function modelSpec(plane: Plane): ModelSpec {
  const s = plane.shape
  const b = BASE[plane.id]
  return {
    ...b,
    id: plane.id,
    length: s.lengthM,
    width: s.fuselageM,
    span: s.spanM,
    wing: { ...b.wing, span: s.spanM / 2 },
    engineType: s.engineType,
    tips: s.tips,
    gear: s.gear,
    decks: s.decks,
  }
}
