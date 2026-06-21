export interface ChatItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Note {
  id: string;
  videoId: string;
  topic: string;
  timestamp: string; // e.g., "12:34"
  seconds: number;
  keyIdea: string;
  explanation: string;
  example: string;
  difficulty: DifficultyLevel;
  tags: string[]; // e.g., ["#important", "#confusing", "#review"]
  chatHistory: ChatItem[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // 0-3 index
  explanation: string;
}

export interface QuizSession {
  questions: QuizQuestion[];
  score?: number;
  completed: boolean;
}

export interface VideoSession {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  notes: Note[];
  quiz?: QuizSession;
  dateAdded: number; // timestamp
}

export type ApiType = 'local' | 'direct';
export type DirectProvider = 'openai' | 'groq' | 'gemini' | 'openrouter';

export interface Settings {
  apiType: ApiType;
  localBackendUrl: string;
  directProvider: DirectProvider;
  apiKey: string;
  modelName: string;
}

export interface Flashcard {
  noteId: string;
  videoId: string;
  videoTitle: string;
  topic: string;
  front: string; // e.g. Topic + Key Idea
  back: string;  // e.g. Explanation + Example
  interval: number; // interval in days
  repetition: number; // number of consecutive successful reviews
  efactor: number; // Easiness factor (default 2.5)
  dueDate: number; // timestamp in ms when card is due
}
