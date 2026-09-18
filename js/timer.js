// Timer system ported from timers.c and bb.c
// Provides microsecond-precision timing, frame stepping, and sequencer control

class Timer {
  constructor() {
    this.startTime = performance.now();
  }

  reset() {
    this.startTime = performance.now();
  }

  // Returns elapsed time in microseconds (1,000,000 us = 1s)
  lookup() {
    return Math.round((performance.now() - this.startTime) * 1000);
  }
}

let mainTimer = new Timer();
let demoStartTime = performance.now();

let isPausedState = false;
let skipSceneRequested = false;
let playbackSpeed = 1.0;
let keyEventQueue = [];

export function tl_create_timer() {
  return new Timer();
}

export function tl_reset_timer(timer) {
  if (timer) timer.reset();
  else mainTimer.reset();
}

export function tl_lookup_timer(timer) {
  return timer ? timer.lookup() : mainTimer.lookup();
}

export function getDemoTime() {
  return Math.round((performance.now() - demoStartTime) * 1000 * playbackSpeed);
}

export function setPlaybackSpeed(speed) {
  playbackSpeed = Math.max(0.25, Math.min(5.0, speed));
}

export function getPlaybackSpeed() {
  return playbackSpeed;
}

export function togglePause() {
  isPausedState = !isPausedState;
  return isPausedState;
}

export function isPaused() {
  return isPausedState;
}

export function skipCurrentScene() {
  skipSceneRequested = true;
}

export function resetSkipScene() {
  skipSceneRequested = false;
}

export function isSceneSkipped() {
  return skipSceneRequested;
}

// Emulate keyboard input from original aa_getkey / bbupdate
export function pushKey(key) {
  keyEventQueue.push(key);
}

export function bbupdate() {
  if (keyEventQueue.length > 0) {
    return keyEventQueue.shift();
  }
  return 0; // AA_NONE
}

// Microsecond async wait
export function bbwait(usec) {
  return new Promise((resolve) => {
    const targetMs = (usec / 1000) / playbackSpeed;
    const start = performance.now();

    function check() {
      if (skipSceneRequested) {
        resolve();
        return;
      }
      if (isPausedState) {
        requestAnimationFrame(check);
        return;
      }
      const elapsed = performance.now() - start;
      if (elapsed >= targetMs) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    }

    requestAnimationFrame(check);
  });
}

export function bbflushwait(usec) {
  return bbwait(usec);
}

/**
 * Core timing loop ported from original timestuff() in bb.c
 * @param {number} rate - ticks per second (or negative for direct step)
 * @param {Function|null} control - function called with step count
 * @param {Function|null} draw - function called each display frame
 * @param {number} maxtime - total duration in microseconds
 */
export async function timestuff(rate, control, draw, maxtime) {
  const timer = new Timer();
  const absRate = Math.abs(rate);
  const stepDurationUsec = absRate > 0 ? 1000000 / absRate : 1000000 / 60;
  
  let lastStepTime = 0;
  let running = true;

  resetSkipScene();

  while (running) {
    if (skipSceneRequested) {
      break;
    }

    while (isPausedState) {
      await new Promise((r) => setTimeout(r, 50));
      if (skipSceneRequested) break;
    }

    const elapsed = Math.round(timer.lookup() * playbackSpeed);

    if (maxtime > 0 && elapsed >= maxtime) {
      running = false;
      break;
    }

    // Call control function at requested rate
    if (control && absRate > 0) {
      const timeSinceLastStep = elapsed - lastStepTime;
      const stepsToRun = Math.floor(timeSinceLastStep / stepDurationUsec);
      if (stepsToRun > 0) {
        // Cap steps to prevent spiral of death on tab unfocus
        const clampedSteps = Math.min(stepsToRun, 8);
        control(clampedSteps);
        lastStepTime += stepsToRun * stepDurationUsec;
      }
    } else if (control && rate === 0) {
      control(1);
    }

    // Render current frame
    if (draw) {
      draw(elapsed, maxtime);
    }

    // Yield to browser rendering
    await new Promise((r) => requestAnimationFrame(r));
  }
}
