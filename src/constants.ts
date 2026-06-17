export const ROOT_ID = "better-vbtv"
export const SHORTCUTS_OVERLAY_ID = "better-vbtv-shortcuts"
export const TOAST_ID = "better-vbtv-toast"
export const VIDEO_SELECTOR = 'video'
export const PAGE_PATHS = {
  PLAYER: '/player'
}
export const NO_SPOILER_STORAGE_KEY = 'NO_SPOILER'
export const WITH_SPOILER_CLASS = 'with-spoiler'

// Configurable seek intervals (seconds)
export const SEEK_SMALL_KEY = 'SEEK_SMALL'
export const SEEK_LARGE_KEY = 'SEEK_LARGE'
export const DEFAULT_SEEK_SMALL = 5
export const DEFAULT_SEEK_LARGE = 10

// Toast appearance
export const TOAST_FONT_SIZE_KEY = 'TOAST_FONT_SIZE'
export const DEFAULT_TOAST_FONT_SIZE = 16

// Watch history + resume
export const WATCH_HISTORY_KEY = 'WATCH_HISTORY'
// Min continuous playtime (seconds) before a video is recorded to history.
export const WATCH_QUALIFY_SEC = 5
// Throttle/debounce for persisting the resume position (seconds).
export const POSITION_SAVE_SEC = 5
// Cap the stored list so storage can't grow unbounded.
export const HISTORY_MAX_ENTRIES = 100
// Public JW Player delivery feed — returns title + poster for a media id, no auth.
export const JW_MEDIA_FEED = 'https://cdn.jwplayer.com/v2/media/'
