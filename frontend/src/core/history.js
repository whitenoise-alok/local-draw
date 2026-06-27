export function createHistory(scene) {
  return { past: [], present: scene, future: [] };
}

export function historyPush(hist, scene) {
  return { past: [...hist.past, hist.present].slice(-50), present: scene, future: [] };
}

export function historyUndo(hist) {
  if (!hist.past.length) return hist;
  return {
    past: hist.past.slice(0, -1),
    present: hist.past[hist.past.length - 1],
    future: [hist.present, ...hist.future],
  };
}

export function historyRedo(hist) {
  if (!hist.future.length) return hist;
  return {
    past: [...hist.past, hist.present],
    present: hist.future[0],
    future: hist.future.slice(1),
  };
}

export function canUndo(hist) { return hist.past.length > 0; }
export function canRedo(hist) { return hist.future.length > 0; }
