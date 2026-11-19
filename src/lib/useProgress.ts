"use client";

import { useSyncExternalStore } from "react";
import { CHANGE_EVENT, getProgress, type ProgressState } from "./progress";

const EMPTY: ProgressState = { chapters: {}, quiz: {} };

/** Cached snapshot: useSyncExternalStore needs a stable reference between changes. */
let snapshot: ProgressState = EMPTY;
let dirty = true;

function subscribe(onChange: () => void) {
  const handler = () => {
    dirty = true;
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot(): ProgressState {
  if (dirty) {
    snapshot = getProgress();
    dirty = false;
  }
  return snapshot;
}

/** The server render has no localStorage, so it sees the empty state. */
const getServerSnapshot = (): ProgressState => EMPTY;

/**
 * Subscribe to progress.
 *
 * localStorage is an external store, so this is useSyncExternalStore's job rather
 * than an effect: React reads the snapshot during render and the server snapshot
 * keeps hydration consistent when storage is unavailable.
 *
 * `ready` distinguishes "no progress recorded" from "not read yet", so the
 * continue-card does not flash an empty state on first paint.
 */
export function useProgress(): { progress: ProgressState; ready: boolean } {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return { progress, ready };
}
