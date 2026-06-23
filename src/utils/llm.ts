import type { Note, ChatItem, QuizQuestion } from '../types';
import { loadSettings } from './storage';
import { PREBAKED_NOTES } from './transcript';

/**
 * Clean up a JSON response that might have markdown wraps (```json ... ```)
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    if (lines[0].toLowerCase().includes('json')) {
      lines.shift();
    } else {
      lines.shift();
    }
    if (lines[lines.length - 1] === '```') {
      lines.pop();
    }
    cleaned = lines.join('\n').trim();
  }
  return cleaned;
}

/**
 * Checks if the local FastAPI server is healthy.
 */
export async function checkBackendHealth(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Resolves the target API endpoint, headers and model based on the selected provider.
 */
function getApiConfig(
  provider: 'openai' | 'groq' | 'gemini' | 'openrouter',
  modelName: string,
  apiKey: string
) {
  let endpoint = '';
  let model = modelName;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === 'openai') {
    endpoint = 'https://api.openai.com/v1/chat/completions';
    if (!model) model = 'gpt-4o-mini';
  } else if (provider === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    if (!model) model = 'llama-3.3-70b-versatile';
  } else if (provider === 'gemini') {
    endpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    if (!model) model = 'gemini-2.5-flash';
  } else if (provider === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    if (!model || model === 'meta-llama/llama-3-8b-instruct:free' || model === 'meta-llama/llama-3-8b-instruct') {
      model = 'meta-llama/llama-3.1-8b-instruct:free';
    }
    headers['HTTP-Referer'] = 'https://github.com/me7Ayushrana/LectureMate_ai-extension';
    headers['X-Title'] = 'LectureMate Web';
  }

  return { endpoint, model, headers };
}

/**
 * Robust fetch helper that retries direct API calls without json_object format parameter if the provider/model rejects it.
 */
async function robustFetchDirectAPI(
  endpoint: string,
  headers: Record<string, string>,
  model: string,
  systemPrompt: string,
  temperature = 0.3
): Promise<any> {
  const attempt = async (useJsonFormat: boolean) => {
    const body: any = {
      model,
      messages: [
        { role: 'system', content: 'You output only valid JSON.' },
        { role: 'user', content: systemPrompt },
      ],
      temperature,
    };
    if (useJsonFormat) {
      body.response_format = { type: 'json_object' };
    }

    return await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  };

  let response = await attempt(true);
  
  // If bad request (400) or other fail, retry without structured output parameter
  if (!response.ok) {
    console.warn(`Direct API json_object format failed (Status ${response.status}). Retrying without response_format...`);
    response = await attempt(false);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Direct API call failed with status ${response.status}`);
  }

  return await response.json();
}



/**
 * Generate a structured note concept analysis.
 */
export async function generateConceptAnalysis(
  videoId: string,
  timestamp: number,
  timestampStr: string,
  contextText: string,
  userQuestion?: string,
  langName?: string
): Promise<Omit<Note, 'id' | 'videoId' | 'tags' | 'chatHistory'>> {
  const settings = loadSettings();
  const promptQuery = userQuestion?.trim() || 'Explain the core concept at this point in the lecture.';
  const question = `${promptQuery} (Respond in the language: ${langName || 'English'})`;

  // 1. Fallback/Mock: If using pre-baked demo note
  if (PREBAKED_NOTES[videoId]) {
    // Find closest timestamp note within 15 seconds
    const timestamps = Object.keys(PREBAKED_NOTES[videoId]).map(Number);
    const closest = timestamps.find(ts => Math.abs(ts - timestamp) <= 15);
    if (closest !== undefined) {
      const mock = PREBAKED_NOTES[videoId][closest];
      return {
        topic: mock.topic,
        timestamp: timestampStr,
        seconds: timestamp,
        keyIdea: mock.keyIdea,
        explanation: mock.explanation,
        example: mock.example,
        difficulty: mock.difficulty,
      };
    }
  }

  // If no mock note is found and keys are missing, throw helpful error
  if (settings.apiType === 'direct' && !settings.apiKey) {
    throw new Error('API Key missing. Enter your OpenAI or Groq API key in Settings, or use a demo video.');
  }

  // 2. Mode: Local FastAPI Backend
  if (settings.apiType === 'local') {
    try {
      const response = await fetch(`${settings.localBackendUrl}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          timestamp: timestamp,
          context: contextText,
          user_question: question,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to explain concept using local server.');
      }

      const data = await response.json();
      // backend returns { explanation: "{...}" } containing JSON string
      const parsedNote = JSON.parse(cleanJsonResponse(data.explanation));
      return {
        topic: parsedNote.topic || 'Concept Analysis',
        timestamp: timestampStr,
        seconds: timestamp,
        keyIdea: parsedNote.keyIdea || '',
        explanation: parsedNote.explanation || '',
        example: parsedNote.example || '',
        difficulty: parsedNote.difficulty || 'Intermediate',
      };
    } catch (e: any) {
      console.error('Local backend explanation error:', e);
      throw new Error(`Local backend error: ${e.message || 'Ensure your server is running at ' + settings.localBackendUrl}`);
    }
  }

  // 3. Mode: Direct API Call from browser
  const { endpoint, model, headers } = getApiConfig(
    settings.directProvider,
    settings.modelName,
    settings.apiKey
  );

  const systemPrompt = `You are an expert academic tutor. Analyze the provided lecture transcript context and generate a structured study note as JSON.

Lecture transcript context:
"${contextText}"

Question/Prompt:
"${question}"

Respond with ONLY valid JSON inside the body, adhering to this schema:
{
  "topic": "Concept name",
  "keyIdea": "One sentence core takeaway",
  "explanation": "Clear explanation (60-80 words)",
  "example": "A relatable real-world example",
  "difficulty": "Beginner"
}

The entire JSON response content (topic, keyIdea, explanation, example) MUST be written in the following language: ${langName || 'English'}.
The difficulty field MUST be exactly one of: "Beginner", "Intermediate", "Advanced". Do not include any markdown wrap or extra text outside the JSON.`;

  try {
    const resJson = await robustFetchDirectAPI(endpoint, headers, model, systemPrompt, 0.3);
    const content = resJson.choices?.[0]?.message?.content || '';
    const parsedNote = JSON.parse(cleanJsonResponse(content));
    
    return {
      topic: parsedNote.topic || 'Concept Analysis',
      timestamp: timestampStr,
      seconds: timestamp,
      keyIdea: parsedNote.keyIdea || '',
      explanation: parsedNote.explanation || '',
      example: parsedNote.example || '',
      difficulty: parsedNote.difficulty || 'Intermediate',
    };
  } catch (e: any) {
    console.error('Direct API note generation error:', e);
    throw new Error(e.message || 'Failed to communicate with LLM provider.');
  }
}

