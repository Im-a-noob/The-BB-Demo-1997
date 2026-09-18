// main.js - Master scene sequencer and entry point
// Exactly mirrors bb() sequencing from original bb.c (1997)

import { context } from "./aalib-setup.js";
import { sound, load_song, play, stop } from "./audio.js";
import {
  togglePause,
  isPaused,
  skipCurrentScene,
  setPlaybackSpeed,
  getPlaybackSpeed,
  pushKey,
} from "./timer.js";

// Import all scenes
import { introscreen, scene1 } from "./scenes/scene1.js";
import { scene2 } from "./scenes/scene2.js";
import { scene3 } from "./scenes/scene3.js";
import { scene4 } from "./scenes/scene4.js";
import { scene5 } from "./scenes/scene5.js";
import { scene6 } from "./scenes/scene6.js";
import { scene7 } from "./scenes/scene7.js";
import { scene8 } from "./scenes/scene8.js";
import { scene9 } from "./scenes/scene9.js";
import { scene10 } from "./scenes/scene10.js";
import { runMemberScene } from "./scenes/messager.js";
import { credits } from "./scenes/credits.js";
import { credits2 } from "./scenes/credits2.js";

// Scene definition table for direct jumping (16 cohesive demoscene acts)
export const SCENE_LIST = [
  { id: "intro", name: "01. Intro & Memory Dump", run: introscreen },
  { id: "scene1", name: "02. AA Presents & BB Title", run: scene1 },
  { id: "scene3", name: "03. Hypnotic Plasma", run: scene3 },
  { id: "member_fk", name: "04. Filip Kupsa (FK)", run: () => runMemberScene(0) },
  { id: "scene4", name: "05. Space Invaders & Fire", run: scene4 },
  { id: "scene2", name: "06. Greetings & Zoomers", run: scene2 },
  { id: "member_ms", name: "07. Mojmir Svoboda (MS)", run: () => runMemberScene(1) },
  { id: "scene8", name: "08. Zebra Zoom & Pan", run: scene8 },
  { id: "scene6", name: "09. Mandelbrot Autopilot", run: scene6 },
  { id: "member_kt", name: "10. Kamil Toman (KT)", run: () => runMemberScene(2) },
  { id: "scene7", name: "11. Julia Morphing", run: scene7 },
  { id: "scene5", name: "12. 3D Torus Rotation", run: scene5 },
  { id: "scene10", name: "13. 3D Flyby & Antialias", run: scene10 },
  { id: "member_hh", name: "14. Jan Hubicka (HH)", run: () => runMemberScene(3) },
  { id: "credits", name: "15. 3D Warp Starfield & Credits", run: credits },
  { id: "credits2", name: "16. Outro & Interactive Jukebox", run: credits2 },
];

let currentSceneIndex = 0;
let isDemoRunning = false;
let jumpRequestedIndex = -1;

function updateHUD(sceneName) {
  const badge = document.getElementById("hud-scene-name");
  if (badge) {
    badge.textContent = sceneName;
  }
  const select = document.getElementById("scene-select");
  if (select && select.value !== String(currentSceneIndex)) {
    select.value = String(currentSceneIndex);
  }
}

/**
 * Master sequencing function ported from bb() in bb.c
 */
export async function runDemo(startIndex = 0) {
  if (isDemoRunning) return;
  isDemoRunning = true;

  sound.unlock();
  currentSceneIndex = startIndex;

  // Immediately kick off the appropriate soundtrack for the target scene
  const initialScene = SCENE_LIST[currentSceneIndex] || SCENE_LIST[0];
  if (initialScene.id === "credits") {
    load_song("bb2.s3m");
    play();
  } else if (initialScene.id === "credits2") {
    load_song("bb3.s3m");
    play();
  } else {
    load_song("bb.s3m");
    play();
  }

  while (currentSceneIndex < SCENE_LIST.length) {
    if (jumpRequestedIndex >= 0) {
      currentSceneIndex = jumpRequestedIndex;
      jumpRequestedIndex = -1;
    }

    const currentScene = SCENE_LIST[currentSceneIndex];
    updateHUD(currentScene.name);

    // Synchronize music track with original bb.c cue points
    if (currentScene.id === "credits" && sound.getCurrentSong() !== "bb2.s3m") {
      load_song("bb2.s3m");
      play();
    } else if (currentScene.id === "credits2" && sound.getCurrentSong() !== "bb3.s3m") {
      load_song("bb3.s3m");
      play();
    } else if (
      currentScene.id !== "credits" &&
      currentScene.id !== "credits2" &&
      sound.getCurrentSong() !== "bb.s3m"
    ) {
      load_song("bb.s3m");
      play();
    }

    try {
      const result = await currentScene.run();
      if (result === "restart") {
        currentSceneIndex = 0;
        continue;
      }
    } catch (err) {
      console.error("Error running scene:", currentScene.name, err);
    }

    currentSceneIndex++;
  }

  isDemoRunning = false;
}

