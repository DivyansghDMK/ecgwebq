import { useCallback, useEffect, useState } from "react";
import { fetchLatest } from "@/services/releases/latestJson";
import type { Channel, LatestState } from "@/services/releases/types";

/** Loads latest.json for one channel; `retry` re-fetches. */
export function useLatestRelease(channel: Channel) {
  const [state, setState] = useState<LatestState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    fetchLatest(channel, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setState(result);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: "error", message: "Could not load release information." });
        }
      });

    return () => controller.abort();
  }, [channel, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state, retry };
}
