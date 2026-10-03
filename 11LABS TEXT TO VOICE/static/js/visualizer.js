/**
 * Audio Visualizer using HTML5 Canvas & Web Audio API
 */
class AudioVisualizer {
  constructor(canvasId, audioElement) {
    this.canvas = document.getElementById(canvasId);
    this.audio = audioElement;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.animationId = null;
    this.isPlaying = false;

    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.drawIdle();
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
    if (!this.isPlaying) {
      this.drawIdle();
    }
  }

  setupAudioContext() {
    if (this.audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);

      this.source = this.audioCtx.createMediaElementSource(this.audio);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn("Web Audio API initialization fallback to synthetic visualizer:", e);
    }
  }

  start() {
    this.isPlaying = true;
    this.setupAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.render();
  }

  stop() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.drawIdle();
  }

  render() {
    if (!this.isPlaying) return;
    this.animationId = requestAnimationFrame(() => this.render());

    if (!this.ctx || !this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
    } else {
      // Synthetic frequency data when web audio connection is restricted
      if (!this.dataArray) {
        this.bufferLength = 48;
        this.dataArray = new Uint8Array(this.bufferLength);
      }
      const time = Date.now() * 0.005;
      for (let i = 0; i < this.bufferLength; i++) {
        const val = Math.sin(time + i * 0.3) * 0.5 + 0.5;
        this.dataArray[i] = Math.floor(val * 160 + 40);
      }
    }

    const barCount = 48;
    const gap = 4 * (window.devicePixelRatio || 1);
    const totalGap = gap * (barCount - 1);
    const barWidth = Math.max(2, (width - totalGap) / barCount);

    const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#7c3aed');
    gradient.addColorStop(0.5, '#a855f7');
    gradient.addColorStop(1, '#06b6d4');

    this.ctx.fillStyle = gradient;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * (this.bufferLength / 1.5));
      const value = this.dataArray[dataIndex] || 10;
      const percent = value / 255;
      const barHeight = Math.max(4, percent * height * 0.85);

      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;

      this.ctx.beginPath();
      this.ctx.roundRect(x, y, barWidth, barHeight, 3);
      this.ctx.fill();
    }
  }

  drawIdle() {
    if (!this.ctx || !this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);

    const barCount = 48;
    const gap = 4 * (window.devicePixelRatio || 1);
    const totalGap = gap * (barCount - 1);
    const barWidth = Math.max(2, (width - totalGap) / barCount);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';

    for (let i = 0; i < barCount; i++) {
      // Gentle idle wave
      const wave = Math.sin(i * 0.2) * 4 + 6;
      const x = i * (barWidth + gap);
      const y = (height - wave) / 2;

      this.ctx.beginPath();
      this.ctx.roundRect(x, y, barWidth, wave, 2);
      this.ctx.fill();
    }
  }
}

window.AudioVisualizer = AudioVisualizer;
