export interface BuildResult { ok: boolean; typecheck: boolean; stale: boolean }
export const APP: string
export const OUT: string
export function typecheck(): { ok: boolean; errors: string[] }
export function buildSite(): BuildResult
export function buildArtifact(): BuildResult
