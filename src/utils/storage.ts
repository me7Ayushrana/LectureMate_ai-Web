import type { Settings, VideoSession, Flashcard, Note } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'lecturemate_settings',
  SESSIONS: 'lecturemate_sessions',
  FLASHCARDS: 'lecturemate_flashcards',
};

const DEFAULT_SETTINGS: Settings = {
  apiType: 'direct',
  localBackendUrl: 'http://localhost:8000',
  directProvider: 'openai',
  apiKey: '',
  modelName: 'gpt-4o-mini',
};

// --- Settings ---
export function loadSettings(): Settings {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!data) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// --- Video Sessions ---
export function loadSessions(): VideoSession[] {
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveSessions(sessions: VideoSession[]): void {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function getSession(videoId: string): VideoSession | undefined {
  const sessions = loadSessions();
  return sessions.find((s) => s.videoId === videoId);
}

export function saveSession(session: VideoSession): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.videoId === session.videoId);
  if (idx > -1) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  saveSessions(sessions);
}

export function deleteSession(videoId: string): void {
  const sessions = loadSessions().filter((s) => s.videoId !== videoId);
  saveSessions(sessions);

  // Also clear flashcards associated with this video
  const flashcards = loadFlashcards().filter((card) => card.videoId !== videoId);
  saveFlashcards(flashcards);
}

// --- Flashcards & SM-2 Spaced Repetition ---
export function loadFlashcards(): Flashcard[] {
  const data = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveFlashcards(cards: Flashcard[]): void {
  localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
}

/**
 * Adds or updates a flashcard for a specific note.
 * Called automatically when a note is created/updated.
 */
export function syncFlashcardForNote(note: Note, videoTitle: string): void {
  const cards = loadFlashcards();
  const idx = cards.findIndex((c) => c.noteId === note.id);

  const front = `**[${note.topic}]**\n\nWhat is the key idea of this concept?`;
  const back = `**Key Idea:**\n${note.keyIdea}\n\n**Explanation:**\n${note.explanation}\n\n**Example:**\n${note.example}`;

  if (idx > -1) {
    // Keep existing SM-2 status but update content
    cards[idx] = {
      ...cards[idx],
      topic: note.topic,
      front,
      back,
    };
  } else {
    // Create new card with default SM-2 values
    cards.push({
      noteId: note.id,
      videoId: note.videoId,
      videoTitle,
      topic: note.topic,
      front,
      back,
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now(), // Due immediately
    });
  }
  saveFlashcards(cards);
}

export function removeFlashcardForNote(noteId: string): void {
  const cards = loadFlashcards().filter((c) => c.noteId !== noteId);
  saveFlashcards(cards);
}

/**
 * SM-2 Spaced Repetition Algorithm
 * quality score (0-5):
 * 0: "Complete blackout", 1: "Incorrect, but remembered when shown", 2: "Incorrect, but easy to recall",
 * 3: "Correct, but difficult", 4: "Correct after hesitation", 5: "Perfect response"
 */
export function reviewFlashcard(noteId: string, quality: number): Flashcard {
  const cards = loadFlashcards();
  const idx = cards.findIndex((c) => c.noteId === noteId);
  if (idx === -1) {
    throw new Error('Flashcard not found');
  }

  const card = cards[idx];
  let nextRepetition = card.repetition;
  let nextInterval = card.interval;
  let nextEfactor = card.efactor;

  if (quality >= 3) {
    if (nextRepetition === 0) {
      nextInterval = 1; // 1 day
    } else if (nextRepetition === 1) {
      nextInterval = 6; // 6 days
    } else {
      nextInterval = Math.round(nextInterval * nextEfactor);
    }
    nextRepetition += 1;
  } else {
    // Reset repetition count on failure, keep card active with 1-day interval
    nextRepetition = 0;
    nextInterval = 1;
  }

  // Adjust Easiness Factor
  nextEfactor = nextEfactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (nextEfactor < 1.3) {
    nextEfactor = 1.3;
  }

  // Calculate next due date
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const nextDueDate = Date.now() + nextInterval * millisecondsInDay;

  const updatedCard: Flashcard = {
    ...card,
    repetition: nextRepetition,
    interval: nextInterval,
    efactor: nextEfactor,
    dueDate: nextDueDate,
  };

  cards[idx] = updatedCard;
  saveFlashcards(cards);

  return updatedCard;
}
