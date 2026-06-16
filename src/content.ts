/* @refresh reload */
import "./styles.css";

import { Renderer } from './components/renderer';
import { log } from './utils/logger';
import { ElementObserver } from './utils/elementObserver';
import { PAGE_PATHS, ROOT_ID,
  SHORTCUTS_OVERLAY_ID,
  WITH_SPOILER_CLASS,
  VIDEO_SELECTOR } from './constants'
import { observeRouteChange } from './utils/routeChangeObserver';
import { mountShortcutsOverlay } from './components/ShortcutsOverlay';
import { getNoSpoiler, setNoSpoiler } from './utils/settings';

log("🏐🏐🏐")

const shortcutsOverlay = mountShortcutsOverlay(SHORTCUTS_OVERLAY_ID);

setupSpoilerFreeToggleListener();
setupGlobalKeyboard();
await initializeSpoilerFreeState();

// Global shortcuts available on every VBTV page (not just the player):
// - "s"  toggles spoiler-free mode
// - "?"  (Shift+/) toggles the shortcuts overlay
// - Esc  closes the overlay
function setupGlobalKeyboard() {
  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    if (e.key === '?') {
      e.preventDefault();
      shortcutsOverlay.toggle();
      return;
    }

    if (e.key === 'Escape') {
      shortcutsOverlay.hide();
      return;
    }

    if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      toggleSpoilerFree();
    }
  });
}

async function toggleSpoilerFree() {
  const next = !(await getNoSpoiler());
  await setNoSpoiler(next);
  handleNoSpoilerChange(next);
  log('toggleSpoilerFree ->', next);
}

function setupSpoilerFreeToggleListener() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'NO_SPOILER_TOGGLE_STATE_CHANGED') {
      log('NO_SPOILER_TOGGLE_STATE_CHANGED', message.enabled)
      handleNoSpoilerChange(message.enabled);
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
  if (pathname === PAGE_PATHS.PLAYER) {
    observer = new ElementObserver({ selector: VIDEO_SELECTOR })
    observer.observe(() => {
      renderer = createRenderer()
      renderer.render()
    })
  } else {
    log("Not on player page")
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
