/**
 * Analytics hook (PRD F12). Pushes to window.dataLayer when a tag manager is present and always
 * fires an `aatw:track` DOM event any analytics tool (or a test) can listen for. No analytics
 * script ships with the site.
 */
export type TrackEvent =
  | 'start_exploring_click' // { location: 'hero' | 'nav' }
  | 'globe_interact' // { type: 'drag' | 'zoom' | 'keys' } (once per visit per type)
  | 'route_select' // { route, via }
  | 'hangar_view' // { plane, via }
  | 'closeup_open' // { plane }
  | 'signup_submit'
  | 'signup_success'
  | 'signup_error' // { reason }
  | 'lite_mode' // { reason }
  | 'tier_change' // { tier, step, reason }
  | 'motion_toggle' // { paused }
  | 'scroll_depth' // { section } — first time each section is reached (footer = "scrolled to the end")
  | 'fact_source' // { fact }

type Props = Record<string, string | number | boolean | null | undefined>

const sentOnce = new Set<string>()

export function track(event: TrackEvent, props: Props = {}, once = false): void {
  if (typeof window === 'undefined') return
  if (once) {
    const key = event + ':' + JSON.stringify(props)
    if (sentOnce.has(key)) return
    sentOnce.add(key)
  }
  const payload = { event, ...props }
  const w = window as unknown as { dataLayer?: unknown[] }
  if (Array.isArray(w.dataLayer)) w.dataLayer.push(payload)
  document.dispatchEvent(new CustomEvent('aatw:track', { detail: payload }))
}
