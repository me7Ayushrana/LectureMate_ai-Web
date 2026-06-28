# 🎓 LectureMate AI — Web App

> **Transform YouTube lectures into structured, reviewable knowledge.**
> An AI-powered study companion that turns any lecture video into smart notes, flashcards, quizzes, and more.

## 🌐 Live Demo

**[https://lecmate.netlify.app/](https://lecmate.netlify.app/)**

---

## ✨ Features

- 📝 **Smart Notes** — AI-generated timestamped notes from any YouTube lecture
- 💬 **Follow-up Chat** — Ask questions about specific moments in the video
- 🃏 **Flashcards** — Auto-generated spaced repetition cards (SM-2 algorithm)
- 🧠 **Quiz Generator** — AI-powered multiple choice quizzes from your notes
- 📚 **My Notebook** — Manage all your lecture sessions in one place
- 📤 **Export Options** — PDF, Markdown, JSON, and Anki CSV formats
- 🔌 **Chrome Extension** — Use LectureMate directly on YouTube
- 🌐 **Multi-language** — Supports Hindi and English response language
- 🤖 **Multiple AI Models** — OpenAI, Google Gemini, Groq, OpenRouter (Llama 3.1 free)

---

## 🚀 Tech Stack

- **Framework**: React 18 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Storage**: localStorage (no backend required)
- **AI**: Direct browser-to-LLM API calls with SSE streaming

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/me7Ayushrana/LectureMate_ai-Web.git
cd LectureMate_ai-Web

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🔑 API Keys Setup

The app supports multiple AI providers — configure them in the Settings panel:

| Provider | Model | Cost |
|----------|-------|------|
| **OpenRouter** | Llama 3.1 8B | Free |
| **Google Gemini** | Gemini 1.5 Flash | Free tier |
| **Groq** | Llama 3 70B | Free tier |
| **OpenAI** | GPT-4o mini | Paid |

---

## 🔌 Chrome Extension

Install the LectureMate Chrome Extension to use AI notes directly on YouTube without leaving the video page.

Download and setup instructions available at: [https://lecmate.netlify.app/extension](https://lecmate.netlify.app/extension)

---

## 👨‍💻 Author

**Ayush Rana** — [GitHub](https://github.com/me7Ayushrana)

---

## 📄 License

MIT License
