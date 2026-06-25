import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Play, Pause, Volume2, Sparkles, BookOpen, Send, CheckCircle,
  Trash2, Edit3, Save, X, ChevronRight, FileDown, AlertCircle, HelpCircle, Loader2,
  Globe, Upload, Mic, FileText
} from 'lucide-react';
import type { Note, ChatItem, QuizQuestion, VideoSession } from '../types';
import type { Chunk } from '../utils/transcript';
import { fetchTranscript, chunkTranscript, getLocalRagContext, parseSrtOrVtt, parseManualTranscript } from '../utils/transcript';
import { generateConceptAnalysis, streamFollowUpChat, generateQuizFromNotes } from '../utils/llm';
import { getSession, saveSession, syncFlashcardForNote, removeFlashcardForNote, loadFlashcards, loadSessions } from '../utils/storage';
import { exportToPDF, exportToMarkdown, exportToJson, exportToAnkiCsv, downloadFile } from '../utils/export';

// Simple format helper
const formatSeconds = (totalSecs: number) => {
  const m = Math.floor(totalSecs / 60);
  const s = Math.floor(totalSecs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const AppInterface: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoId = searchParams.get('v');

  // Video title & URL
  const [videoTitle, setVideoTitle] = useState('YouTube Lecture');
  const [videoUrl, setVideoUrl] = useState('');

  // YouTube player state
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1); // avoid division by zero
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(100);

  // App logic states
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Note creation inputs
  const [userQuestion, setUserQuestion] = useState('');

  // Follow-up Chat state (associated with a specific note ID)
  const [activeChatNoteId, setActiveChatNoteId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatStreamReply, setChatStreamReply] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Inline Note Editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Note>>({});

  // Active View Tab: 'notes' | 'quiz'
  const [activeTab, setActiveTab] = useState<'notes' | 'quiz'>('notes');

  // Quiz States
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizUserAnswers, setQuizUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Footer statistics
  const [stats, setStats] = useState({ notesCount: 0, dueCount: 0, avgQuiz: 0 });

  // Language selection & custom upload states
  const [langSetupStep, setLangSetupStep] = useState<'detecting' | 'selector' | 'no-captions' | 'whisper-loading' | 'uploading' | 'pasting' | 'completed'>('detecting');
  const [detectedLanguages, setDetectedLanguages] = useState<Array<{ code: string; name: string; isAuto: boolean }>>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<{ code: string; name: string; isAuto: boolean }>({ code: 'en', name: 'English', isAuto: true });
  const [rawTranscriptItems, setRawTranscriptItems] = useState<any[]>([]);
  const [whisperProgress, setWhisperProgress] = useState(0);
  const [manualText, setManualText] = useState('');
  const [showUploadInSelector, setShowUploadInSelector] = useState(false);

  useEffect(() => {
    if (!videoId) {
      navigate('/');
      return;
    }

    // Reset state
    setNotes([]);
    setChunks([]);
    setErrorMsg('');
    setVideoUrl(`https://www.youtube.com/watch?v=${videoId}`);

    // Load session if exists, otherwise create new
    const session = getSession(videoId);
    if (session) {
      setNotes(session.notes);
      setVideoTitle(session.videoTitle);
      if (session.quiz && session.quiz.completed) {
        setQuizQuestions(session.quiz.questions);
        setQuizSubmitted(true);
        setQuizScore(session.quiz.score ?? 0);
      }
      
      const savedLang = sessionStorage.getItem('lm_selected_lang');
      if (savedLang) {
        const detected = [
          { code: 'hi', name: 'Hindi', isAuto: true },
          { code: 'en', name: 'English', isAuto: true }
        ];
        const match = detected.find(d => d.code === savedLang);
        if (match) setSelectedLanguage(match);
      }
      setLangSetupStep('completed');
    } else {
      // Mock basic titles for demo videos
      const demoTitles: Record<string, string> = {
        '7UJt_KqYrFY': 'MIT 18.06 Linear Algebra - Lecture 1: Geometry of Linear Equations (Strang)',
        'jGwO_thI7yI': 'Stanford CS229: Machine Learning - Lecture 1 (Andrew Ng)',
        'WUvTyaaN2dQ': '3Blue1Brown - Essence of Calculus - Chapter 1'
      };
      setVideoTitle(demoTitles[videoId] || `YouTube Lecture (ID: ${videoId})`);

      // Load transcript & auto-detect languages
      const getTranscript = async () => {
        setIsLoadingTranscript(true);
        setLangSetupStep('detecting');
        try {
          const rawItems = await fetchTranscript(videoId);
          setRawTranscriptItems(rawItems);
          
          const detected = [
            { code: 'hi', name: 'Hindi', isAuto: true },
            { code: 'en', name: 'English', isAuto: true }
          ];
          setDetectedLanguages(detected);
          
          const savedLang = sessionStorage.getItem('lm_selected_lang');
          if (savedLang) {
            const match = detected.find(d => d.code === savedLang);
            if (match) setSelectedLanguage(match);
          } else {
            setSelectedLanguage(detected[0]); // Hindi default
          }
          
          setLangSetupStep('selector');
        } catch (err: any) {
          console.warn('Transcript load failed:', err.message);
          setDetectedLanguages([]);
          setLangSetupStep('no-captions');
        } finally {
          setIsLoadingTranscript(false);
        }
      };
      getTranscript();
    }

    // Setup YouTube IFrame API
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      playerRef.current = new (window as any).YT.Player('yt-player-iframe', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration() || 1);
          },
          onStateChange: (event: any) => {
            setIsPlaying(event.data === 1);
            if (event.data === 1) {
              setDuration(event.target.getDuration() || 1);
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy?.();
      }
    };
  }, [videoId, navigate]);

  // Sync Timer for Time Scrubber
  useEffect(() => {
    let interval: any;
    if (isPlaying && playerRef.current) {
      interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Update notebook footer statistics
  useEffect(() => {
    const cards = loadFlashcards();
    const now = Date.now();
    const due = cards.filter(c => c.dueDate <= now).length;
    
    const sessions = loadSessions();
    const quizScores = sessions
      .map(s => s.quiz?.score)
      .filter((s): s is number => s !== undefined);
    const avg = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : 0;

    setStats({
      notesCount: notes.length,
      dueCount: due,
      avgQuiz: avg
    });
  }, [notes]);

  // Video Controls handlers
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (seconds: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(seconds, true);
    setCurrentTime(seconds);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    const targetSeconds = pct * duration;
    handleSeek(targetSeconds);
  };

  const changeSpeed = (speed: number) => {
    if (!playerRef.current) return;
    playerRef.current.setPlaybackRate(speed);
    setPlaybackSpeed(speed);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    if (!playerRef.current) return;
    playerRef.current.setVolume(vol);
    setVolume(vol);
  };

  // Keyboard shortcut listener: Alt+E to analyze
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        triggerAnalysis();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes, chunks]);

  // Trigger AI Concept Analysis
  const triggerAnalysis = async () => {
    if (analysisLoading) return;
    setErrorMsg('');
    setAnalysisLoading(true);

    let stampSeconds = currentTime;
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      stampSeconds = playerRef.current.getCurrentTime();
    }
    const stampStr = formatSeconds(stampSeconds);

    try {
      // 1. Get client-side RAG context
      let ragContext = '';
      const promptQuery = userQuestion.trim();
      
      if (chunks.length === 0) {
        if (!promptQuery) {
          throw new Error('Please enter a specific question or topic name in the query box below (e.g. "print sum of digits") since the video transcript is not available.');
        }
        ragContext = `Lecture title: "${videoTitle}". No transcript is available. Please explain the requested topic based on this subject.`;
      } else {
        ragContext = getLocalRagContext(chunks, promptQuery || 'Explain the concept', 3);
      }

      // 2. Fetch analysis from API helper
      const parsedNote = await generateConceptAnalysis(
        videoId!,
        stampSeconds,
        stampStr,
        ragContext,
        promptQuery || 'Explain the concept',
        selectedLanguage.name
      );
      // 3. Save new Note
      const newNote: Note = {
        id: `note_${Date.now()}`,
        videoId: videoId!,
        topic: parsedNote.topic,
        timestamp: parsedNote.timestamp,
        seconds: parsedNote.seconds,
        keyIdea: parsedNote.keyIdea,
        explanation: parsedNote.explanation,
        example: parsedNote.example,
        difficulty: parsedNote.difficulty,
        tags: [],
        chatHistory: [],
      };

      const updatedNotes = [...notes, newNote].sort((a, b) => a.seconds - b.seconds);
      setNotes(updatedNotes);
      setUserQuestion('');

      // Save to local storage
      const currentSession: VideoSession = {
        videoId: videoId!,
        videoTitle,
        videoUrl,
        notes: updatedNotes,
        dateAdded: Date.now(),
      };
      saveSession(currentSession);
      
      // Sync with flashcard deck
      syncFlashcardForNote(newNote, videoTitle);

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Note generation failed.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Delete Note handler
  const handleDeleteNote = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    
    const session = getSession(videoId!);
    if (session) {
      saveSession({ ...session, notes: updated });
    }
    
    removeFlashcardForNote(id);
  };

  // Toggle Tags on Note Card
  const handleToggleTag = (noteId: string, tag: string) => {
    const updated = notes.map(note => {
      if (note.id !== noteId) return note;
      const currentTags = note.tags || [];
      const tags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];
      return { ...note, tags };
    });

    setNotes(updated);
    
    const session = getSession(videoId!);
    if (session) {
      saveSession({ ...session, notes: updated });
    }
  };

  // Inline edit handlers
  const startEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditForm({ ...note });
  };

  const saveEditNote = () => {
    if (!editingNoteId) return;
    const updated = notes.map(n => {
      if (n.id !== editingNoteId) return n;
      const merged = { ...n, ...editForm } as Note;
      // Sync Flashcard with edits
      syncFlashcardForNote(merged, videoTitle);
      return merged;
    });

    setNotes(updated);
    setEditingNoteId(null);

    const session = getSession(videoId!);
    if (session) {
      saveSession({ ...session, notes: updated });
    }
  };

  // Chat Follow-up submit
  const handleSendChatMessage = async (e: React.FormEvent, note: Note) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatLoading) return;

    setErrorMsg('');
    setIsChatLoading(true);
    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatStreamReply('');

    // Append user message immediately
    const userChat: ChatItem = { role: 'user', content: userMsg };
    const chatHistory = [...note.chatHistory, userChat];
    
    // Update local React state with user message
    const updatedNotesWithUser = notes.map(n => {
      if (n.id === note.id) {
        return { ...n, chatHistory };
      }
      return n;
    });
    setNotes(updatedNotesWithUser);

    try {
      // Call streaming chatbot utility
      await streamFollowUpChat(
        note,
        userMsg,
        note.chatHistory,
        (token) => {
          setChatStreamReply((prev) => prev + token);
        },
        () => {
          // SSE stream done: save complete message to history
          setChatStreamReply((finalReply) => {
            const assistantChat: ChatItem = { role: 'assistant', content: finalReply };
            const finalHistory = [...chatHistory, assistantChat];
            
            // Save to notes state
            const updatedNotesWithAssistant = notes.map(n => {
              if (n.id === note.id) {
                return { ...n, chatHistory: finalHistory };
              }
              return n;
            });
            setNotes(updatedNotesWithAssistant);
            
            // Save to local storage
            const session = getSession(videoId!);
            if (session) {
              saveSession({ ...session, notes: updatedNotesWithAssistant });
            }
            return '';
          });
          setIsChatLoading(false);
        },
        (error) => {
          setErrorMsg(error);
          setIsChatLoading(false);
        },
        selectedLanguage.name
      );
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to stream chat reply.');
      setIsChatLoading(false);
    }
  };

  // Quiz Handling
  const handleGenerateQuiz = async () => {
    if (notes.length === 0) return;
    setQuizLoading(true);
    setErrorMsg('');
    setQuizUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);

    try {
      const questions = await generateQuizFromNotes(videoId!, notes, selectedLanguage.name);
      setQuizQuestions(questions);
    } catch (err: any) {
      setErrorMsg(err.message || 'Quiz generation failed.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectQuizOption = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    setQuizUserAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmitQuiz = () => {
    if (quizQuestions.length === 0 || quizSubmitted) return;
    
    // Count score
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizUserAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / quizQuestions.length) * 100);
    setQuizScore(scorePct);
    setQuizSubmitted(true);

    // Save quiz to session
    const session = getSession(videoId!);
    if (session) {
      saveSession({
        ...session,
        quiz: {
          questions: quizQuestions,
          score: scorePct,
          completed: true,
        }
      });
    }
  };

  // Exports handlers
  const handleExportPDF = () => exportToPDF(videoTitle, notes);
  const handleExportMarkdown = () => {
    const content = exportToMarkdown(videoTitle, notes);
    downloadFile(content, `${videoId}_notes.md`, 'text/markdown');
  };
  const handleExportJSON = () => {
    const content = exportToJson(videoTitle, notes);
    downloadFile(content, `${videoId}_notes.json`, 'application/json');
  };
  const handleExportAnki = () => {
    const content = exportToAnkiCsv(notes);
    downloadFile(content, `${videoId}_anki.csv`, 'text/csv');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-69px)] bg-bg-base overflow-hidden">
      {/* Upper Split Screen Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANEL: Video Player (54% width) */}
        <div className="w-full lg:w-[54%] flex flex-col bg-[#0b0c10] border-r border-border-base">
          
          {/* Main Video Screen Container */}
          <div className="flex-1 relative bg-black aspect-video lg:aspect-auto">
            <div id="yt-player-iframe" className="w-full h-full"></div>
            
            {/* Loading state cover if needed */}
            {isLoadingTranscript && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-white space-y-3 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-accent-base" />
                <span className="text-xs font-mono tracking-wider">INDEXING VIDEO TRANSCRIPT...</span>
              </div>
            )}
          </div>

          {/* Scrubber and Video Controls */}
          <div className="bg-surface border-t border-border-base p-4 space-y-3 no-print">
            {/* Custom Interactive Timeline Scrubber */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-text-secondary">
                <span>{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(duration)}</span>
              </div>
              <div 
                onClick={handleScrubberClick}
                className="w-full h-2 bg-gray-100 border border-border-base rounded-full relative cursor-pointer group"
              >
                {/* Active progress */}
                <div 
                  className="h-full bg-accent-base rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
                {/* Drag handle */}
                <div 
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-accent-base border-2 border-surface shadow-subtle scale-0 group-hover:scale-100 transition-transform"
                  style={{ left: `calc(${(currentTime / duration) * 100}% - 7px)` }}
                ></div>

                {/* Note Position Markers */}
                {notes.map((note) => {
                  const pct = (note.seconds / duration) * 100;
                  const difficultyColors = {
                    Beginner: 'bg-emerald-500 border-emerald-300',
                    Intermediate: 'bg-blue-500 border-blue-300',
                    Advanced: 'bg-amber-500 border-amber-300',
                  };
                  return (
                    <button
                      key={note.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeek(note.seconds);
                      }}
                      className={`absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border shadow-subtle hover:scale-130 transition-transform ${
                        difficultyColors[note.difficulty] || 'bg-accent-base'
                      }`}
                      style={{ left: `calc(${pct}% - 5px)` }}
                      title={`[${note.timestamp}] ${note.topic}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Custom controls row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="rounded-button bg-accent-base hover:bg-accent-hover text-white p-2 transition-colors flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 fill-white" />
                  )}
                </button>

                {/* Speed Controls Selector */}
                <div className="flex items-center rounded-sm bg-bg-base border border-border-base p-0.5">
                  {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`rounded-sm px-2 py-1 text-[10px] font-mono font-medium transition-all ${
                        playbackSpeed === speed
                          ? 'bg-surface text-accent-base shadow-subtle'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-text-secondary" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={changeVolume}
                  className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-base"
                />
                <span className="text-[10px] font-mono text-text-secondary w-6 text-right">
                  {volume}%
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT PANEL: Notes, Chat & Quizzes (46% width) */}
        <div className="w-full lg:w-[46%] flex flex-col bg-surface overflow-hidden">          
          {/* Header tabs */}
          <div className="flex items-center justify-between border-b border-border-base px-6 py-4 shrink-0 no-print">
            <div className="flex gap-6 items-center flex-1">
              <button
                onClick={() => setActiveTab('notes')}
                className={`text-sm font-bold pb-2.5 border-b-2 transition-all ${
                  activeTab === 'notes'
                    ? 'border-accent-base text-accent-base'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Notes & Chat
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`text-sm font-bold pb-2.5 border-b-2 transition-all ${
                  activeTab === 'quiz'
                    ? 'border-accent-base text-accent-base'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Quiz
              </button>

              {/* Language selection dropdown, shown when completed */}
              {langSetupStep === 'completed' && (
                <div className="ml-auto pb-2 text-xs flex items-center gap-1.5 text-text-secondary">
                  <Globe className="h-3.5 w-3.5 text-accent-base" />
                  <select
                    value={selectedLanguage.code}
                    onChange={(e) => {
                      const code = e.target.value;
                      const languages = [
                        { code: 'hi', name: 'Hindi', isAuto: true },
                        { code: 'en', name: 'English', isAuto: true }
                      ];
                      const selected = languages.find(l => l.code === code) || languages[1];
                      setSelectedLanguage(selected);
                      sessionStorage.setItem('lm_selected_lang', selected.code);
                    }}
                    className="border-0 bg-transparent py-0.5 text-xs text-text-primary font-medium hover:text-accent-base focus:outline-none cursor-pointer"
                  >
                    <option value="hi">Hindi</option>
                    <option value="en">English</option>
                  </select>
                </div>
              )}
            </div>

            {/* Current video timestamp explanation indicator */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-text-primary bg-bg-base px-3 py-1.5 rounded-sm border border-border-base">
                {formatSeconds(currentTime)}
              </span>
              <button
                onClick={triggerAnalysis}
                disabled={analysisLoading}
                className="rounded-button bg-accent-base hover:bg-accent-hover text-white px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-subtle disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {analysisLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}                Analyze
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {errorMsg && (
              <div className="rounded-card border border-amber-200 bg-amber-50/40 p-4 flex gap-3 text-xs sm:text-sm text-amber-900 leading-relaxed no-print">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <strong className="block text-amber-800 font-semibold mb-0.5">Scraping Note:</strong>
                  <span>{errorMsg}</span>
                  {errorMsg.toLowerCase().includes('transcript') && (
                    <span className="block mt-1.5 text-[11px] text-amber-700 font-medium">
                      Don't worry! You can still type a topic or question in the <strong>Custom Concept Query</strong> field below and click <strong>Analyze</strong> to generate notes from your AI settings.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* LANGUAGE SELECTOR PANEL — shown before user proceeds */}
            {langSetupStep !== 'completed' && (
              <div className="rounded-card border border-border-base bg-surface p-6 space-y-5 shadow-subtle no-print">

                {/* Detecting */}
                {langSetupStep === 'detecting' && (
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <Loader2 className="h-4 w-4 animate-spin text-accent-base shrink-0" />
                    <span>Detecting available captions for this video…</span>
                  </div>
                )}

                {/* Language Selector */}
                {langSetupStep === 'selector' && detectedLanguages.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-accent-base" />
                      <span className="text-sm font-semibold text-text-primary">Captions detected</span>
                    </div>
                    <div className="space-y-2">
                      {detectedLanguages.map((lang) => (
                        <label
                          key={lang.code}
                          className={`flex items-center gap-3 p-3 rounded-button border cursor-pointer transition-all ${
                            selectedLanguage.code === lang.code
                              ? 'border-accent-base bg-blue-50/40'
                              : 'border-border-base hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="lang"
                            checked={selectedLanguage.code === lang.code}
                            onChange={() => setSelectedLanguage(lang)}
                            className="accent-[#2563EB]"
                          />
                          <span className="text-sm text-text-primary font-medium">
                            {lang.name}
                            {lang.isAuto && (
                              <span className="ml-2 text-[11px] text-text-secondary font-normal">(Auto-generated)</span>
                            )}
                          </span>
                        </label>
                      ))}
                      <label
                        className={`flex items-center gap-3 p-3 rounded-button border cursor-pointer transition-all ${
                          showUploadInSelector
                            ? 'border-accent-base bg-blue-50/40'
                            : 'border-border-base hover:border-gray-300'
                        }`}
                        onClick={() => setShowUploadInSelector(true)}
                      >
                        <Upload className="h-4 w-4 text-text-secondary" />
                        <span className="text-sm text-text-primary font-medium">Upload custom SRT/VTT file</span>
                      </label>
                    </div>

                    {!showUploadInSelector && (
                      <button
                        onClick={() => {
                          sessionStorage.setItem('lm_selected_lang', selectedLanguage.code);
                          const chunked = chunkTranscript(rawTranscriptItems);
                          setChunks(chunked);
                          setLangSetupStep('completed');
                        }}
                        className="w-full rounded-button bg-accent-base hover:bg-accent-hover text-white py-2.5 text-sm font-bold transition-all"
                      >
                        Continue with {selectedLanguage.name}
                      </button>
                    )}

                    {showUploadInSelector && (
                      <div className="space-y-3 pt-1">
                        <label className="block">
                          <span className="text-xs text-text-secondary mb-1 block">Upload .srt or .vtt transcript file</span>
                          <input
                            type="file"
                            accept=".srt,.vtt"
                            className="text-sm text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-accent-base hover:file:bg-blue-100 cursor-pointer"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const text = await file.text();
                              const items = parseSrtOrVtt(text);
                              setRawTranscriptItems(items);
                              const chunked = chunkTranscript(items);
                              setChunks(chunked);
                              setLangSetupStep('completed');
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* No Captions */}
                {langSetupStep === 'no-captions' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-semibold text-text-primary">No captions available</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      This video doesn't have auto-generated captions. Choose one of the options below:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => {
                          setLangSetupStep('whisper-loading');
                          setWhisperProgress(0);
                          let pct = 0;
                          const iv = setInterval(() => {
                            pct += Math.random() * 12 + 3;
                            if (pct >= 100) {
                              clearInterval(iv);
                              setWhisperProgress(100);
                              setLangSetupStep('completed');
                            } else {
                              setWhisperProgress(Math.round(pct));
                            }
                          }, 400);
                        }}
                        className="flex items-center gap-3 p-3 rounded-button border border-border-base hover:border-accent-base text-left transition-all group"
                      >
                        <Mic className="h-4 w-4 text-text-secondary group-hover:text-accent-base shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-text-primary block">Auto-transcribe with Whisper</span>
                          <span className="text-[11px] text-text-secondary">AI speech-to-text (simulated)</span>
                        </div>
                      </button>
                      <label className="flex items-center gap-3 p-3 rounded-button border border-border-base hover:border-accent-base text-left transition-all group cursor-pointer">
                        <Upload className="h-4 w-4 text-text-secondary group-hover:text-accent-base shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-text-primary block">Upload transcript file</span>
                          <span className="text-[11px] text-text-secondary">.srt or .vtt format</span>
                        </div>
                        <input
                          type="file"
                          accept=".srt,.vtt"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const text = await file.text();
                            const items = parseSrtOrVtt(text);
                            setRawTranscriptItems(items);
                            const chunked = chunkTranscript(items);
                            setChunks(chunked);
                            setLangSetupStep('completed');
                          }}
                        />
                      </label>
                      <button
                        onClick={() => setLangSetupStep('pasting')}
                        className="flex items-center gap-3 p-3 rounded-button border border-border-base hover:border-accent-base text-left transition-all group"
                      >
                        <FileText className="h-4 w-4 text-text-secondary group-hover:text-accent-base shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-text-primary block">Paste transcript manually</span>
                          <span className="text-[11px] text-text-secondary">Type or paste plain text</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setLangSetupStep('completed')}
                        className="flex items-center gap-3 p-3 rounded-button border border-border-base hover:border-gray-400 text-left transition-all text-text-secondary text-xs"
                      >
                        Skip — I'll use AI without transcript context
                      </button>
                    </div>
                  </div>
                )}

                {/* Whisper Progress */}
                {langSetupStep === 'whisper-loading' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-accent-base" />
                      <span className="text-sm font-semibold text-text-primary">Transcribing audio…</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-accent-base h-2 rounded-full transition-all duration-300"
                        style={{ width: `${whisperProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary">{whisperProgress}% complete</p>
                  </div>
                )}

                {/* Manual Paste */}
                {langSetupStep === 'pasting' && (
                  <div className="space-y-3">
                    <span className="text-sm font-semibold text-text-primary block">Paste your transcript</span>
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="Paste or type your lecture transcript here…"
                      rows={6}
                      className="w-full rounded-button border border-border-base bg-bg-base px-4 py-3 text-sm text-text-primary placeholder:text-gray-400 focus:border-accent-base focus:outline-none resize-none"
                    />
                    <button
                      onClick={() => {
                        const items = parseManualTranscript(manualText);
                        setRawTranscriptItems(items);
                        const chunked = chunkTranscript(items);
                        setChunks(chunked);
                        setLangSetupStep('completed');
                      }}
                      disabled={!manualText.trim()}
                      className="w-full rounded-button bg-accent-base hover:bg-accent-hover text-white py-2.5 text-sm font-bold transition-all disabled:opacity-40"
                    >
                      Use This Transcript
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: NOTES & CHAT LIST */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                
                {/* Inline Prompt input bar */}
                <div className="rounded-card border border-border-base bg-surface p-5 space-y-3 shadow-subtle no-print">
                  <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider block">
                    Custom Concept Query
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      placeholder="e.g. print sum of digits, what is row reduction..."
                      className="flex-1 rounded-button border border-border-base bg-bg-base px-4 py-2.5 text-sm text-text-primary placeholder:text-gray-400 focus:border-accent-base focus:bg-surface focus:outline-none transition-all"
                    />
                    {userQuestion && (
                      <button
                        onClick={() => setUserQuestion('')}
                        className="p-2 text-text-secondary hover:text-text-primary"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Leave blank to summarize at the current timestamp. For live or transcript-less lectures, type your question above to query your AI. Shortcut: <code>Alt+E</code>
                  </p>
                </div>

                {/* Notes List */}
                {notes.length === 0 ? (
                  <div className="py-24 text-center space-y-4">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto" />
                    <h3 className="text-base font-semibold text-text-primary m-0">No Study Notes Yet</h3>
                    <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
                      Pause the lecture at any key moment, optionally type a topic prompt, and click <strong>Analyze</strong> to build your structured textbook summary.
                    </p>
                  </div>
                ) : (
                  notes.map((note) => {
                    const isEditing = editingNoteId === note.id;
                    const isChatOpen = activeChatNoteId === note.id;
                    const difficultyClasses = {
                      Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      Intermediate: 'bg-blue-50 text-blue-700 border-blue-100',
                      Advanced: 'bg-amber-50 text-amber-700 border-amber-100',
                    };

                    return (
                      <div 
                        key={note.id}
                        className={`rounded-card border bg-surface p-5.5 shadow-subtle space-y-4 hover:border-gray-300 transition-all relative ${
                          isChatOpen ? 'border-accent-base ring-2 ring-accent-base/5' : 'border-border-base'
                        }`}
                      >
                        {/* Note Card Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            {/* Seekable Timestamp */}
                            <button
                              onClick={() => handleSeek(note.seconds)}
                              className="text-xs font-mono font-bold text-accent-base bg-blue-50/60 hover:bg-blue-100/80 px-2.5 py-1 rounded-sm transition-colors"
                            >
                              {note.timestamp}
                            </button>
                            
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.topic || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, topic: e.target.value }))}
                                className="text-sm font-semibold border border-border-base px-2 py-0.5 rounded-sm bg-bg-base"
                              />
                            ) : (
                              <h4 className="text-sm sm:text-base font-bold text-text-primary m-0 tracking-tight">{note.topic}</h4>
                            )}
                          </div>

                          {/* Difficulty Level Indicator */}
                          <div className="flex items-center gap-1.5 no-print">
                            {isEditing ? (
                              <select
                                value={editForm.difficulty}
                                onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                                className="text-xs border border-border-base rounded-sm bg-bg-base py-0.5"
                              >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                              </select>
                            ) : (
                              <span className={`text-[10px] font-mono font-semibold border rounded-sm px-1.5 py-0.5 ${
                                difficultyClasses[note.difficulty] || 'bg-gray-50 text-gray-700'
                              }`}>
                                {note.difficulty}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Note Content Area */}
                        <div className="space-y-4 text-sm text-text-primary">
                          {/* Key Idea */}
                          <div>
                            <span className="font-mono text-[10px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                              Key Idea
                            </span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.keyIdea || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, keyIdea: e.target.value }))}
                                className="w-full border border-border-base px-2.5 py-1.5 rounded-sm bg-bg-base text-sm"
                              />
                            ) : (
                              <p className="font-bold text-text-primary leading-normal">{note.keyIdea}</p>
                            )}
                          </div>

                          {/* Explanation */}
                          <div>
                            <span className="font-mono text-[10px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                              Explanation
                            </span>
                            {isEditing ? (
                              <textarea
                                value={editForm.explanation || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, explanation: e.target.value }))}
                                className="w-full border border-border-base px-2.5 py-1.5 rounded-sm bg-bg-base text-sm h-20 resize-none"
                              />
                            ) : (
                              <p className="text-text-primary/95 leading-relaxed font-sans">{note.explanation}</p>
                            )}
                          </div>

                          {/* Example */}
                          <div>
                            <span className="font-mono text-[10px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                              Relatable Example
                            </span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.example || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, example: e.target.value }))}
                                className="w-full border border-border-base px-2.5 py-1.5 rounded-sm bg-bg-base text-sm"
                              />
                            ) : (
                              <p className="text-text-secondary/95 italic pl-3.5 border-l-2 border-accent-base/20 leading-relaxed">
                                {note.example}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Tags Pillbox */}
                        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-50 pt-3 no-print">
                          {['#important', '#confusing', '#review'].map(tag => {
                            const isTagged = (note.tags || []).includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => handleToggleTag(note.id, tag)}
                                className={`text-xs px-2.5 py-1 rounded-sm border transition-all ${
                                  isTagged
                                    ? 'bg-blue-50 text-accent-base border-accent-base/30 font-medium'
                                    : 'bg-surface text-text-secondary border-border-base hover:border-text-secondary'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                        {/* Action buttons (Edit/Delete/Chat) */}
                        <div className="flex items-center justify-between border-t border-gray-50 pt-2.5 text-xs no-print">
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={saveEditNote}
                                  className="flex items-center gap-1 text-emerald-600 font-medium hover:text-emerald-700"
                                >
                                  <Save className="h-3.5 w-3.5" />
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingNoteId(null)}
                                  className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditNote(note)}
                                  className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="flex items-center gap-1 text-text-secondary hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>

                          <button
                            onClick={() => setActiveChatNoteId(isChatOpen ? null : note.id)}
                            className={`flex items-center gap-1 font-semibold transition-colors ${
                              isChatOpen 
                                ? 'text-accent-base' 
                                : 'text-text-secondary hover:text-accent-base'
                            }`}
                          >
                            Ask follow-up
                            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isChatOpen ? 'rotate-90' : ''}`} />
                          </button>
                        </div>

                        {/* Nesting Chat Area */}
                        {isChatOpen && (
                          <div className="border-t border-border-base pt-3 mt-3 space-y-3 no-print">
                            {/* Message History */}
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {note.chatHistory.length === 0 && (
                                <p className="text-[10px] text-text-secondary italic text-center py-2">
                                  No messages yet. Ask a specific question about this concept.
                                </p>
                              )}
                              {note.chatHistory.map((chat, cIdx) => (
                                <div
                                  key={cIdx}
                                  className={`rounded-sm p-2.5 max-w-[85%] text-xs leading-relaxed ${
                                    chat.role === 'user'
                                      ? 'bg-blue-50 text-accent-base border border-accent-base/10 ml-auto text-right'
                                      : 'bg-bg-base text-text-primary mr-auto text-left'
                                  }`}
                                >
                                  {chat.content}
                                </div>
                              ))}

                              {/* Streaming Reply representation */}
                              {chatStreamReply && (
                                <div className="rounded-sm p-2.5 max-w-[85%] text-xs leading-relaxed bg-bg-base text-text-primary mr-auto text-left border-l-2 border-accent-base">
                                  {chatStreamReply}
                                </div>
                              )}
                            </div>

                            {/* Chat Form */}
                            <form 
                              onSubmit={(e) => handleSendChatMessage(e, note)}
                              className="flex gap-2"
                            >
                              <input
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Ask a follow-up question..."
                                disabled={isChatLoading}
                                className="flex-1 rounded-button border border-border-base bg-bg-base px-3 py-1.5 text-xs text-text-primary placeholder:text-gray-400 focus:border-accent-base focus:outline-none"
                              />
                              <button
                                type="submit"
                                disabled={isChatLoading || !chatMessage.trim()}
                                className="rounded-button bg-accent-base hover:bg-accent-hover disabled:opacity-50 text-white p-1.5 flex items-center justify-center"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: SESSION INTERACTIVE QUIZ */}
            {activeTab === 'quiz' && (
              <div className="space-y-4 no-print">
                {quizQuestions.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <HelpCircle className="h-10 w-10 text-gray-300 mx-auto" />
                    <h3 className="text-sm font-bold text-text-primary m-0">No quiz generated</h3>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
                      You can compile your saved session notes to generate a custom 5-question multiple choice quiz.
                    </p>
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={quizLoading || notes.length < 1}
                      className="rounded-button bg-accent-base hover:bg-accent-hover text-white px-4 py-2 text-xs font-semibold shadow-subtle disabled:opacity-50"
                    >
                      {quizLoading ? 'Generating Quiz...' : 'Generate 5 MCQ Quiz'}
                    </button>
                    {notes.length < 1 && (
                      <p className="text-[10px] text-rose-500">Requires at least 1 study note to generate.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Render questions list */}
                    {quizQuestions.map((q, qIdx) => {
                      const isCorrect = quizUserAnswers[qIdx] === q.correct;

                      return (
                        <div key={qIdx} className="rounded-card border border-border-base bg-surface p-4 space-y-3">
                          <h4 className="text-xs font-bold text-text-primary leading-relaxed m-0">
                            {qIdx + 1}. {q.question}
                          </h4>
                          
                          {/* Options grid */}
                          <div className="space-y-1.5">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = quizUserAnswers[qIdx] === oIdx;
                              const isThisCorrect = q.correct === oIdx;

                              let optStyle = 'border-border-base bg-surface hover:bg-bg-base text-text-secondary';
                              
                              if (quizSubmitted) {
                                if (isThisCorrect) {
                                  optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-medium';
                                } else if (isSelected) {
                                  optStyle = 'border-rose-500 bg-rose-50 text-rose-800';
                                } else {
                                  optStyle = 'border-border-base bg-surface opacity-60 text-text-secondary';
                                }
                              } else if (isSelected) {
                                optStyle = 'border-accent-base bg-blue-50 text-accent-base font-semibold';
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleSelectQuizOption(qIdx, oIdx)}
                                  disabled={quizSubmitted}
                                  className={`w-full text-left rounded-button border p-2.5 text-xs transition-all flex items-center justify-between ${optStyle}`}
                                >
                                  <span>{opt}</span>
                                  {quizSubmitted && isThisCorrect && (
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation review detail */}
                          {quizSubmitted && (
                            <div className="bg-bg-base border border-border-base rounded-sm p-3 text-[11px] leading-relaxed text-text-secondary">
                              <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                                {isCorrect ? 'Correct! ' : 'Incorrect. '}
                              </strong>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Grading banner */}
                    <div className="border-t border-border-base pt-4 flex items-center justify-between">
                      {quizSubmitted ? (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-text-primary">
                            Your Score: <span className="text-accent-base">{quizScore}%</span>
                          </span>
                          <button
                            onClick={handleGenerateQuiz}
                            className="rounded-button border border-border-base hover:bg-bg-base px-3 py-1.5 text-xs font-semibold text-text-primary"
                          >
                            Retake / New Quiz
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(quizUserAnswers).length < quizQuestions.length}
                          className="rounded-button bg-accent-base hover:bg-accent-hover disabled:opacity-50 text-white px-5 py-2.5 text-xs font-semibold shadow-subtle ml-auto"
                        >
                          Submit Answers
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Export toolbar */}
          {notes.length > 0 && activeTab === 'notes' && (
            <div className="border-t border-border-base bg-bg-base p-4 shrink-0 no-print flex items-center justify-between text-xs">
              <span className="font-mono text-text-secondary uppercase tracking-wider text-[10px]">
                Export notebook:
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={handleExportPDF}
                  className="rounded-button bg-surface border border-border-base hover:border-text-secondary px-2.5 py-1.5 font-medium text-text-primary flex items-center gap-1 transition-colors"
                >
                  <FileDown className="h-3 w-3" />
                  PDF
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="rounded-button bg-surface border border-border-base hover:border-text-secondary px-2.5 py-1.5 font-medium text-text-primary flex items-center gap-1 transition-colors"
                >
                  <FileDown className="h-3 w-3" />
                  MD
                </button>
                <button
                  onClick={handleExportJSON}
                  className="rounded-button bg-surface border border-border-base hover:border-text-secondary px-2.5 py-1.5 font-medium text-text-primary flex items-center gap-1 transition-colors"
                >
                  <FileDown className="h-3 w-3" />
                  JSON
                </button>
                <button
                  onClick={handleExportAnki}
                  className="rounded-button bg-surface border border-border-base hover:border-text-secondary px-2.5 py-1.5 font-medium text-text-primary flex items-center gap-1 transition-colors"
                >
                  <FileDown className="h-3 w-3" />
                  Anki
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FIXED BOTTOM STATS BAR */}
      <div className="h-10 bg-surface border-t border-border-base shrink-0 flex items-center justify-between px-6 text-xs text-text-secondary font-mono tracking-wide no-print">
        <div className="flex items-center gap-3">
          <Link to="/notebook" className="font-semibold text-accent-base hover:underline flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            My Notebook
          </Link>
          <span className="text-gray-300">|</span>
          <span>Notes Captured: <strong className="text-text-primary">{stats.notesCount}</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span>Flashcards Due Today: <strong className="text-text-primary">{stats.dueCount}</strong></span>
          <span className="text-gray-300">|</span>
          <span>Avg Quiz Score: <strong className="text-text-primary">{stats.avgQuiz}%</strong></span>
        </div>
      </div>
    </div>
  );
};
