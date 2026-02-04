// ECG signal processing and interval calculations for 12‑lead ECG
// All logic here is plain JavaScript so it can be shared across components.
// Primary input: Lead II signal and samplingRate.

/**
 * Baseline correction using simple moving average.
 * Window = samplingRate * 2 samples (clamped to odd and within signal length).
 */
function baselineCorrect(signal, samplingRate) {
  const n = signal.length;
  if (!n || !Number.isFinite(samplingRate) || samplingRate <= 0) {
    return signal.slice();
  }

  let window = Math.max(3, Math.floor(samplingRate * 2));
  if (window > n) window = n;
  // ensure odd window for symmetric centering
  if (window % 2 === 0) window -= 1;

  const half = Math.floor(window / 2);
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + signal[i];
  }

  const corrected = new Array(n);
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(n - 1, i + half);
    const count = end - start + 1;
    const sum = prefix[end + 1] - prefix[start];
    const baseline = sum / count;
    corrected[i] = signal[i] - baseline;
  }
  return corrected;
}

function meanAndStd(values) {
  const n = values.length;
  if (!n) return { mean: 0, std: 0 };
  let sum = 0;
  for (let i = 0; i < n; i++) sum += values[i];
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) {
    const d = values[i] - mean;
    varSum += d * d;
  }
  const std = Math.sqrt(varSum / n);
  return { mean, std };
}

/**
 * Detect R-peaks using the statistical threshold rules described.
 */
function detectRPeaks(signal, samplingRate) {
  const n = signal.length;
  if (n < 5) return [];

  const { mean, std } = meanAndStd(signal);
  const maxVal = Math.max.apply(null, signal);
  let threshold = mean + 1.5 * std;

  function runDetection(th) {
    const peaks = [];
    const refractory = Math.max(150, Math.floor(0.25 * samplingRate)); // at least 150 samples
    for (let i = 2; i < n - 2; i++) {
      const v = signal[i];
      if (v < th) continue;
      // local maximum vs neighbours i±1, i±2
      if (
        v > signal[i - 1] &&
        v > signal[i + 1] &&
        v > signal[i - 2] &&
        v > signal[i + 2]
      ) {
        if (
          peaks.length === 0 ||
          i - peaks[peaks.length - 1] >= refractory
        ) {
          peaks.push(i);
        }
      }
    }
    return peaks;
  }

  let peaks = runDetection(threshold);
  if (peaks.length < 5) {
    // fallback threshold
    threshold = mean + 0.6 * (maxVal - mean);
    peaks = runDetection(threshold);
  }
  return peaks;
}