/**
 * SSE Streaming follow-up chat.
 */
export async function streamFollowUpChat(
  note: Note,
  userMessage: string,
  chatHistory: ChatItem[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  langName?: string
): Promise<void> {
  const settings = loadSettings();

  // 1. Mock Fallback
  if (!settings.apiKey && settings.apiType === 'direct') {
    // Generate a simple mock reply based on the topic
    const mockReplies: Record<string, string> = {
      'Row vs Column Picture': 'The column picture shows the columns as vectors that can be combined. By scaling and adding them, you can reach any point in the vector space, whereas the row picture is about intersecting lines which gets complicated as you add variables.',
      'Supervised Learning': 'Supervised learning requires labeled outputs. Without labels, it is unsupervised. In this case, predicting continuous values is called regression, and categories is classification.',
      'Circle Area Integration': 'Integration works because when we slice the circle into infinite thin rings, each one behaves like a flat rectangle. Stacking them turns a curves problem into a simple triangular area calculation.',
    };
    const reply = mockReplies[note.topic] || `This is a study companion mock response for "${note.topic}". To get real-time AI follow-ups, configure your OpenAI/Groq API key in the settings.`;
    
    // Simulate streaming
    const tokens = reply.split(' ');
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < tokens.length) {
        onToken(tokens[idx] + ' ');
        idx++;
      } else {
        clearInterval(interval);
        onDone();
      }
    }, 100);
    return;
  }

  // 2. Mode: Local FastAPI Backend
  if (settings.apiType === 'local') {
    try {
      const response = await fetch(`${settings.localBackendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: note.videoId,
          note: {
            topic: note.topic,
            keyIdea: note.keyIdea,
            explanation: note.explanation,
            example: note.example,
            difficulty: note.difficulty,
          },
          user_message: `${userMessage} (Answer in language: ${langName || 'English'})`,
          chat_history: chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start chat streaming.');
      }

      await readSseStream(response, (data) => {
        if (data.token) {
          onToken(data.token);
        } else if (data.error) {
          onError(data.error);
        }
      }, onDone);
    } catch (e: any) {
      onError(e.message || 'Error communicating with local server.');
    }
    return;
  }

  // 3. Mode: Direct API Call
  const { endpoint, model, headers } = getApiConfig(
    settings.directProvider,
    settings.modelName,
    settings.apiKey
  );

  const systemPrompt = `You are LectureMate, an AI tutor. Answer the student's follow-up question about the lecture note.
Be concise (2-3 sentences), structured, and clear.

Note Context:
- Topic: ${note.topic}
- Key Idea: ${note.keyIdea}
- Explanation: ${note.explanation}
- Example: ${note.example}

You MUST write your entire response in the following language: ${langName || 'English'}.
Do NOT output JSON or markdown wraps, just plain text response.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory,
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Direct chat API failed.');
    }

    await readSseStream(response, (data) => {
      const token = data.choices?.[0]?.delta?.content || '';
      if (token) onToken(token);
    }, onDone);
  } catch (e: any) {
    onError(e.message || 'Error communicating with provider.');
  }
}

