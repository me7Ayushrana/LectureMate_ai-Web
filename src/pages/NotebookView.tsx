import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, BookOpen, Trash2, Video, Layers, Calendar, 
  RefreshCw, CheckCircle, ArrowLeft, Space, RotateCw
} from 'lucide-react';
import type { VideoSession, Note, Flashcard, DifficultyLevel } from '../types';
import { loadSessions, loadFlashcards, reviewFlashcard, deleteSession } from '../utils/storage';
import { exportToPDF, exportToMarkdown, exportToJson, exportToAnkiCsv, downloadFile } from '../utils/export';

export const NotebookView: React.FC = () => {
  const navigate = useNavigate();

  // Load state
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | 'all'>('all');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [filterTag, setFilterTag] = useState<string | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'timestamp'>('date');

  // Flashcard Review Mode state
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Reload data from localStorage
  const reloadData = () => {
    const loadedSessions = loadSessions();
    setSessions(loadedSessions);
    
    const loadedCards = loadFlashcards();
    setFlashcards(loadedCards);

    // Calculate due cards
    const now = Date.now();
    const due = loadedCards.filter(card => card.dueDate <= now);
    setDueCards(due);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Keyboard controls for Flashcard Review Mode
  useEffect(() => {
    if (!isReviewMode || dueCards.length === 0 || currentCardIdx >= dueCards.length) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsCardFlipped(prev => !prev);
      } else if (isCardFlipped) {
        // Quality keys 1 to 5
        if (e.key === '1') {
          handleCardRating(1);
        } else if (e.key === '3') {
          handleCardRating(3);
        } else if (e.key === '5') {
          handleCardRating(5);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReviewMode, dueCards, currentCardIdx, isCardFlipped]);

  // Session selection handler
  const handleSelectSession = (id: string | 'all') => {
    setSelectedSessionId(id);
  };

  // Delete Video Session handler
  const handleDeleteSession = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this video notebook? This will permanently delete all its notes and flashcards.')) return;
    deleteSession(videoId);
    if (selectedSessionId === videoId) {
      setSelectedSessionId('all');
    }
    reloadData();
  };

  // Filter Notes helper
  const getFilteredNotes = (): { note: Note; videoTitle: string }[] => {
    let allNotes: { note: Note; videoTitle: string }[] = [];

    sessions.forEach(sess => {
      if (selectedSessionId === 'all' || selectedSessionId === sess.videoId) {
        sess.notes.forEach(note => {
          allNotes.push({ note, videoTitle: sess.videoTitle });
        });
      }
    });

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      allNotes = allNotes.filter(({ note }) => 
        note.topic.toLowerCase().includes(q) ||
        note.keyIdea.toLowerCase().includes(q) ||
        note.explanation.toLowerCase().includes(q) ||
        note.example.toLowerCase().includes(q)
      );
    }

    // Difficulty filter
    if (filterDifficulty !== 'All') {
      allNotes = allNotes.filter(({ note }) => note.difficulty === filterDifficulty);
    }

    // Tag filter
    if (filterTag !== 'All') {
      allNotes = allNotes.filter(({ note }) => (note.tags || []).includes(filterTag));
    }

    // Sorting
    if (sortBy === 'date') {
      // Sorting by note creation ID/timestamp (id is note_timestamp)
      allNotes.sort((a, b) => b.note.id.localeCompare(a.note.id));
    } else if (sortBy === 'timestamp') {
      // Sort chronologically by playback second
      allNotes.sort((a, b) => a.note.seconds - b.note.seconds);
    }

    return allNotes;
  };

  // Start Flashcard review
  const startFlashcardReview = () => {
    const now = Date.now();
    const due = flashcards.filter(c => c.dueDate <= now);
    if (due.length === 0) {
      alert('You have no flashcards due today! Good job.');
      return;
    }
    setDueCards(due);
    setCurrentCardIdx(0);
    setIsCardFlipped(false);
    setIsReviewMode(true);
  };

  // Handle flashcard rating submission
  const handleCardRating = (quality: number) => {
    if (currentCardIdx >= dueCards.length) return;
    const activeCard = dueCards[currentCardIdx];
    
    // Update card SM-2 ratings in local storage
    reviewFlashcard(activeCard.noteId, quality);

    // Animate to next card
    setIsCardFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx(prev => prev + 1);
    }, 150);
  };

  // Export handlers for all active notes
  const activeNotes = getFilteredNotes().map(x => x.note);
  const activeTitle = selectedSessionId === 'all' 
    ? 'All Lectures Master Notebook' 
    : sessions.find(s => s.videoId === selectedSessionId)?.videoTitle || 'Notebook';

  const handleExportPDF = () => exportToPDF(activeTitle, activeNotes);
  const handleExportMarkdown = () => {
    const content = exportToMarkdown(activeTitle, activeNotes);
    downloadFile(content, `notebook_export.md`, 'text/markdown');
  };
  const handleExportJSON = () => {
    const content = exportToJson(activeTitle, activeNotes);
    downloadFile(content, `notebook_export.json`, 'application/json');
  };
  const handleExportAnki = () => {
    const content = exportToAnkiCsv(activeNotes);
    downloadFile(content, `anki_deck.csv`, 'text/csv');
  };

  // Import JSON notes/sessions backup file (including exports from Chrome Extension)
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let sessionsToMerge: VideoSession[] = [];

        // 1. Check if parsed data is an array of sessions
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && parsed[0].videoId && Array.isArray(parsed[0].notes)) {
            sessionsToMerge = parsed;
          }
        } 
        // 2. Check if it's a single video session export (containing videoTitle & notes)
        else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.notes) && parsed.notes.length > 0) {
            const sampleNote = parsed.notes[0];
            const videoId = sampleNote.videoId || 'unknown_video';
            sessionsToMerge = [{
              videoId,
              videoTitle: parsed.videoTitle || 'Imported Notebook',
              videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
              notes: parsed.notes,
              dateAdded: parsed.exportedAt || Date.now()
            }];
          } else if (parsed.videoId && Array.isArray(parsed.notes)) {
            sessionsToMerge = [parsed];
          }
        }

        if (sessionsToMerge.length === 0) {
          throw new Error('Invalid LectureMate JSON file structure.');
        }

        const currentSessions = loadSessions();
        const currentSessionsMap = new Map(currentSessions.map(s => [s.videoId, s]));

        let mergedCount = 0;
        let noteCount = 0;

        sessionsToMerge.forEach(incoming => {
          const existing = currentSessionsMap.get(incoming.videoId);
          if (existing) {
            // Merge notes: filter out duplicate note IDs
            const existingNoteIds = new Set(existing.notes.map(n => n.id));
            const newNotes = incoming.notes.filter(n => !existingNoteIds.has(n.id));
            
            // Map incoming notes to ensure tags exist as array
            const mappedNewNotes = newNotes.map(n => ({
              ...n,
              tags: n.tags || []
            }));

            existing.notes = [...existing.notes, ...mappedNewNotes].sort((a, b) => a.seconds - b.seconds);
            noteCount += mappedNewNotes.length;
          } else {
            incoming.notes = (incoming.notes || []).map(n => ({
              ...n,
              tags: n.tags || []
            }));
            currentSessionsMap.set(incoming.videoId, incoming);
            noteCount += incoming.notes.length;
          }
          mergedCount++;
        });

        const updatedSessions = Array.from(currentSessionsMap.values());
        localStorage.setItem('lm_sessions', JSON.stringify(updatedSessions));
        
        // Sync flashcards for imported notes
        const currentFlashcards = loadFlashcards();
        const existingFlashcardNoteIds = new Set(currentFlashcards.map(f => f.noteId));
        
        const newFlashcards: Flashcard[] = [];
        sessionsToMerge.forEach(sess => {
          sess.notes.forEach(note => {
            if (!existingFlashcardNoteIds.has(note.id)) {
              newFlashcards.push({
                noteId: note.id,
                videoId: sess.videoId,
                videoTitle: sess.videoTitle,
                topic: note.topic,
                front: `${note.topic}\n\nKey Idea: ${note.keyIdea}`,
                back: `${note.explanation}\n\nExample: ${note.example}`,
                interval: 1,
                repetition: 0,
                efactor: 2.5,
                dueDate: Date.now()
              });
            }
          });
        });

        if (newFlashcards.length > 0) {
          localStorage.setItem('lm_flashcards', JSON.stringify([...currentFlashcards, ...newFlashcards]));
        }

        alert(`Successfully imported ${mergedCount} notebook(s) containing ${noteCount} notes.`);
        reloadData();
      } catch (err: any) {
        alert(`Failed to import JSON file: ${err.message || 'Check the file format.'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };


  // Extract unique tags for dropdown filter
  const allUniqueTags = Array.from(
    new Set(
      sessions.flatMap(s => s.notes.flatMap(n => n.tags || []))
    )
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-bg-base">
      
      {/* SIDEBAR: Video Notebooks list (30% width) */}
      <aside className="w-full lg:w-80 border-r border-border-base bg-surface flex flex-col shrink-0 no-print">
        <div className="p-6 border-b border-border-base shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary m-0 flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent-base" />
              Notebooks
            </h2>
            <p className="text-[11px] text-text-secondary mt-1">
              Manage your synchronized logs
            </p>
          </div>
          <input
            type="file"
            id="json-import-input"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById('json-import-input')?.click()}
            className="rounded-button bg-blue-50 text-accent-base border border-accent-base/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-blue-100/80 transition-colors"
            title="Import notes from JSON or Extension"
          >
            Import
          </button>
        </div>

        {/* Video lists */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {/* Master View item */}
          <button
            onClick={() => handleSelectSession('all')}
            className={`w-full text-left rounded-card p-3 text-xs transition-all flex items-center justify-between border ${
              selectedSessionId === 'all'
                ? 'bg-blue-50/50 border-accent-base text-accent-base font-semibold'
                : 'border-transparent text-text-primary hover:bg-bg-base'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent-base" />
              <span>All Lectures</span>
            </div>
            <span className="bg-gray-100 text-text-secondary px-1.5 py-0.5 rounded-sm text-[10px]">
              {sessions.reduce((acc, s) => acc + s.notes.length, 0)}
            </span>
          </button>

          {sessions.length === 0 ? (
            <div className="text-center py-10 text-[11px] text-text-secondary italic">
              No videos logged yet.
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.videoId}
                onClick={() => handleSelectSession(sess.videoId)}
                className={`group w-full rounded-card p-3 text-xs transition-all flex items-start justify-between border cursor-pointer ${
                  selectedSessionId === sess.videoId
                    ? 'bg-blue-50/50 border-accent-base text-accent-base font-semibold'
                    : 'border-transparent text-text-primary hover:bg-bg-base'
                }`}
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-1.5 text-text-primary group-hover:text-accent-base font-semibold line-clamp-2">
                    {sess.videoTitle}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      {sess.notes.length} notes
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(sess.dateAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteSession(sess.videoId, e)}
                  className="rounded-sm p-1.5 text-text-secondary hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Delete Notebook"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER: Notes log & Filters (70% width) */}
      <main className="flex-1 flex flex-col overflow-hidden p-6 space-y-6">
        
        {/* UPPER BANNER: Spaced Repetition card status */}
        <div className="rounded-card border border-border-base bg-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle shrink-0 no-print">
          <div className="text-left space-y-1">
            <h3 className="text-sm font-bold text-text-primary m-0 flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-accent-base" />
              Spaced Repetition Queue
            </h3>
            <p className="text-xs text-text-secondary leading-normal">
              {dueCards.length > 0 
                ? `You have ${dueCards.length} flashcard reviews due today. Strengthen your long-term memory.`
                : 'All caught up! You have 0 card reviews due today. Check back tomorrow.'
              }
            </p>
          </div>
          {dueCards.length > 0 && (
            <button
              onClick={startFlashcardReview}
              className="rounded-button bg-accent-base hover:bg-accent-hover text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-subtle shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Review Now ({dueCards.length} due)
            </button>
          )}
        </div>

        {/* MIDDLE: Filter Bar */}
        <div className="rounded-card border border-border-base bg-surface p-5 space-y-4 shrink-0 no-print flex flex-col shadow-subtle">
          {/* Main search input */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, topics, ideas, examples..."
                className="w-full rounded-button border border-border-base bg-bg-base pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-gray-400 focus:border-accent-base focus:bg-surface focus:outline-none transition-all"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm font-semibold text-accent-base hover:text-accent-hover px-2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tag filters + Sorts row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Difficulty filter dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">Difficulty:</span>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value as any)}
                  className="rounded-button border border-border-base bg-bg-base px-3 py-1.5 text-xs font-semibold text-text-primary"
                >
                  <option value="All">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              {/* Tags filter dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">Tags:</span>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="rounded-button border border-border-base bg-bg-base px-3 py-1.5 text-xs font-semibold text-text-primary"
                >
                  <option value="All">All Tags</option>
                  {allUniqueTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort order selection */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-button border border-border-base bg-bg-base px-3 py-1.5 text-xs font-semibold text-text-primary"
                >
                  <option value="date">Date Logged</option>
                  {selectedSessionId !== 'all' && (
                    <option value="timestamp">Lecture Timeline</option>
                  )}
                </select>
              </div>
              {/* Exports button */}
              {activeNotes.length > 0 && (
                <div className="flex items-center gap-1 bg-bg-base border border-border-base rounded-sm p-0.5">
                  <button
                    onClick={handleExportPDF}
                    className="px-2 py-1 text-[10px] font-medium hover:bg-surface rounded-sm"
                    title="Export as PDF"
                  >
                    PDF
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="px-2 py-1 text-[10px] font-medium hover:bg-surface rounded-sm"
                    title="Export as Markdown"
                  >
                    MD
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="px-2 py-1 text-[10px] font-medium hover:bg-surface rounded-sm"
                    title="Export as JSON"
                  >
                    JSON
                  </button>
                  <button
                    onClick={handleExportAnki}
                    className="px-2 py-1 text-[10px] font-medium hover:bg-surface rounded-sm"
                    title="Export as Anki CSV"
                  >
                    Anki
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LOWER: Notes Grid List */}
        <div className="flex-1 overflow-y-auto pr-1">
          {getFilteredNotes().length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <Layers className="h-10 w-10 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-text-primary m-0">No matching notes</h3>
              <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
                Try adjusting your search query, difficulty selector, or active notebooks.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {getFilteredNotes().map(({ note, videoTitle }) => {
                const difficultyColors = {
                  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                  Intermediate: 'bg-blue-50 text-blue-700 border-blue-100',
                  Advanced: 'bg-amber-50 text-amber-700 border-amber-100',
                };
                return (
                  <div 
                    key={note.id}
                    className="rounded-card border border-border-base bg-surface p-4 shadow-subtle space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5 text-xs text-text-primary">
                      {/* Topic title + timestamp */}
                      <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/app?v=${note.videoId}&t=${note.seconds}`)}
                            className="text-[10px] font-mono font-medium text-accent-base bg-blue-50 px-2 py-0.5 rounded-sm"
                            title="Jump to Video Timestamp"
                          >
                            {note.timestamp}
                          </button>
                          <h4 className="text-xs font-bold text-text-primary m-0 line-clamp-1">{note.topic}</h4>
                        </div>
                        <span className={`text-[9px] font-mono border rounded-sm px-1.5 py-0.5 ${
                          difficultyColors[note.difficulty] || 'bg-gray-50 text-gray-700'
                        }`}>
                          {note.difficulty}
                        </span>
                      </div>

                      {/* Video source label (if viewing all) */}
                      {selectedSessionId === 'all' && (
                        <p className="text-[10px] text-text-secondary font-medium truncate flex items-center gap-1">
                          <Video className="h-3 w-3 shrink-0" />
                          {videoTitle}
                        </p>
                      )}

                      {/* Key idea */}
                      <p className="font-semibold text-text-primary leading-snug">{note.keyIdea}</p>
                      
                      {/* Explanation */}
                      <p className="text-text-secondary leading-relaxed line-clamp-3">{note.explanation}</p>
                    </div>

                    {/* Footer tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 border-t border-gray-50 pt-2.5">
                        {note.tags.map(t => (
                          <span key={t} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-sm">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FULLSCREEN KEYBOARD-NAVIGATED FLASHCARD REVIEW OVERLAY */}
      {isReviewMode && dueCards.length > 0 && (
        <div className="fixed inset-0 z-100 bg-surface flex flex-col no-print">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-base px-6 py-4 shrink-0">
            <button
              onClick={() => {
                setIsReviewMode(false);
                reloadData();
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit Review Mode
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-text-secondary">
                Card {Math.min(currentCardIdx + 1, dueCards.length)} of {dueCards.length}
              </span>
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-base transition-all"
                  style={{ width: `${((currentCardIdx) / dueCards.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="w-12"></div> {/* spacer */}
          </div>

          {/* Main card box */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg-base">
            {currentCardIdx < dueCards.length ? (
              <div className="w-full max-w-lg space-y-8 flex flex-col items-center">
                
                {/* Source video context label */}
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono font-semibold text-accent-base uppercase tracking-wider">
                    RECALLING FROM LECTURE:
                  </span>
                  <h3 className="text-sm font-bold text-text-primary m-0 max-w-md truncate">
                    {dueCards[currentCardIdx].videoTitle}
                  </h3>
                </div>

                {/* Flippable Card container */}
                <div
                  onClick={() => setIsCardFlipped(prev => !prev)}
                  className={`w-full min-h-[16rem] cursor-pointer rounded-modal border bg-surface p-8 shadow-medium flex flex-col items-center justify-center text-center space-y-4 transition-all duration-300 relative select-none hover:-translate-y-0.5 ${
                    isCardFlipped ? 'border-accent-base ring-1 ring-accent-base/10' : 'border-border-base'
                  }`}
                >
                  {!isCardFlipped ? (
                    <div className="space-y-4">
                      {/* Topic & Question (Front) */}
                      <span className="text-xs font-mono font-medium text-text-secondary bg-bg-base px-2.5 py-1 rounded-sm border border-border-base">
                        {dueCards[currentCardIdx].topic}
                      </span>
                      <h2 className="text-lg font-bold text-text-primary leading-relaxed max-w-sm m-0">
                        What is the key idea of this concept?
                      </h2>
                      <p className="text-[10px] text-text-secondary flex items-center justify-center gap-1 font-mono pt-4">
                        <Space className="h-3 w-3" />
                        Press SPACE to reveal answer
                      </p>
                    </div>
                  ) : (
                    <div className="text-left w-full space-y-4">
                      {/* Answer details (Back) */}
                      <div>
                        <span className="font-mono text-[9px] text-text-secondary uppercase tracking-wider block mb-0.5">
                          Key Idea
                        </span>
                        <p className="text-sm font-semibold text-text-primary m-0">
                          {dueCards[currentCardIdx].back.split('\n\n**Explanation:**\n')[0].replace('**Key Idea:**\n', '')}
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-mono text-[9px] text-text-secondary uppercase tracking-wider block mb-0.5">
                          Explanation
                        </span>
                        <p className="text-xs text-text-secondary leading-relaxed m-0">
                          {dueCards[currentCardIdx].back.split('\n\n**Explanation:**\n')[1]?.split('\n\n**Example:**\n')[0] || ''}
                        </p>
                      </div>

                      {dueCards[currentCardIdx].back.split('\n\n**Example:**\n')[1] && (
                        <div>
                          <span className="font-mono text-[9px] text-text-secondary uppercase tracking-wider block mb-0.5">
                            Example
                          </span>
                          <p className="text-xs text-text-secondary italic border-l-2 border-border-base pl-3 m-0">
                            {dueCards[currentCardIdx].back.split('\n\n**Example:**\n')[1]}
                          </p>
                        </div>
                      )}

                      <p className="text-[9px] text-text-secondary flex items-center justify-center gap-1 font-mono pt-4 text-center">
                        <RotateCw className="h-3 w-3" />
                        Click card to hide answer
                      </p>
                    </div>
                  )}
                </div>

                {/* Recall rating actions (Only visible if flipped) */}
                <div className="w-full flex justify-center gap-3">
                  {isCardFlipped ? (
                    <>
                      <button
                        onClick={() => handleCardRating(1)}
                        className="rounded-button bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-4 py-2.5 text-xs font-semibold transition-all flex flex-col items-center w-24"
                      >
                        <span>Forgot</span>
                        <span className="text-[9px] font-mono opacity-70 mt-0.5">Key [1]</span>
                      </button>
                      <button
                        onClick={() => handleCardRating(3)}
                        className="rounded-button bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-4 py-2.5 text-xs font-semibold transition-all flex flex-col items-center w-24"
                      >
                        <span>Hard</span>
                        <span className="text-[9px] font-mono opacity-70 mt-0.5">Key [3]</span>
                      </button>
                      <button
                        onClick={() => handleCardRating(5)}
                        className="rounded-button bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-4 py-2.5 text-xs font-semibold transition-all flex flex-col items-center w-24"
                      >
                        <span>Easy</span>
                        <span className="text-[9px] font-mono opacity-70 mt-0.5">Key [5]</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsCardFlipped(true)}
                      className="rounded-button bg-accent-base hover:bg-accent-hover text-white px-6 py-2.5 text-xs font-semibold shadow-subtle"
                    >
                      Reveal Answer
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center space-y-4 max-w-sm">
                <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto" />
                <h2 className="text-base font-bold text-text-primary m-0">Review Session Completed!</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  You have successfully completed today\'s spaced repetition queue. These concepts have been scheduled for review based on your performance.
                </p>
                <button
                  onClick={() => {
                    setIsReviewMode(false);
                    reloadData();
                  }}
                  className="rounded-button bg-accent-base hover:bg-accent-hover text-white px-5 py-2.5 text-xs font-semibold shadow-subtle"
                >
                  Return to Notebook
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
