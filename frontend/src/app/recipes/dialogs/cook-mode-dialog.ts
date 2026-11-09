import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CookModeData } from '../models/cook-mode.model';
import { durationLabel, formatClock, stepDurations } from '../domain/step-timers';
import { Ingredient } from '../models/recipe.model';
import { I18nService } from '../../core/i18n/i18n.service';
import { SPEECH_LANGUAGES, voiceCommand } from '../domain/voice-commands';

/** The parts of the Web Speech API we use (only Chrome, Edge and Safari have it, prefixed). */
interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<SpeechResultLike> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionClass = new () => RecognitionLike;
function isApple(): boolean {
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
}
function recognitionClass(): RecognitionClass | undefined {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionClass;
    webkitSpeechRecognition?: RecognitionClass;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** A running kitchen timer. */
interface CookTimer {
  id: number;
  /** "3. 10 min": the step it came from and its length. */
  label: string;
  /** Milliseconds since epoch. */
  endsAt: number;
  rang: boolean;
}

/** A short "ding ding ding" (and a buzz on phones) when a timer is done. */
function ring(): void {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    [0, 0.45, 0.9].forEach((start) => {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      tone.frequency.value = 880;
      volume.gain.setValueAtTime(0.0001, audio.currentTime + start);
      volume.gain.exponentialRampToValueAtTime(0.4, audio.currentTime + start + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + 0.35);
      tone.connect(volume).connect(audio.destination);
      tone.start(audio.currentTime + start);
      tone.stop(audio.currentTime + start + 0.4);
    });
    setTimeout(() => void audio.close(), 2000);
  } catch {
    // No sound available: the timer still flashes on screen.
  }
}

/** The parts of the Screen Wake Lock API we use (not in every TypeScript DOM version). */
interface WakeLockSentinelLike {
  release(): Promise<void>;
}
interface WakeLockNavigator {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
}

/**
 * Cook mode: one step at a time in large text, with the ingredients one tap away. The screen
 * stays on while it is open (where the browser supports it), so floury hands don't have to.
 */
