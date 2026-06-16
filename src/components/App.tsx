import { onCleanup, type Component, createEffect, createSignal } from 'solid-js';
import { useLocation } from '@solidjs/router';

import { PAGE_PATHS, VIDEO_SELECTOR } from '../constants';
import { log } from '../utils/logger';
import { VideoController } from './VideoController';

// Owns the VideoController lifecycle on the player page. All visual feedback now
// goes through the global toast (see utils/toast + components/Toast), so this
// component renders nothing.
const App: Component = () => {
  const [videoController, setVideoController] = createSignal<VideoController | null>(null);

  const { pathname } = useLocation();

  const cleanup = () => {
    if (videoController()) {
      videoController()?.cleanup();
      setVideoController(null);
    }
  };

  createEffect(() => {
    if (pathname === PAGE_PATHS.PLAYER) {
      if (!videoController()) {
        setVideoController(new VideoController({ selector: VIDEO_SELECTOR }));
      }
    } else if (videoController()) {
      cleanup();
    }
  });

  onCleanup(() => {
    log('App onCleanup');
    cleanup();
  });

  return null;
};

export default App;
