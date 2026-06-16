/* @refresh reload */
import "./styles.css";

import { Renderer } from './components/renderer';
import { log } from './utils/logger';
import { ElementObserver } from './utils/elementObserver';
import { PAGE_PATHS, ROOT_ID,
  SHORTCUTS_OVERLAY_ID,
  TOAST_ID,
  WITH_SPOILER_CLASS,
  VIDEO_SELECTOR } from './constants'
import { observeRouteChange } from './utils/routeChangeObserver';
import { mountShortcutsOverlay } from './components/ShortcutsOverlay';
import { mountToast } from './components/Toast';
import { toast } from './utils/toast';
import { getNoSpoiler, setNoSpoiler } from './utils/settings';

log("🏐🏐🏐")

mountToast(TOAST_ID);
const shortcutsOverlay = mountShortcutsOverlay(SHORTCUTS_OVERLAY_ID);
let onPlayerPage = false;

setupSpoilerFreeToggleListener();
setupGlobalKeyboard();
await initializeSpoilerFreeState();

// Keyboard shortcuts:
// - "s"  toggles spoiler-free mode (any VBTV page)
// - "?"  (Shift+/) toggles the shortcuts overlay (player page only)
// - Esc  closes the overlay
//
// Listen on `window` in the CAPTURE phase so we receive the key before the
// video.js player (or the page's "/"-to-search handler) can swallow it. This
// is why arrow-seek worked but "?" did not — video.js intercepts focused keys.
function setupGlobalKeyboard() {
  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    const isQuestionMark = e.key === '?' || (e.code === 'Slash' && e.shiftKey);
    if (isQuestionMark) {
      if (!onPlayerPage) return; // overlay is player-only
      e.preventDefault();
      e.stopPropagation();
      shortcutsOverlay.toggle();
      return;
    }

    if (e.key === 'Escape') {
      shortcutsOverlay.hide();
      return;
    }

    if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      toggleSpoilerFree();
    }
  }, true);
}

async function toggleSpoilerFree() {
  const next = !(await getNoSpoiler());
  await setNoSpoiler(next);
  handleNoSpoilerChange(next);
  toast(next ? '🙈 Spoilers hidden' : '👀 Spoilers shown');
  log('toggleSpoilerFree ->', next);
}

function setupSpoilerFreeToggleListener() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'NO_SPOILER_TOGGLE_STATE_CHANGED') {
      log('NO_SPOILER_TOGGLE_STATE_CHANGED', message.enabled)
      handleNoSpoilerChange(message.enabled);
      toast(message.enabled ? '🙈 Spoilers hidden' : '👀 Spoilers shown');
    }
  });
};

function handleNoSpoilerChange(noSpoiler: boolean) {
  if (!noSpoiler) {
    // add with spoiler class to enable spoiler styles
    document.body.classList.add(WITH_SPOILER_CLASS);
  } else {
    // remove with spoiler class to enable NO spoiler styles
    document.body.classList.remove(WITH_SPOILER_CLASS);
  }
};

// src/content/feature.ts
async function initializeSpoilerFreeState() {
  // Check initial state when content script loads
  const noSpoiler = await getNoSpoiler()
  log("initializeSpoilerFreeState noSpoiler", noSpoiler)
  setTimeout(
    () => handleNoSpoilerChange(noSpoiler),
    noSpoiler === false
      ? 400 // delay applying spoiler styles on initialization to wait for source rendering
      : 0
  )
};

let observer: ElementObserver | null;
let renderer: Renderer | null;

let cleanupRouteChangeObserver: ReturnType<typeof observeRouteChange>

handleRouteChange(window.location.pathname)

if (window.navigation) {
  window.navigation.addEventListener("navigate", (event) => {
    const url = new URL(event.destination.url)
    log('[navigate] location changed!', url.pathname);
    handleRouteChange(url.pathname)
  })
} else {
  cleanupRouteChangeObserver = observeRouteChange((pathname) => {
    log('[routeChangeObserver] route change:', pathname);
    handleRouteChange(pathname)
  });
}

function handleRouteChange(pathname: string) {
  onPlayerPage = pathname === PAGE_PATHS.PLAYER
  if (onPlayerPage) {
    observer = new ElementObserver({ selector: VIDEO_SELECTOR })
    observer.observe(() => {
      renderer = createRenderer()
      renderer.render()
    })
  } else {
    log("Not on player page")
    shortcutsOverlay.hide()
    cleanupObserver()
    cleanupRenderer()
  }
}

function cleanupObserver() {
  log("cleanupObserver()")
  if (observer) {
    observer.cleanup()
    observer = null
  }
}

function cleanupRenderer() {
  log("cleanupRenderer()")
  if (renderer) {
    renderer.destroy()
    renderer = null
  }
}

function createRenderer() {
  log("createRenderer")
  if (renderer) {
    return renderer
  }
  log("create new renderer")
  renderer = new Renderer({
    rootId: ROOT_ID,
  })
  return renderer
}

window.addEventListener('beforeunload', () => {
  log("beforeunload")
  if (cleanupRouteChangeObserver) {
    log("cleanupRouteChangeObserver()")
    cleanupRouteChangeObserver()
  }
  cleanupObserver()
  cleanupRenderer()
});
