import { describe, expect, it } from "vitest";
import {
  canGoNext,
  canGoPrevious,
  currentPage,
  cursorForPage,
  initialUploadPagination,
  isPageCached,
  uploadPaginationReducer as reduce,
  visibleRange,
  type UploadPaginationState,
} from "../uploadPagination";
import type { UploadHistoryItem, UploadPage } from "../types";

function rows(count: number, prefix: string): UploadHistoryItem[] {
  return Array.from({ length: count }, (_, i) => ({
    at: `2026-10-0${(i % 9) + 1}T00:00:00Z`,
    result: "ACCEPTED",
    version: `${prefix}.${i}`,
    channel: "beta",
    source_key: `incoming/beta/${prefix}-${i}.exe`,
    reasons: [],
  }));
}

const page = (count: number, prefix: string, next: string | null): UploadPage => ({ items: rows(count, prefix), next_cursor: next });

/** Simulates the page loading page `index` and then showing it. */
function load(state: UploadPaginationState, index: number, p: UploadPage): UploadPaginationState {
  return reduce(reduce(state, { type: "pageLoaded", index, page: p }), { type: "goTo", index });
}

describe("upload pagination", () => {
  it("starts on page 1 with no cache and Previous/Next disabled", () => {
    const s = initialUploadPagination;
    expect(s.pageIndex).toBe(0);
    expect(cursorForPage(s, 0)).toBeNull();
    expect(canGoPrevious(s)).toBe(false);
    expect(canGoNext(s)).toBe(false);
    expect(visibleRange(s)).toBeNull();
  });

  it("walks forward using the cursor stack", () => {
    let s = load(initialUploadPagination, 0, page(20, "a", "c1"));
    expect(canGoNext(s)).toBe(true);
    expect(cursorForPage(s, 1)).toBe("c1");
    expect(isPageCached(s, 1)).toBe(false);
    expect(visibleRange(s)).toEqual({ from: 1, to: 20 });

    s = load(s, 1, page(20, "b", "c2"));
    expect(s.pageIndex).toBe(1);
    expect(s.cursors).toEqual([null, "c1", "c2"]);
    expect(canGoPrevious(s)).toBe(true);
    expect(visibleRange(s)).toEqual({ from: 21, to: 40 });

    s = load(s, 2, page(7, "c", null));
    expect(canGoNext(s)).toBe(false);
    expect(visibleRange(s)).toEqual({ from: 41, to: 47 });
  });

  it("goes back to cached pages without refetching", () => {
    let s = load(initialUploadPagination, 0, page(20, "a", "c1"));
    s = load(s, 1, page(20, "b", "c2"));
    const first = currentPage(load(initialUploadPagination, 0, page(20, "a", "c1")));

    s = reduce(s, { type: "goTo", index: 0 });
    expect(s.pageIndex).toBe(0);
    expect(currentPage(s)?.items).toEqual(first?.items);
    expect(canGoPrevious(s)).toBe(false);
    // Page 2 is still cached, so Next can show it without a fetch.
    expect(isPageCached(s, 1)).toBe(true);
  });

  it("ignores goTo for pages that are not loaded and pageLoaded for unreachable pages", () => {
    const s = load(initialUploadPagination, 0, page(20, "a", "c1"));
    expect(reduce(s, { type: "goTo", index: 1 })).toBe(s);
    expect(reduce(s, { type: "goTo", index: -1 })).toBe(s);
    expect(reduce(s, { type: "pageLoaded", index: 5, page: page(1, "x", null) })).toBe(s);
  });

  it("reset (page size or filter change) returns to page 1 and clears the cache", () => {
    let s = load(initialUploadPagination, 0, page(20, "a", "c1"));
    s = load(s, 1, page(20, "b", "c2"));
    s = reduce(s, { type: "reset" });
    expect(s).toEqual(initialUploadPagination);
    expect(isPageCached(s, 0)).toBe(false);
    expect(canGoNext(s)).toBe(false);
  });

  it("handles an empty first page", () => {
    const s = load(initialUploadPagination, 0, { items: [], next_cursor: null });
    expect(visibleRange(s)).toBeNull();
    expect(canGoNext(s)).toBe(false);
  });
});
