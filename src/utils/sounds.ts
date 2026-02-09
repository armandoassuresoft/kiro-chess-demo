// Chess sound effects using Web Audio API
class ChessSounds {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported
    }
  }

  move() {
    this.playTone(600, 0.08, 'sine', 0.2);
    setTimeout(() => this.playTone(800, 0.06, 'sine', 0.15), 30);
  }

  capture() {
    this.playTone(300, 0.1, 'square', 0.2);
    setTimeout(() => this.playTone(200, 0.15, 'square', 0.15), 50);
  }

  check() {
    this.playTone(880, 0.1, 'sine', 0.25);
    setTimeout(() => this.playTone(880, 0.1, 'sine', 0.2), 120);
  }

  checkmate() {
    this.playTone(440, 0.15, 'sine', 0.3);
    setTimeout(() => this.playTone(330, 0.15, 'sine', 0.25), 150);
    setTimeout(() => this.playTone(220, 0.3, 'sine', 0.2), 300);
  }

  castle() {
    this.playTone(500, 0.08, 'sine', 0.2);
    setTimeout(() => this.playTone(600, 0.08, 'sine', 0.2), 80);
    setTimeout(() => this.playTone(700, 0.1, 'sine', 0.15), 160);
  }

  promote() {
    this.playTone(400, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(800, 0.15, 'sine', 0.25), 200);
  }

  illegal() {
    this.playTone(200, 0.15, 'square', 0.15);
  }

  gameStart() {
    this.playTone(523, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.25), 200);
  }
}

export const chessSounds = new ChessSounds();