export function jumpToScene(index) {
  jumpRequestedIndex = index;
  skipCurrentScene();
  if (!isDemoRunning) {
    runDemo(index);
  }
}

// Global UI and shortcut initialization
export function setupUI() {
  const terminalPre = document.getElementById("terminal");
  const screenWrapper = document.getElementById("screen-wrapper");
  context.init(terminalPre, screenWrapper);

  // Populate scene selector dropdown
  const sceneSelect = document.getElementById("scene-select");
  if (sceneSelect) {
    sceneSelect.innerHTML = "";
    SCENE_LIST.forEach((sc, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = sc.name;
      sceneSelect.appendChild(opt);
    });
    sceneSelect.addEventListener("change", (e) => {
      jumpToScene(parseInt(e.target.value, 10));
    });
  }

  // Play / Pause button
  const playBtn = document.getElementById("btn-play");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (!isDemoRunning) {
        sound.unlock();
        load_song("bb.s3m");
        play();
        runDemo(0);
        playBtn.textContent = "⏸ Pause";
      } else {
        const paused = togglePause();
        if (paused) {
          sound.pause();
          playBtn.textContent = "▶ Resume";
        } else {
          sound.resume();
          playBtn.textContent = "⏸ Pause";
        }
      }
    });
  }

  // Skip Scene button
  const skipBtn = document.getElementById("btn-skip");
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      skipCurrentScene();
    });
  }

  // Speed selector
  const speedSelect = document.getElementById("speed-select");
  if (speedSelect) {
    speedSelect.addEventListener("change", (e) => {
      setPlaybackSpeed(parseFloat(e.target.value));
    });
  }

  // Phosphor selector
  const phosphorSelect = document.getElementById("phosphor-select");
  if (phosphorSelect) {
    phosphorSelect.addEventListener("change", (e) => {
      context.setPhosphor(e.target.value);
    });
  }

  // Scanlines toggle
  const scanlinesBtn = document.getElementById("btn-scanlines");
  if (scanlinesBtn) {
    scanlinesBtn.addEventListener("click", () => {
      const active = context.toggleScanlines();
      scanlinesBtn.classList.toggle("btn-active", active);
    });
  }

  // Fullscreen toggle
  const fsBtn = document.getElementById("btn-fullscreen");
  if (fsBtn) {
    fsBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // Volume slider & Mute button
  const volSlider = document.getElementById("vol-slider");
  const muteBtn = document.getElementById("btn-mute");
  if (volSlider) {
    volSlider.addEventListener("input", (e) => {
      sound.setVolume(parseFloat(e.target.value));
    });
  }
  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      const muted = sound.toggleMute();
      muteBtn.textContent = muted ? "🔇 Unmute" : "🔊 Mute";
    });
  }

  // Keyboard controls
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

    if (e.code === "Space") {
      e.preventDefault();
      const paused = togglePause();
      if (paused) sound.pause();
      else sound.resume();
      if (playBtn) playBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
    } else if (e.key === "s" || e.key === "S" || e.code === "ArrowRight") {
      skipCurrentScene();
    } else if (e.key === "f" || e.key === "F") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } else if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "r" || e.key === "R") {
      pushKey(e.key);
    }
  });

  // Start demo immediately or on click
  const startOverlay = document.getElementById("start-overlay");
  const startBtn = document.getElementById("btn-start-demo");
  if (startBtn && startOverlay) {
    startBtn.addEventListener("click", () => {
      startOverlay.style.display = "none";
      if (playBtn) playBtn.textContent = "⏸ Pause";
      sound.unlock();
      load_song("bb.s3m");
      play();
      runDemo(0);
    });
  } else {
    runDemo(0);
  }

  // Fallback unlocker for browser iframe autoplay restrictions on any user gesture
  const unlockAudioOnGesture = () => {
    sound.unlock();
    if (isDemoRunning && !isPaused() && sound.audioElement && sound.audioElement.paused) {
      sound.play().catch(() => {});
    }
  };
  window.addEventListener("click", unlockAudioOnGesture, { passive: true });
  window.addEventListener("keydown", unlockAudioOnGesture, { passive: true });
  window.addEventListener("touchstart", unlockAudioOnGesture, { passive: true });
}

// Boot UI when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupUI);
  } else {
    setupUI();
  }
}