@Component({
  selector: 'app-cook-mode-dialog',
  imports: [TranslatePipe],
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    <div class="cook-mode" role="dialog" aria-labelledby="cook-title">
      <header>
        <h2 id="cook-title">👩‍🍳 {{ data.recipeName }}</h2>
        <span class="spacer"></span>
        @if (canListen) {
          <button
            type="button"
            class="voice-btn"
            [class.on]="listening()"
            [attr.aria-pressed]="listening()"
            [title]="(listening() ? 'cookMode.voiceOn' : 'cookMode.voiceHint') | t"
            (click)="toggleVoice()"
          >
            🎙️ {{ (listening() ? 'cookMode.voiceListening' : 'cookMode.voice') | t }}
          </button>
        }
        <button
          type="button"
          class="detail-close"
          [attr.aria-label]="'common.close' | t"
          (click)="ref.close()"
        >
          ✕
        </button>
      </header>

      @if (showIngredients()) {
        <ul class="cook-ingredients">
          @for (ingredient of data.ingredients; track $index) {
            <li>{{ line(ingredient) }}</li>
          }
        </ul>
      } @else {
        <p class="cook-progress">
          {{ 'cookMode.progress' | t: { current: index() + 1, total: total } }}
        </p>
        <p class="cook-step" aria-live="polite">{{ data.steps[index()] }}</p>
        @if (stepTimes().length) {
          <div class="timer-starts">
            @for (seconds of stepTimes(); track seconds) {
              <button type="button" class="timer-start" (click)="startTimer(seconds)">
                ⏲️ {{ 'cookMode.startTimer' | t: { time: label(seconds) } }}
              </button>
            }
          </div>
        }
        @if (isLast()) {
          <p class="cook-done">{{ 'cookMode.done' | t }}</p>
        }
      }

      @if (timers().length) {
        <ul class="timers" [attr.aria-label]="'cookMode.timers' | t">
          @for (timer of timers(); track timer.id) {
            @let left = remaining(timer);
            <li [class.ringing]="left <= 0">
              <span class="timer-name">⏲️ {{ timer.label }}</span>
              <span class="timer-clock" role="timer">
                {{ left > 0 ? clock(left) : ('cookMode.timeUp' | t) }}
              </span>
              <button
                type="button"
                class="timer-stop"
                [attr.aria-label]="'cookMode.stopTimer' | t"
                (click)="stopTimer(timer.id)"
              >
                ✕
              </button>
            </li>
          }
        </ul>
      }

      @if (listening()) {
        <p class="voice-help">{{ 'cookMode.voiceHelp' | t }}</p>
      }
      @if (voiceError()) {
        <p class="voice-help error">{{ voiceError()! | t }}</p>
      }

      @if (celebrating()) {
        <div class="party" aria-hidden="true">
          @for (piece of confetti; track $index) {
            <i
              [style.left.%]="piece.left"
              [style.background]="piece.color"
              [style.animation-delay.ms]="piece.delay"
              [style.--drift.px]="piece.drift"
              [style.--spin.deg]="piece.spin"
            ></i>
          }
        </div>
        <p class="party-text" role="status">{{ 'cookMode.celebrate' | t }}</p>
      }

      <div class="cook-bar">
        <button type="button" class="btn-action" (click)="showIngredients.set(!showIngredients())">
          {{ (showIngredients() ? 'cookMode.backToSteps' : 'cookMode.ingredients') | t }}
        </button>
        <span class="spacer"></span>
        <button type="button" class="btn-action" [disabled]="isFirst()" (click)="go(-1)">
          ← {{ 'cookMode.previous' | t }}
        </button>
        @if (isLast()) {
          <button type="button" class="btn-save" [disabled]="celebrating()" (click)="finish()">
            {{ 'cookMode.finish' | t }}
          </button>
        } @else {
          <button type="button" class="btn-save" (click)="go(1)">
            {{ 'cookMode.next' | t }} →
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .cook-mode {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: min(70vh, 640px);
      padding: 28px;
      border-radius: 20px;
      background: var(--card);
      box-shadow: var(--panel-shadow);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    h2 {
      margin: 0;
      color: var(--magenta-deep);
      font-family: 'Playfair Display', serif;
      font-size: 20px;
    }
    .cook-progress {
      margin: 0;
      color: var(--teal);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .cook-step {
      flex: 1;
      margin: 0;
      color: var(--text-dark);
      font-size: clamp(22px, 4vw, 32px);
      line-height: 1.45;
    }
    .cook-done {
      margin: 0;
      color: var(--teal);
      font-weight: 700;
    }
    .cook-ingredients {
      flex: 1;
      margin: 0;
      padding-left: 20px;
      color: var(--text-dark);
      font-size: 20px;
      line-height: 1.8;
    }
    .cook-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }
    .spacer {
      flex: 1;
    }
    .party {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .party i {
      position: absolute;
      top: -16px;
      width: 9px;
      height: 14px;
      border-radius: 2px;
      opacity: 0;
      animation: fall 1.7s cubic-bezier(0.25, 0.6, 0.5, 1) forwards;
    }
    @keyframes fall {
      0% {
        opacity: 1;
        transform: translate(0, 0) rotate(0);
      }
      85% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(var(--drift), 640px) rotate(var(--spin));
      }
    }
    .party-text {
      position: absolute;
      inset: 50% 16px auto;
      margin: 0;
      color: var(--magenta-deep);
      font-family: 'Playfair Display', serif;
      font-size: clamp(26px, 5vw, 40px);
      font-weight: 700;
      text-align: center;
      transform: translateY(-50%);
      animation: pop 0.5s cubic-bezier(0.3, 1.6, 0.6, 1) both;
    }
    @keyframes pop {
      from {
        opacity: 0;
        transform: translateY(-50%) scale(0.6);
      }
    }
    .voice-btn {
      padding: 6px 14px;
      border: 1.5px solid var(--border, #ddd);
      border-radius: 50px;
      background: transparent;
      color: var(--text-dark);
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .voice-btn.on {
      border-color: var(--magenta);
      background: var(--magenta);
      color: #fff;
      animation: listen 1.6s ease-in-out infinite;
    }
    @keyframes listen {
      50% {
        box-shadow: 0 0 0 6px color-mix(in srgb, var(--magenta) 25%, transparent);
      }
    }
    .voice-help {
      margin: 0;
      color: var(--text-muted, #777);
      font-size: 13px;
    }
    .voice-help.error {
      color: var(--magenta-deep);
    }
    .timer-starts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .timer-start {
      padding: 8px 16px;
      border: 1.5px solid var(--teal);
      border-radius: 50px;
      background: var(--teal-pale);
      color: var(--teal-deep);
      font: inherit;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
    }
    .timers {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .timers li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 6px 6px 14px;
      border-radius: 50px;
      background: var(--teal-pale);
      color: var(--teal-deep);
      font-weight: 600;
    }
    .timers li.ringing {
      background: var(--magenta);
      color: #fff;
      animation: ring 0.8s ease-in-out infinite alternate;
    }
    .timer-clock {
      font-size: 18px;
      font-variant-numeric: tabular-nums;
    }
    .timer-stop {
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: inherit;
      cursor: pointer;
    }
    @keyframes ring {
      to {
        transform: scale(1.05);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .timers li.ringing,
      .voice-btn.on,
      .party-text {
        animation: none;
      }
      .party {
        display: none;
      }
    }
  `,
})
export class CookModeDialog {
  protected readonly data = inject<CookModeData>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);

  protected readonly total = this.data.steps.length;
  protected readonly index = signal(0);
  protected readonly showIngredients = signal(false);
  protected readonly isFirst = computed(() => this.index() === 0);
  protected readonly isLast = computed(() => this.index() >= this.total - 1);
  protected readonly line = (ingredient: Ingredient) =>
    [ingredient.qty, ingredient.unit, ingredient.name].filter((part) => part?.trim()).join(' ');

  // Timers: started from the times found in the steps; they keep running between steps.
  protected readonly stepTimes = computed(() => stepDurations(this.data.steps[this.index()] ?? ''));
  protected readonly timers = signal<CookTimer[]>([]);
  private readonly now = signal(Date.now());
  private nextTimerId = 0;
  protected readonly label = durationLabel;
  protected readonly clock = formatClock;

  private wakeLock: WakeLockSentinelLike | null = null;

  // Voice: "next", "back", "repeat", "ingredients", "timer", for hands that are busy.
  private readonly i18n = inject(I18nService);
  protected readonly canListen = !!recognitionClass();
  protected readonly listening = signal(false);
  protected readonly voiceError = signal<
    'cookMode.voiceBlocked' | 'cookMode.voiceIphone' | 'cookMode.voiceStopped' | null
  >(null);
  private recognition: RecognitionLike | null = null;

  constructor() {
    void this.keepScreenOn();
    // The browser drops the lock when the tab is hidden; take it again when the cook comes back.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void this.keepScreenOn();
    };
    document.addEventListener('visibilitychange', onVisible);
    // One tick a second for the countdowns; it rings when a timer reaches zero.
    const tick = setInterval(() => {
      this.now.set(Date.now());
      for (const timer of this.timers()) {
        if (!timer.rang && this.remaining(timer) <= 0) {
          timer.rang = true;
          ring();
        }
      }
    }, 1000);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(tick);
      this.stopVoice();
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
      document.removeEventListener('visibilitychange', onVisible);
      void this.wakeLock?.release().catch(() => undefined);
    });
  }

  protected startTimer(seconds: number): void {
    this.timers.update((list) => [
      ...list,
      {
        id: this.nextTimerId++,
        label: `${this.index() + 1}. ${durationLabel(seconds)}`,
        endsAt: Date.now() + seconds * 1000,
        rang: false,
      },
    ]);
    this.now.set(Date.now());
  }

  protected stopTimer(id: number): void {
    this.timers.update((list) => list.filter((t) => t.id !== id));
  }

  /** Seconds left (0 or less once it has rung). */
  protected remaining(timer: CookTimer): number {
    return (timer.endsAt - this.now()) / 1000;
  }

  protected go(step: number): void {
    this.showIngredients.set(false);
    this.index.update((i) => Math.min(this.total - 1, Math.max(0, i + step)));
  }

  // 🎉 A short celebration when the last step is done, then the dialog closes.
  protected readonly celebrating = signal(false);
  protected readonly confetti = Array.from({ length: 48 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 450,
    drift: (Math.random() - 0.5) * 160,
    spin: (Math.random() - 0.5) * 1080,
    color: ['var(--magenta)', 'var(--teal)', '#f5b83d', '#ff8a65', '#7cc6a4'][i % 5],
  }));

  protected finish(): void {
    if (this.celebrating()) return;
    this.stopVoice();
    this.celebrating.set(true);
    navigator.vibrate?.([60, 60, 120]);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => this.ref.close('cooked'), reduced ? 900 : 1800);
  }

  protected toggleVoice(): void {
    if (this.listening()) this.stopVoice();
    else this.startVoice();
  }

  private startVoice(): void {
    const Recognition = recognitionClass();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = SPEECH_LANGUAGES[this.i18n.language()] ?? 'en-US';
    recognition.continuous = true;
    // Safari (iPhone) often never marks a phrase as final, so commands are also taken from the
    // results in progress, once per phrase.
    recognition.interimResults = true;
    // A phrase in progress waits a moment, so "stop" doesn't fire before "stop timer" is heard.
    const handled = new Set<number>();
    const waiting = new Map<number, ReturnType<typeof setTimeout>>();
    const run = (index: number, heard: string) => {
      clearTimeout(waiting.get(index));
      waiting.delete(index);
      if (handled.has(index)) return;
      handled.add(index);
      this.runCommand(heard);
    };
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (handled.has(i)) continue;
        const heard = result[0].transcript;
        if (result.isFinal) run(i, heard);
        else if (voiceCommand(heard)) {
          clearTimeout(waiting.get(i));
          waiting.set(
            i,
            setTimeout(() => run(i, heard), 700),
          );
        }
      }
    };
    recognition.onerror = (event) => {
      // "no-speech" just means a quiet kitchen; a refused microphone stops listening.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        // On iPhone, speech recognition needs Siri & Dictation to be on.
        this.voiceError.set(
          event.error === 'service-not-allowed' && isApple()
            ? 'cookMode.voiceIphone'
            : 'cookMode.voiceBlocked',
        );
        this.stopVoice();
      }
    };
    // The browser stops after a while of silence: listen again while the button is on.
    recognition.onend = () => {
      if (!this.listening() || this.recognition !== recognition) return;
      handled.clear();
      waiting.forEach(clearTimeout);
      waiting.clear();
      setTimeout(() => {
        if (!this.listening() || this.recognition !== recognition) return;
        try {
          recognition.start();
        } catch {
          // iPhone only lets listening start from a tap.
          this.voiceError.set('cookMode.voiceStopped');
          this.stopVoice();
        }
      }, 250);
    };
    this.recognition = recognition;
    this.voiceError.set(null);
    this.listening.set(true);
    try {
      recognition.start();
    } catch {
      this.stopVoice();
    }
  }

  private stopVoice(): void {
    this.listening.set(false);
    const recognition = this.recognition;
    this.recognition = null;
    try {
      recognition?.stop();
    } catch {
      // Already stopped.
    }
  }

  private runCommand(heard: string): void {
    switch (voiceCommand(heard)) {
      case 'next':
        if (this.isLast()) this.finish();
        else this.go(1);
        break;
      case 'back':
        this.go(-1);
        break;
      case 'read':
        this.readAloud();
        break;
      case 'ingredients':
        this.showIngredients.set(true);
        break;
      case 'steps':
        this.showIngredients.set(false);
        break;
      case 'stop':
        this.silence();
        break;
      case 'stopTimer':
        this.stopLatestTimer();
        break;
      case 'timer': {
        const [first] = this.stepTimes();
        if (first) this.startTimer(first);
        break;
      }
    }
  }

  /**
   * "Stop": stops the reading out loud; when nothing is being read, it stops a timer instead
   * (a ringing one, or else the one started last).
   */
  private silence(): void {
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      return;
    }
    this.stopLatestTimer();
  }

  /** "Stop timer": the ringing ones, or else the one started last. */
  private stopLatestTimer(): void {
    const list = this.timers();
    const ringing = list.filter((t) => this.remaining(t) <= 0);
    if (ringing.length) this.timers.set(list.filter((t) => !ringing.includes(t)));
    else this.timers.set(list.slice(0, -1));
  }

  /** Reads the current step out loud, in the app's language. */
  private readAloud(): void {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const text = this.showIngredients()
      ? this.data.ingredients.map(this.line).join(', ')
      : (this.data.steps[this.index()] ?? '');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANGUAGES[this.i18n.language()] ?? 'en-US';
    speechSynthesis.speak(utterance);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.go(1);
    if (event.key === 'ArrowLeft') this.go(-1);
  }

  private async keepScreenOn(): Promise<void> {
    try {
      this.wakeLock = (await (navigator as WakeLockNavigator).wakeLock?.request('screen')) ?? null;
    } catch {
      // Not supported or not allowed (e.g. battery saver): cook mode still works.
    }
  }
}