function median(values) {
  if (!values.length) return NaN;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Filter RR intervals using IQR rule.
 */
function filterRR(rr) {
  if (rr.length < 3) return rr;
  const sorted = rr.slice().sort((a, b) => a - b);
  const q1Index = Math.floor((sorted.length - 1) * 0.25);
  const q3Index = Math.floor((sorted.length - 1) * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  return sorted.filter((v) => v >= low && v <= high);
}

function computeBPMFromRPeaks(rPeaks, samplingRate) {
  if (rPeaks.length < 2) return null;
  const rr = [];
  for (let i = 0; i < rPeaks.length - 1; i++) {
    const dt = (rPeaks[i + 1] - rPeaks[i]) / samplingRate;
    if (dt > 0) rr.push(dt);
  }
  if (!rr.length) return null;
  const filtered = filterRR(rr);
  const medianRR = median(filtered.length ? filtered : rr);
  if (!medianRR || !Number.isFinite(medianRR)) return null;
  let bpm = 60 / medianRR;
  bpm = Math.min(220, Math.max(30, bpm));
  return { bpm, medianRR };
}

/**
 * QRS start / end detection around a single representative R-peak,
 * following the specification from the ECG Analysis documentation.
 */
function detectQRSBoundaries(signal, samplingRate, rIndex) {
  const n = signal.length;
  if (rIndex <= 0 || rIndex >= n - 1) {
    return {
      qrsStart: Math.max(0, rIndex - 23),
      qrsEnd: Math.min(n - 1, rIndex + 23),
    };
  }

  const maxAbs = Math.max.apply(null, signal.map((v) => Math.abs(v))) || 1;

  // --- QRS START ---
  const sixtyMs = Math.max(1, Math.floor(0.06 * samplingRate));
  const eightyMs = Math.max(1, Math.floor(0.08 * samplingRate));
  const fortyMs = Math.max(1, Math.floor(0.04 * samplingRate));

  const baselineStart = Math.max(0, rIndex - eightyMs);
  const baselineEnd = Math.max(
    baselineStart + 1,
    Math.min(n - 1, rIndex - fortyMs)
  );
  let baselineSum = 0;
  let baselineCount = 0;
  for (let i = baselineStart; i <= baselineEnd; i++) {
    baselineSum += signal[i];
    baselineCount++;
  }
  const baseline = baselineCount ? baselineSum / baselineCount : 0;

  const devThresh = 0.05 * maxAbs; // acts as 0.05 mV scaled to signal range
  const slopeThresh = 0.02 * maxAbs;

  const searchStart = Math.max(0, rIndex - sixtyMs);
  const searchEnd = rIndex;
  let qrsStart = null;
  for (let i = searchEnd - 1; i >= searchStart; i--) {
    const deviation = Math.abs(signal[i] - baseline);
    if (deviation > devThresh) {
      const slope = signal[i + 1] - signal[i];
      if (slope > slopeThresh) {
        qrsStart = i;
        break;
      }
    }
  }
  if (qrsStart === null) {
    qrsStart = Math.max(0, rIndex - 23);
  }

  // --- QRS END (J-point) ---
  const fortyMsAfter = Math.max(1, Math.floor(0.04 * samplingRate));
  const ninetyMs = Math.max(1, Math.floor(0.09 * samplingRate));
  const endSearchStart = Math.min(n - 2, rIndex + fortyMsAfter);
  const endSearchEnd = Math.min(n - 2, rIndex + ninetyMs);

  const stBaselineWindowSamples = Math.max(5, Math.floor(0.06 * samplingRate));
  const stBaselineStart = endSearchEnd;
  const stBaselineEnd = Math.min(
    n - 1,
    stBaselineStart + stBaselineWindowSamples
  );
  let stSum = 0;
  let stCount = 0;
  for (let i = stBaselineStart; i <= stBaselineEnd; i++) {
    stSum += signal[i];
    stCount++;
  }
  const stBaseline = stCount ? stSum / stCount : 0;
  const stDevThresh = 0.15 * maxAbs;

  let qrsEnd = null;
  let minSlope = Infinity;
  for (let i = endSearchStart; i <= endSearchEnd; i++) {
    const slope = Math.abs(signal[i + 1] - signal[i]);
    const deviation = Math.abs(signal[i] - stBaseline);
    if (deviation < stDevThresh && slope < minSlope) {
      minSlope = slope;
      qrsEnd = i;
    }
  }
  if (qrsEnd === null) {
    qrsEnd = Math.min(n - 1, rIndex + 23);
  }

  return { qrsStart, qrsEnd };
}

/**
 * P-wave detection and PR / P duration estimation following documentation.
 */
function detectPWave(signal, samplingRate, qrsStart) {
  const n = signal.length;
  if (!Number.isFinite(qrsStart) || qrsStart <= 0) return null;

  // Search 200 ms before QRS start, excluding last 90 ms
  const twoHundredMs = Math.max(1, Math.floor(0.2 * samplingRate));
  const ninetyMs = Math.max(1, Math.floor(0.09 * samplingRate));

  const searchStart = Math.max(0, qrsStart - twoHundredMs);
  const searchEnd = Math.max(0, qrsStart - ninetyMs);
  if (searchEnd <= searchStart) return null;

  // PR segment baseline: QRS_start-50 ms to QRS_start-20 ms
  const fiftyMs = Math.max(1, Math.floor(0.05 * samplingRate));
  const twentyMs = Math.max(1, Math.floor(0.02 * samplingRate));
  const baseStart = Math.max(0, qrsStart - fiftyMs);
  const baseEnd = Math.max(
    baseStart + 1,
    Math.min(n - 1, qrsStart - twentyMs)
  );

  let baseSum = 0;
  let baseSq = 0;
  let baseCount = 0;
  for (let i = baseStart; i <= baseEnd; i++) {
    const v = signal[i];
    baseSum += v;
    baseSq += v * v;
    baseCount++;
  }
  if (!baseCount) return null;
  const baseMean = baseSum / baseCount;
  const baseVar = baseSq / baseCount - baseMean * baseMean;
  const noise = Math.sqrt(Math.max(baseVar, 0));

  const threshold = baseMean + 0.3 * noise;

  let pStart = null;
  for (let i = searchStart; i < searchEnd - 2; i++) {
    const def = signal[i] - baseMean;
    const defNext = signal[i + 1] - baseMean;
    if (
      def > 0.3 * noise &&
      defNext > def &&
      signal[i + 2] > signal[i + 1]
    ) {
      pStart = i;
      break;
    }
  }
  if (pStart === null) return null;

  // P_end when signal returns towards baseline before QRS start
  let pEnd = qrsStart - 1;
  const endThresh = Math.abs(baseMean) + 1.0 * noise;
  for (let i = pStart + 1; i < qrsStart; i++) {
    if (Math.abs(signal[i] - baseMean) < endThresh) {
      pEnd = i;
      break;
    }
  }

  const prMs = ((qrsStart - pStart) / samplingRate) * 1000;
  const pDurMs = ((pEnd - pStart) / samplingRate) * 1000;

  return { pStart, pEnd, prMs, pDurMs };
}

function fallbackPRFromHR(bpm) {
  if (!bpm || !Number.isFinite(bpm)) return null;
  if (bpm < 50) return 200;
  if (bpm < 60) return 180;
  if (bpm < 100) return 160;
  if (bpm < 120) return 140;
  if (bpm < 150) return 130;
  return 120;
}

/**
 * QT and QTc estimation following documentation.
 */
function detectQT(signal, samplingRate, rIndex, qrsStart) {
  const n = signal.length;
  if (rIndex == null || qrsStart == null) return null;

  const twoHundredMs = Math.max(1, Math.floor(0.2 * samplingRate));
  const threeFiftyMs = Math.max(1, Math.floor(0.35 * samplingRate));

  const searchStart = Math.min(n - 2, rIndex + twoHundredMs);
  const searchEnd = Math.min(n - 2, rIndex + threeFiftyMs);
  if (searchEnd <= searchStart) return null;

  // T_peak in first ~75 ms of the window
  const seventyFiveMs = Math.max(1, Math.floor(0.075 * samplingRate));
  const tPeakEnd = Math.min(searchEnd, searchStart + seventyFiveMs);
  let tPeak = searchStart;
  let tPeakVal = signal[searchStart];
  for (let i = searchStart; i <= tPeakEnd; i++) {
    if (signal[i] > tPeakVal) {
      tPeakVal = signal[i];
      tPeak = i;
    }
  }

  // Post‑T baseline from [searchEnd - 10 samples : +30 samples] (scaled to samplingRate)
  const scale = samplingRate / 500; // doc is defined for 500 Hz
  const tenSamples = Math.max(1, Math.floor(10 * scale));
  const thirtySamples = Math.max(1, Math.floor(30 * scale));
  const baseStart = Math.max(0, searchEnd - tenSamples);
  const baseEnd = Math.min(n - 1, baseStart + thirtySamples);
  let bSum = 0;
  let bCount = 0;
  for (let i = baseStart; i <= baseEnd; i++) {
    bSum += signal[i];
    bCount++;
  }
  const baseline = bCount ? bSum / bCount : 0;

  const maxAbs = Math.max.apply(null, signal.map((v) => Math.abs(v))) || 1;
  const thr = 0.03 * (maxAbs / 4); // approximate 0.03 mV relative to range

  let tEnd = null;
  for (let i = tPeak; i <= searchEnd; i++) {
    const dev = Math.abs(signal[i] - baseline);
    const devNext = Math.abs(signal[i + 1] - baseline);
    if (dev < thr && devNext < thr) {
      tEnd = i;
      break;
    }
  }

  if (tEnd == null) {
    const oneSeventySamples = Math.max(1, Math.floor(170 * scale));
    tEnd = Math.min(n - 1, qrsStart + oneSeventySamples);
  }

  const qtMs = ((tEnd - qrsStart) / samplingRate) * 1000;
  return { tEnd, qtMs };
}

/**
 * Main convenience helper.
 * @param {number[]} leadII
 * @param {number} samplingRate
 */
export function computeECGMetrics(leadII, samplingRate) {
  if (!Array.isArray(leadII) || !leadII.length || !samplingRate) {
    return {
      bpm: null,
      pr: null,
      qrs: null,
      p: null,
      qt: null,
      qtc: null,
    };
  }

  const corrected = baselineCorrect(leadII, samplingRate);
  const rPeaks = detectRPeaks(corrected, samplingRate);
  const bpmResult = computeBPMFromRPeaks(rPeaks, samplingRate);
  const bpm = bpmResult?.bpm ?? null;
  const medianRR = bpmResult?.medianRR ?? null;

  // pick a representative R-peak (middle of the sequence)
  const repIndex =
    rPeaks.length > 0 ? rPeaks[Math.floor(rPeaks.length / 2)] : null;

  let qrsMs = null;
  let prMs = null;
  let pMs = null;
  let qtMs = null;
  let qtCMs = null;

  if (repIndex != null) {
    const { qrsStart, qrsEnd } = detectQRSBoundaries(
      corrected,
      samplingRate,
      repIndex
    );
    if (qrsEnd != null && qrsStart != null && qrsEnd > qrsStart) {
      qrsMs = ((qrsEnd - qrsStart) / samplingRate) * 1000;
    }

    let pInfo = null;
    if (qrsStart != null) {
      pInfo = detectPWave(corrected, samplingRate, qrsStart);
    }

    if (pInfo && pInfo.prMs && Number.isFinite(pInfo.prMs)) {
      prMs = pInfo.prMs;
      pMs = pInfo.pDurMs;
    } else {
      // Fallback PR based on HR table
      const fallback = fallbackPRFromHR(bpm);
      prMs = fallback;
      pMs = fallback ? Math.round(fallback * 0.4) : null; // crude estimate
    }

    const qtInfo = detectQT(corrected, samplingRate, repIndex, qrsStart);
    if (qtInfo && Number.isFinite(qtInfo.qtMs)) {
      qtMs = qtInfo.qtMs;
    }
  }

  if (qtMs != null && medianRR && Number.isFinite(medianRR)) {
    // Bazett: QTc(ms) = QT(ms) / sqrt(RR(s))
    qtCMs = qtMs / Math.sqrt(medianRR);
  }

  // clamp to physiological ranges where appropriate
  const clamp = (v, min, max) =>
    v == null || !Number.isFinite(v) ? null : Math.min(max, Math.max(min, v));

  return {
    bpm: bpm ? Math.round(bpm) : null,
    pr: clamp(prMs, 80, 320),
    qrs: clamp(qrsMs, 60, 200),
    p: clamp(pMs, 40, 200),
    qt: clamp(qtMs, 200, 600),
    qtc: clamp(qtCMs, 200, 600),
  };
}


