import type { LatestState } from "./types";

export type LiveVersionLabel =
  | { kind: "loading"; text: string }
  | { kind: "stable" | "beta"; text: string }
  | { kind: "unavailable"; text: string };

/** Label for the /version hero badge: stable if published, otherwise beta. */
export function describeLiveVersion(stable: LatestState, beta: LatestState): LiveVersionLabel {
  if (stable.status === "ok") {
    return { kind: "stable", text: `Latest Version: v${stable.release.version}` };
  }
  if (stable.status === "loading" || beta.status === "loading") {
    return { kind: "loading", text: "Checking latest version…" };
  }
  if (beta.status === "ok") {
    return { kind: "beta", text: `Beta ${beta.release.version} (testing)` };
  }
  return { kind: "unavailable", text: "Version info unavailable" };
}
