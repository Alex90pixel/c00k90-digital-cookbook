/** What the cook can say in Cook mode. */
export type VoiceCommand =
  'next' | 'back' | 'read' | 'ingredients' | 'steps' | 'timer' | 'stop' | 'stopTimer';

/** Speech recognition language for each app language. */
export const SPEECH_LANGUAGES: Record<string, string> = {
  en: 'en-US',
  ro: 'ro-RO',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  de: 'de-DE',
};

/** The words for each command (lower case, without accents), in every app language. */
const WORDS: Record<VoiceCommand, string[]> = {
  next: [
    'next',
    'continue',
    'forward',
    'urmatorul',
    'urmatorul pas',
    'inainte',
    'mai departe',
    'gata',
    'next',
    'siguiente',
    'adelante',
    'listo',
    'suivant',
    'suivante',
    'apres',
    'avanti',
    'prossimo',
    'successivo',
    'weiter',
    'nachster',
    'naechster',
  ],
  back: [
    'back',
    'previous',
    'go back',
    'inapoi',
    'inapoi un pas',
    'precedentul',
    'anterior',
    'atras',
    'anterior',
    'volver',
    'retour',
    'precedent',
    'precedente',
    'indietro',
    'precedente',
    'zuruck',
    'zurueck',
    'vorher',
  ],
  read: [
    'read',
    'repeat',
    'again',
    'read it',
    'citeste',
    'repeta',
    'din nou',
    'lee',
    'leer',
    'repite',
    'otra vez',
    'lis',
    'lire',
    'repete',
    'encore',
    'leggi',
    'ripeti',
    'ancora',
    'lies',
    'vorlesen',
    'wiederholen',
    'nochmal',
  ],
  ingredients: ['ingredients', 'ingrediente', 'ingredientes', 'ingredienti', 'zutaten'],
  steps: ['steps', 'pasi', 'pasii', 'pasos', 'etapes', 'passaggi', 'passi', 'schritte'],
  timer: [
    'timer',
    'start timer',
    'cronometru',
    'porneste cronometrul',
    'temporizador',
    'minuteur',
    'minuterie',
    'wecker',
  ],
  // Stops the reading out loud (and a ringing timer).
  stop: [
    'stop',
    'quiet',
    'silence',
    'enough',
    'stai',
    'opreste',
    'opreste te',
    'liniste',
    'destul',
    'para',
    'basta',
    'silencio',
    'arrete',
    'arrete toi',
    'silence',
    'fermati',
    'basta',
    'silenzio',
    'halt',
    'stopp',
    'ruhe',
    'genug',
  ],
  stopTimer: [
    'stop timer',
    'stop the timer',
    'cancel timer',
    'opreste cronometrul',
    'opreste timerul',
    'stop cronometru',
    'stop timer',
    'para temporizador',
    'para el temporizador',
    'detener temporizador',
    'arrete le minuteur',
    'stop minuteur',
    'ferma timer',
    'ferma il timer',
    'stop timer',
    'timer stoppen',
    'stopp timer',
    'wecker aus',
  ],
};

/** "Următorul!" → "urmatorul". */
function plain(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the command in what the cook said. Only short phrases count ("next", "ok, next"),
 * so a conversation in the kitchen that happens to contain "back" doesn't turn the page.
 */
export function voiceCommand(heard: string): VoiceCommand | null {
  const words = plain(heard).split(' ').filter(Boolean);
  if (!words.length || words.length > 4) return null;
  // The last words decide: "no wait, back" means back.
  for (let size = Math.min(3, words.length); size >= 1; size--) {
    const phrase = words.slice(-size).join(' ');
    for (const [command, list] of Object.entries(WORDS) as [VoiceCommand, string[]][]) {
      if (list.includes(phrase)) return command;
    }
  }
  return null;
}
