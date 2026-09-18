// Audio player ported from sound.c and bb.c
// Manages the original soundtrack (bb.s3m, bb2.s3m, bb3.s3m converted to authentic MP3)

class AudioPlayer {
  constructor() {
    this.audioElement = null;
    this.currentSong = null;
    this.volume = 0.8;
    this.isMuted = false;
    this.unlocked = false;

    // Track list mapped from original .s3m files
    this.tracks = {
      "bb.s3m": "/audio/bb.mp3",
      "bb2.s3m": "/audio/bb2.mp3",
      "bb3.s3m": "/audio/bb3.mp3",
    };

    this.initAudioElement();
  }

  initAudioElement() {
    if (typeof document !== "undefined") {
      let el = document.getElementById("bgm-player");
      if (!el) {
        el = document.createElement("audio");
        el.id = "bgm-player";
        el.setAttribute("preload", "auto");
        el.setAttribute("playsinline", "true");
        document.body.appendChild(el);
      }
      this.audioElement = el;
      this.audioElement.volume = this.volume;

      // Handle track loop for credits2 (bb3) or general end
      this.audioElement.addEventListener("ended", () => {
        if (this.currentSong === "bb3.s3m" || this.currentSong === "bb.s3m") {
          this.audioElement.currentTime = 0;
          this.audioElement.play().catch(() => {});
        }
      });
    } else if (typeof Audio !== "undefined") {
      this.audioElement = new Audio();
      this.audioElement.volume = this.volume;
    }
  }

  // Handle browser autoplay policy by playing / unblocking immediately in user gesture
  unlock() {
    if (!this.audioElement) {
      this.initAudioElement();
    }
    this.unlocked = true;

    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
      if (!this.audioElement.src || this.audioElement.src === "" || this.audioElement.src.endsWith("/")) {
        this.load_song(this.currentSong || "bb.s3m");
      }
      if (this.audioElement.paused) {
        const p = this.audioElement.play();
        if (p !== undefined) {
          p.catch((err) => {
            console.warn("Audio unlock play attempt:", err.message);
          });
        }
      }
    }
  }

  load_song(songName) {
    if (!this.audioElement) {
      this.initAudioElement();
    }
    this.currentSong = songName;
    const url = this.tracks[songName] || `/audio/${songName.replace(/\.s3m$/i, ".mp3")}`;
    
    if (this.audioElement) {
      // Avoid reloading if already pointing to the target URL
      const fullUrl = typeof window !== "undefined" ? new URL(url, window.location.href).href : url;
      if (this.audioElement.src !== fullUrl) {
        this.audioElement.src = url;
        this.audioElement.currentTime = 0;
        this.audioElement.load();
      }
    }
  }

  async play() {
    if (!this.audioElement) {
      this.initAudioElement();
    }
    if (!this.audioElement) return;

    if (!this.audioElement.src || this.audioElement.src === "" || this.audioElement.src.endsWith("/")) {
      this.load_song(this.currentSong || "bb.s3m");
    }

    this.audioElement.volume = this.isMuted ? 0 : this.volume;
    try {
      const p = this.audioElement.play();
      if (p !== undefined) {
        await p;
      }
      this.unlocked = true;
    } catch (err) {
      console.warn("Audio play blocked by browser autoplay policy:", err.message);
    }
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  resume() {
    if (this.audioElement && this.audioElement.src) {
      this.audioElement.play().catch(() => {});
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
  }

  getVolume() {
    return this.volume;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
    return this.isMuted;
  }

  getCurrentSong() {
    return this.currentSong;
  }

  getCurrentTime() {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  seek(seconds) {
    if (this.audioElement && this.audioElement.src) {
      this.audioElement.currentTime = seconds;
    }
  }
}

export const sound = new AudioPlayer();
export const load_song = (name) => sound.load_song(name);
export const play = () => sound.play();
export const stop = () => sound.stop();

