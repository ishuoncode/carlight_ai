'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker and keeps the app up to date.
 * Rendered once from the root layout.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Register after the page has settled so it never competes with first load
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Look for an updated worker every time the app regains focus
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (
                installing.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New version ready — activate it so users get updates quickly
                installing.postMessage('SKIP_WAITING');
              }
            });
          });
        })
        .catch((err) =>
          console.error('Service worker registration failed:', err)
        );
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
