// actions.ts
// Phone-side actions — fire and forget, never block HUD

const DEBUG = false
const log = (...args: any[]) => DEBUG && console.log('[actions]', ...args)

// Open Google Maps to a location
// Called AFTER HUD suggestion is already written — never block on this
export function triggerPhoneAction(mapsDeeplink: string, placeName: string): void {
  if (!mapsDeeplink) return
  log('opening maps:', placeName, mapsDeeplink)

  try {
    window.open(mapsDeeplink, '_blank')
  } catch (err) {
    log('maps open failed:', err)
  }
}

// Build a Maps deeplink from a place name
export function buildMapsLink(placeName: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(placeName)}`
}