/**
 * Shared browser reader for parsing server-sent event (SSE) streams
 */
async function readSseStream(
  response: Response,
  onJSON: (json: any) => void,
  onDone: () => void
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned) continue;
        if (cleaned === 'data: [DONE]') {
          onDone();
          return;
        }

        if (cleaned.startsWith('data: ')) {
          const rawJSON = cleaned.slice(6);
          try {
            const parsed = JSON.parse(rawJSON);
            onJSON(parsed);
          } catch {
            // Ignore incomplete JSON chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  onDone();
}

/**
 * Generate 5 MCQ questions from a set of notes.
 */
export async function generateQuizFromNotes(
  videoId: string,
  notes: Note[],
  langName?: string
): Promise<QuizQuestion[]> {
  const settings = loadSettings();

  if (!notes || notes.length === 0) {
    throw new Error('No notes found. Create a few notes first to generate a quiz.');
  }

  // 1. Fallback Mock: If no API key set
  if (!settings.apiKey && settings.apiType === 'direct') {
    return [
      {
        question: 'Which of the following describes the column picture of linear equations?',
        options: [
          'Finding where line and plane intersections cross at a point',
          'Combining column vectors scale-multiplied by variables to match a target vector',
          'Calculating the dot product of rows with columns',
          'Drawing multiple perpendicular axes on a Cartesian grid'
        ],
        correct: 1,
        explanation: 'The column picture focuses on finding a linear combination of the column vectors of the coefficient matrix.'
      },
      {
        question: 'Arthur Samuel checkers program is historic because it:',
        options: [
          'Defeated the world champion on its first game',
          'Had hardcoded game trees programmed by Samuel',
          'Learned strategies by playing against itself autonomously',
          'Was the first program written in assembly language'
        ],
        correct: 2,
        explanation: 'Arthur Samuel checkers program learned by playing against itself thousands of times, establishing early machine learning.'
      },
      {
        question: 'In supervised learning, if the target variable we predict is a continuous number, we call it a:',
        options: [
          'Classification problem',
          'Clustering problem',
          'Regression problem',
          'Reinforcement problem'
        ],
        correct: 2,
        explanation: 'Regression predicts continuous numerical values, whereas classification predicts discrete category labels.'
      },
      {
        question: 'What is the main benefit of calculating the area of a circle by concentric ring integration?',
        options: [
          'It avoids using the constant pi entirely',
          'It decomposes a curved continuous area into straight-sided rectangles stacked in a triangle',
          'It is faster to calculate by hand than using a calculator',
          'It only works for circles with integer radii'
        ],
        correct: 1,
        explanation: 'It demonstrates the essence of integration: unrolling rings to approximate a triangle whose area is easily computed.'
      },
      {
        question: 'Which machine learning style optimizes an agent decision sequence using rewards and penalties?',
        options: [
          'Supervised learning',
          'Unsupervised learning',
          'Reinforcement learning',
          'Semi-supervised clustering'
        ],
        correct: 2,
        explanation: 'Reinforcement learning trains agents to select actions that maximize cumulative reward signals.'
      }
    ];
  }

  // 2. Mode: Local FastAPI Backend
  if (settings.apiType === 'local') {
    try {
      const response = await fetch(`${settings.localBackendUrl}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          notes: notes.map((n) => ({
            topic: n.topic,
            keyIdea: n.keyIdea,
            explanation: n.explanation,
            example: n.example,
            difficulty: n.difficulty,
          })),
          language: langName || 'English',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz on local server.');
      }

      const data = await response.json();
      return data.questions || [];
    } catch (e: any) {
      throw new Error(e.message || 'Error generating quiz on local server.');
    }
  }

  // 3. Mode: Direct API Call
  const { endpoint, model, headers } = getApiConfig(
    settings.directProvider,
    settings.modelName,
    settings.apiKey
  );

  const notesSummary = notes.slice(0, 8).map(n => `- ${n.topic}: ${n.keyIdea}`).join('\n');
  const systemPrompt = `Generate 5 multiple-choice questions (MCQs) based on the following study notes:
${notesSummary}

Rules:
- Exactly 4 options per question.
- Index of the correct answer is 0-indexed (0, 1, 2, or 3).
- Test comprehension, with realistic distractor choices.
- Include a brief explanation for the correct answer.
- All questions, options, and explanations MUST be written in the following language: ${langName || 'English'}.

Respond ONLY with valid JSON following this schema:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of the answer"
    }
  ]
}

Do not include any markdown wraps or additional text.`;

  try {
    const data = await robustFetchDirectAPI(endpoint, headers, model, systemPrompt, 0.5);
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(cleanJsonResponse(content));
    return parsed.questions || [];
  } catch (e: any) {
    throw new Error(e.message || 'Error communicating with provider.');
  }
}
