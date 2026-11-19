"use client";

/**
 * Per-chapter progress in localStorage.
 *
 * Every read and write is wrapped: in a private window, with site data blocked, or
 * during a thumbnail capture, the accessor can throw or come back empty. The portal
 * must render correctly in all of those cases, so a failure here is always silent
 * and always falls back to "no progress recorded".
 */

const KEY = "iitkgp-ml-portal.progress.v1";

export interface ChapterProgress {
  visited: boolean;
  completed: boolean;
  /** Scroll offset in px, so "continue" lands where you stopped reading. */
  scroll: number;
  updatedAt: number;
}

export interface QuizProgress {
  answered: number;
  correct: number;
  updatedAt: number;
}

export interface ProgressState {
  chapters: Record<string, ChapterProgress>;
  quiz: Record<string, QuizProgress>;
  lastSlug?: string;
}

const EMPTY: ProgressState = { chapters: {}, quiz: {} };

function read(): ProgressState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      chapters: parsed.chapters ?? {},
      quiz: parsed.quiz ?? {},
      lastSlug: parsed.lastSlug,
    };
  } catch {
    return EMPTY;
  }
}

function write(state: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* storage unavailable — progress simply isn't remembered this session */
  }
}

export const CHANGE_EVENT = "ml-portal-progress-change";

export const getProgress = read;

export function markVisited(slug: string): void {
  const s = read();
  const prev = s.chapters[slug];
  s.chapters[slug] = {
    visited: true,
    completed: prev?.completed ?? false,
    scroll: prev?.scroll ?? 0,
    updatedAt: Date.now(),
  };
  s.lastSlug = slug;
  write(s);
}

export function setCompleted(slug: string, completed: boolean): void {
  const s = read();
  const prev = s.chapters[slug];
  s.chapters[slug] = {
    visited: true,
    completed,
    scroll: prev?.scroll ?? 0,
    updatedAt: Date.now(),
  };
  write(s);
}

export function saveScroll(slug: string, scroll: number): void {
  const s = read();
  const prev = s.chapters[slug];
  if (!prev) return;
  s.chapters[slug] = { ...prev, scroll, updatedAt: Date.now() };
  write(s);
}

export function recordQuiz(moduleId: string, correct: number, answered: number): void {
  const s = read();
  s.quiz[moduleId] = { correct, answered, updatedAt: Date.now() };
  write(s);
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* nothing to clear */
  }
}
