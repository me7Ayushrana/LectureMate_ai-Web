import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Video, ChevronDown, Sparkles, Layers } from 'lucide-react';
import { extractVideoId } from '../utils/transcript';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const videoId = extractVideoId(url);
    if (videoId) {
      navigate(`/app?v=${videoId}`);
    } else {
      setError('Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)');
    }
  };

  const handleDemoClick = (videoId: string) => {
    navigate(`/app?v=${videoId}`);
  };

  const faqItems = [
    {
      q: 'Is it free?',
      a: 'Yes. LectureMate is completely free. We do not run ads or premium tiers. The core application runs entirely in your browser and uses either your own direct LLM API keys (OpenAI / Groq) or a local server you control.',
    },
    {
      q: 'Do I need to install anything?',
      a: 'No. The web version runs directly inside your web browser. You do not need to install Chrome extensions or Python backend scripts to try the application. It comes with full demo capabilities.',
    },
    {
      q: 'Where is my data stored?',
      a: 'All data, settings, notebooks, and study notes are saved locally inside your browser\'s local storage. We do not run any database servers, we do not collect telemetry, and we never see your study notes.',
    },
    {
      q: 'What AI models are supported?',
      a: 'We support OpenAI models (like gpt-4o-mini and gpt-4o) and Groq models (like llama-3.3-70b-versatile). You can also configure any custom OpenAI-compatible server endpoint in settings.',
    },
    {
      q: 'Can I use it on mobile?',
      a: 'Yes, LectureMate is fully responsive. It automatically reflows from a split-screen desktop workstation layout to a single stacked queue on mobile devices.',
    },
  ];

  return (
    <div className="flex-1 bg-bg-base">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border-base bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
            <Sparkles className="h-3.5 w-3.5 text-accent-base" />
            LectureMate AI Web
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] m-0">
            Turn any YouTube lecture into structured notes
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-xl leading-relaxed">
            Paste a video URL. Pause anywhere. Get instant, organized study notes with follow-up chat, flashcards, and spaced repetition.
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="space-y-2 max-w-lg">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a YouTube URL to begin"
                className="flex-1 rounded-button border border-border-base bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-gray-400 focus:border-accent-base focus:outline-none focus:ring-1 focus:ring-accent-base transition-all"
              />
              <button
                type="submit"
                className="rounded-button bg-accent-base px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-hover active:translate-y-0 hover:-translate-y-0.5 shadow-subtle flex items-center justify-center gap-2"
              >
                Start Learning
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
          </form>

          {/* Quick Demo Demos */}
          <div className="pt-2 text-left">
            <span className="text-xs font-mono font-medium text-text-secondary uppercase tracking-wider block mb-2.5">
              Or try a demo lecture (No API Key Required):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDemoClick('7UJt_KqYrFY')}
                className="rounded-button border border-border-base bg-surface hover:border-text-secondary px-3 py-1.5 text-xs font-medium text-text-primary transition-all flex items-center gap-1.5"
              >
                <Video className="h-3.5 w-3.5 text-blue-500" />
                MIT Linear Algebra
              </button>
              <button
                onClick={() => handleDemoClick('jGwO_thI7yI')}
                className="rounded-button border border-border-base bg-surface hover:border-text-secondary px-3 py-1.5 text-xs font-medium text-text-primary transition-all flex items-center gap-1.5"
              >
                <Video className="h-3.5 w-3.5 text-green-600" />
                Stanford ML (Andrew Ng)
              </button>
              <button
                onClick={() => handleDemoClick('WUvTyaaN2dQ')}
                className="rounded-button border border-border-base bg-surface hover:border-text-secondary px-3 py-1.5 text-xs font-medium text-text-primary transition-all flex items-center gap-1.5"
              >
                <Video className="h-3.5 w-3.5 text-red-500" />
                3Blue1Brown Calculus
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Wireframe Mockup */}
        <div className="lg:col-span-5 flex justify-center no-print">
          <div className="w-full max-w-md rounded-card border border-border-base bg-surface p-4 shadow-medium space-y-4 text-left">
            {/* Window control dots */}
            <div className="flex gap-1.5 border-b border-border-base pb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/80"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-green-400/80"></div>
            </div>
            
            {/* Split Screen representation */}
            <div className="grid grid-cols-5 gap-3 h-64">
              {/* Left video mockup */}
              <div className="col-span-3 border border-border-base rounded-card bg-bg-base flex flex-col justify-between p-2 relative overflow-hidden">
                <div className="flex items-center gap-1 bg-surface border border-border-base rounded-sm px-1.5 py-0.5 text-[8px] font-mono w-max">
                  <Video className="h-2 w-2 text-accent-base" />
                  04:20 / 45:00
                </div>
                {/* SVG play/pause representation */}
                <div className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-surface border border-border-base shadow-subtle flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-text-primary border-b-[4px] border-b-transparent translate-x-0.5"></div>
                </div>
                {/* Timeline scrubber bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full relative mt-auto">
                  <div className="w-1/3 h-full bg-accent-base rounded-full"></div>
                  <div className="absolute top-1/2 left-1/3 h-3 w-3 -translate-y-1/2 rounded-full bg-accent-base border-2 border-surface shadow-subtle"></div>
                  {/* Markers */}
                  <div className="absolute top-1/2 left-[20%] -translate-y-1/2 h-2 w-2 rounded-full bg-red-500 border border-surface"></div>
                  <div className="absolute top-1/2 left-[60%] -translate-y-1/2 h-2 w-2 rounded-full bg-yellow-500 border border-surface"></div>
                </div>
              </div>

              {/* Right panel notes list mockup */}
              <div className="col-span-2 border border-border-base rounded-card bg-surface p-2 space-y-2 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-border-base pb-1">
                  <span className="text-[9px] font-bold text-text-primary">Study Notes</span>
                  <span className="text-[8px] font-mono text-accent-base bg-blue-50 px-1 rounded-sm">Analyze</span>
                </div>
                
                {/* Simulated note cards */}
                <div className="rounded-card border border-border-base bg-surface p-1.5 shadow-subtle space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-semibold text-text-primary leading-none">Row vs Column</span>
                    <span className="text-[6px] font-mono text-text-secondary leading-none">04:20</span>
                  </div>
                  <div className="w-full h-1 bg-gray-200 rounded-full"></div>
                  <div className="w-5/6 h-1 bg-gray-200 rounded-full"></div>
                  <div className="flex gap-1 pt-1">
                    <span className="text-[5px] bg-blue-50 text-blue-600 px-1 rounded-sm">Beginner</span>
                    <span className="text-[5px] bg-gray-100 text-gray-500 px-1 rounded-sm">#important</span>
                  </div>
                </div>

                <div className="rounded-card border border-border-base bg-surface p-1.5 shadow-subtle space-y-1 opacity-70">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-semibold text-text-primary leading-none">Matrix Combos</span>
                    <span className="text-[6px] font-mono text-text-secondary leading-none">08:15</span>
                  </div>
                  <div className="w-full h-1 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Bottom status bar mockup */}
            <div className="flex justify-between items-center bg-bg-base border border-border-base rounded-card px-3 py-2 text-[9px] font-mono text-text-secondary">
              <span>Notebook: Linear Algebra</span>
              <span className="text-accent-base font-semibold">2 Cards Due Today</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="border-t border-border-base bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary m-0">How it works</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Three steps to turn lengthy lectures into structured, retention-ready materials.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="rounded-card border border-border-base p-6 space-y-3 bg-bg-base">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent-base text-white">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-text-primary m-0">1. Paste Your Video</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Input any YouTube lecture URL. No signup required. The app instantly connects to public caption resources to index the lecture context.
              </p>
            </div>

            <div className="rounded-card border border-border-base p-6 space-y-3 bg-bg-base">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent-base text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-text-primary m-0">2. Pause & Analyze</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Stop at any concept. AI reads the transcript and generates a structured study note with topic name, key idea, explanation, example, and difficulty in 3 seconds.
              </p>
            </div>

            <div className="rounded-card border border-border-base p-6 space-y-3 bg-bg-base">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent-base text-white">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-text-primary m-0">3. Review & Retain</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Notes automatically populate flashcards in your notebook. The built-in SM-2 spaced repetition queue schedule reviews so you remember forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="border-t border-border-base py-20 bg-bg-base">
        <div className="mx-auto max-w-7xl px-6 text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary m-0">Structured for study</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every tool a professional learner needs, engineered into a clean and minimal interface.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {/* Feature 1 */}
            <div className="rounded-card border border-border-base bg-surface p-6 space-y-2">
              <h4 className="text-sm font-bold text-text-primary m-0">Instant Concept Analysis</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Pause the video and generate a structured note detailing the topic, key idea, explanation, and an example.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="rounded-card border border-border-base bg-surface p-6 space-y-2">
              <h4 className="text-sm font-bold text-text-primary m-0">AI Chat Follow-up</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Ask specific follow-up questions about any generated card. The chatbot maintains context and answers instantly.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="rounded-card border border-border-base bg-surface p-6 space-y-2">
              <h4 className="text-sm font-bold text-text-primary m-0">Spaced Repetition (SM-2)</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Scientific review intervals based on the SuperMemo-2 algorithm, maximizing retention while saving study time.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="rounded-card border border-border-base bg-surface p-6 space-y-2">
              <h4 className="text-sm font-bold text-text-primary m-0">Flashcard Mode</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Flip cards, evaluate recall quality, and navigate your daily review deck entirely via responsive keyboard shortcuts.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="rounded-card border border-border-base bg-surface p-6 space-y-2">
              <h4 className="text-sm font-bold text-text-primary m-0">Quiz Generation</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Compile saved lecture notes into interactive 5-question multiple choice quizzes to test active recall before moving on.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="rounded-card border border-border-base bg-surface p-6 space-y-2">
              <h4 className="text-sm font-bold text-text-primary m-0">Multi-format Export</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Download notes and cards in standard formats: PDF (print layout), Markdown (for Obsidian/Notion), JSON, or Anki-importable CSV.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-t border-border-base bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary m-0">Built for every learner</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Designed for depth, clarity, and zero distractions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="rounded-card border border-border-base p-6 space-y-2 bg-surface">
              <span className="text-xs font-mono font-semibold text-accent-base tracking-wider uppercase">01 / Academic</span>
              <h3 className="text-base font-bold text-text-primary m-0">For Students</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Accelerate exam preparation, review dense university lecture topics, and generate structured notes directly synced with lecture timestamps.
              </p>
            </div>

            <div className="rounded-card border border-border-base p-6 space-y-2 bg-surface">
              <span className="text-xs font-mono font-semibold text-accent-base tracking-wider uppercase">02 / Professional</span>
              <h3 className="text-base font-bold text-text-primary m-0">For Self-Learners</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Structure online coding courses, bootcamps, or technical documentaries. Build a unified personal knowledge base from visual learning channels.
              </p>
            </div>

            <div className="rounded-card border border-border-base p-6 space-y-2 bg-surface">
              <span className="text-xs font-mono font-semibold text-accent-base tracking-wider uppercase">03 / Instructional</span>
              <h3 className="text-base font-bold text-text-primary m-0">For Educators</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Produce high-quality summaries, study guides, and flashcard sets for students directly from video resources.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-border-base bg-bg-base py-20 no-print">
        <div className="mx-auto max-w-3xl px-6 space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary m-0">Frequently Asked Questions</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Common questions about security, access, and operations.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <details
                key={idx}
                className="group rounded-card border border-border-base bg-surface p-4 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-sm font-semibold text-text-primary">
                  <span>{item.q}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:-rotate-185 text-text-secondary" />
                </summary>
                <p className="mt-3 text-xs text-text-secondary leading-relaxed border-t border-border-base pt-3 m-0">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-base bg-surface py-8 text-xs text-text-secondary no-print">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-4">
            <a href="https://github.com/me7Ayushrana/LectureMate_ai-extension" target="_blank" rel="noopener noreferrer" className="hover:text-accent-base">
              GitHub
            </a>
            <span className="text-gray-300">|</span>
            <span className="cursor-not-allowed hover:text-text-secondary">Documentation</span>
            <span className="text-gray-300">|</span>
            <span className="cursor-not-allowed hover:text-text-secondary">Privacy</span>
            <span className="text-gray-300">|</span>
            <span className="cursor-not-allowed hover:text-text-secondary">Terms</span>
          </div>
          <div>
            © {new Date().getFullYear()} LectureMate. Made by Ayush Rana. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
