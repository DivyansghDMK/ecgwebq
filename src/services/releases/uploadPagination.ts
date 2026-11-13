import type { UploadPage } from "./types";

/** Any cursor page (uploads, download log, …). */
export interface CursorPage<T = unknown> {
  items: T[];
  next_cursor: string | null;
}

/**
 * Cursor-based pagination without a total count.
 * cursors[i] is the cursor that fetches page i (page 0 uses null);
 * pages caches what each page returned, so Previous never refetches.
 */
export interface UploadPaginationState<P extends CursorPage = UploadPage> {
  pageIndex: number;
  cursors: (string | null)[];
  pages: Record<number, P>;
}

export type UploadPaginationAction<P extends CursorPage = UploadPage> =
  | { type: "reset" }
  | { type: "pageLoaded"; index: number; page: P }
  | { type: "goTo"; index: number };

export const initialUploadPagination: UploadPaginationState = {
  pageIndex: 0,
  cursors: [null],
  pages: {},
};

export function uploadPaginationReducer<P extends CursorPage = UploadPage>(
  state: UploadPaginationState<P>,
  action: UploadPaginationAction<P>
): UploadPaginationState<P> {
  switch (action.type) {
    case "reset":
      return { pageIndex: 0, cursors: [null], pages: {} };

    case "pageLoaded": {
      // Only accept a page whose cursor is known (i.e. reached by walking forward).
      if (action.index < 0 || action.index >= state.cursors.length) {
        return state;
      }
      const cursors = state.cursors.slice(0, action.index + 1);
      if (action.page.next_cursor) {
        cursors.push(action.page.next_cursor);
      }
      return { ...state, cursors, pages: { ...state.pages, [action.index]: action.page } };
    }

    case "goTo":
      if (action.index < 0 || !(action.index in state.pages)) {
        return state;
      }
      return { ...state, pageIndex: action.index };

    default:
      return state;
  }
}

export function currentPage<P extends CursorPage>(state: UploadPaginationState<P>): P | undefined {
  return state.pages[state.pageIndex];
}

export function canGoPrevious<P extends CursorPage>(state: UploadPaginationState<P>): boolean {
  return state.pageIndex > 0;
}

export function canGoNext<P extends CursorPage>(state: UploadPaginationState<P>): boolean {
  return Boolean(currentPage(state)?.next_cursor);
}

export function isPageCached<P extends CursorPage>(state: UploadPaginationState<P>, index: number): boolean {
  return index in state.pages;
}

/** Cursor needed to fetch page `index`, or undefined if that page is not reachable yet. */
export function cursorForPage<P extends CursorPage>(state: UploadPaginationState<P>, index: number): string | null | undefined {
  return index >= 0 && index < state.cursors.length ? state.cursors[index] : undefined;
}

/** 1-based "Showing Xâ€“Y" range for the current page; null when it has no rows. */
export function visibleRange<P extends CursorPage>(state: UploadPaginationState<P>): { from: number; to: number } | null {
  const page = currentPage(state);
  if (!page || page.items.length === 0) {
    return null;
  }
  let before = 0;
  for (let i = 0; i < state.pageIndex; i += 1) {
    before += state.pages[i]?.items.length ?? 0;
  }
  return { from: before + 1, to: before + page.items.length };
}
