export interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

export interface Chunk {
  text: string;
  start: number;
  end: number;
}

// Pre-baked transcripts for demo lectures
export const PREBAKED_TRANSCRIPTS: Record<string, { title: string; items: TranscriptItem[] }> = {
  '7UJt_KqYrFY': {
    title: 'MIT 18.06 Linear Algebra - Lecture 1: Geometry of Linear Equations (Strang)',
    items: [
      { text: "Okay, this is the first lecture in MIT's linear algebra course, 18.06.", start: 0.0, duration: 4.5 },
      { text: "The first topic is systems of linear equations. How to solve them, and what does it mean.", start: 4.5, duration: 5.5 },
      { text: "Let's write down a simple system. Two equations, two unknowns: 2x - y = 0 and -x + 2y = 3.", start: 10.0, duration: 8.0 },
      { text: "We want to see the geometry. There are two pictures to see: the row picture and the column picture.", start: 18.0, duration: 7.0 },
      { text: "In the row picture, we plot each equation. The first equation 2x - y = 0 is a straight line through the origin.", start: 25.0, duration: 9.0 },
      { text: "The second equation -x + 2y = 3 is another line. They intersect at the point (1, 2). That is the solution.", start: 34.0, duration: 9.0 },
      { text: "But the column picture is much more important for this course.", start: 43.0, duration: 5.0 },
      { text: "Let's rewrite the system as a linear combination of columns: x times the column vector [2, -1] plus y times [-1, 2] equals the result vector [0, 3].", start: 48.0, duration: 12.0 },
      { text: "We are combining the column vectors. We want to find the right multipliers x and y to produce the target vector.", start: 60.0, duration: 8.0 },
      { text: "Let's plot this. Vector [2, -1] goes right 2, down 1. Vector [-1, 2] goes left 1, up 2.", start: 68.0, duration: 8.0 },
      { text: "If we take 1 of the first vector and 2 of the second vector, we get exactly the vector [0, 3].", start: 76.0, duration: 8.0 },
      { text: "So x = 1 and y = 2 is the linear combination that works. This column picture is the key to higher dimensions.", start: 84.0, duration: 9.0 },
      { text: "In three dimensions, the row picture has three planes intersecting at a point. Very hard to draw.", start: 93.0, duration: 8.0 },
      { text: "But the column picture is still combining three column vectors in 3D space to get the target vector. Much cleaner.", start: 101.0, duration: 9.0 },
      { text: "Can we always solve Ax = b? Only if the columns of A span the space. If they are in the same plane, they are dependent.", start: 110.0, duration: 10.0 },
      { text: "If they are dependent, we cannot solve for all b. We call such a matrix singular or non-invertible.", start: 120.0, duration: 8.0 },
    ],
  },
  'jGwO_thI7yI': {
    title: 'Stanford CS229: Machine Learning - Lecture 1 (Andrew Ng)',
    items: [
      { text: "Welcome to CS229, the machine learning class. Today we will outline the syllabus and understand what machine learning is.", start: 0.0, duration: 8.5 },
      { text: "What is machine learning? Arthur Samuel described it as the field of study that gives computers the ability to learn without being explicitly programmed.", start: 8.5, duration: 11.5 },
      { text: "Samuel wrote a checkers program. He didn't write strategies; he let the computer play against itself thousands of times and learn.", start: 20.0, duration: 10.0 },
      { text: "Tom Mitchell proposed a more formal definition: A computer program is said to learn from experience E with respect to some class of tasks T and performance measure P.", start: 30.0, duration: 12.0 },
      { text: "If its performance at tasks in T, as measured by P, improves with experience E.", start: 42.0, duration: 6.0 },
      { text: "In CS229, we will cover four main areas of machine learning: supervised learning, unsupervised learning, reinforcement learning, and learning theory.", start: 48.0, duration: 10.0 },
      { text: "Supervised learning is where we give the computer a dataset with correct answers or labels. For example, predicting house prices.", start: 58.0, duration: 9.0 },
      { text: "This is a regression problem because we are predicting a continuous value. If we predict a discrete category, like malignant vs benign tumor, it is classification.", start: 67.0, duration: 10.0 },
      { text: "Unsupervised learning is where we give the computer data without any labels or correct answers. We ask it to find structure.", start: 77.0, duration: 9.0 },
      { text: "For example, Google News clustering similar articles, or social network analysis, or market segmentation.", start: 86.0, duration: 8.0 },
      { text: "Reinforcement learning is where we train an agent to make a sequence of decisions using rewards and punishments. Like training a dog or piloting an autonomous helicopter.", start: 94.0, duration: 11.0 },
      { text: "Learning theory helps us understand the mathematical bounds of why these algorithms actually work and how to debug them.", start: 105.0, duration: 10.0 },
    ],
  },
  'WUvTyaaN2dQ': {
    title: '3Blue1Brown - Essence of Calculus - Chapter 1',
    items: [
      { text: "Calculus is one of the most beautiful creations of the human mind.", start: 0.0, duration: 5.0 },
      { text: "But too often, it is taught as a set of rules to memorize, like the power rule or the quotient rule.", start: 5.0, duration: 7.0 },
      { text: "In this series, we want to look at the geometry and the intuition behind calculus.", start: 12.0, duration: 6.0 },
      { text: "Let's start with a classic problem: finding the area of a circle. We know the area is pi times r squared.", start: 18.0, duration: 8.0 },
      { text: "But why? How can we prove this? Let's slice the circle into concentric rings, like an onion.", start: 26.0, duration: 8.0 },
      { text: "Each ring has a radius r, and a tiny thickness dr. If we unroll each ring, it becomes a rectangle.", start: 34.0, duration: 8.0 },
      { text: "The length of the rectangle is the circumference, 2 * pi * r. The height is dr.", start: 42.0, duration: 7.0 },
      { text: "If we stack these unrolled rectangles next to each other, they form a triangle under a line.", start: 49.0, duration: 8.0 },
      { text: "The base of the triangle is the radius R. The height is the circumference of the outer ring, 2 * pi * R.", start: 57.0, duration: 8.0 },
      { text: "The area of this triangle is 1/2 * base * height, which is 1/2 * R * 2 * pi * R, which simplifies to pi * R squared.", start: 65.0, duration: 10.0 },
      { text: "By breaking a curved, continuous shape into infinitely small, straight parts, we solved a hard problem. That is the core of integration.", start: 75.0, duration: 10.0 },
      { text: "Calculus is about zooming in on things that are changing, and finding that at an infinitely small scale, they look straight and constant.", start: 85.0, duration: 11.0 },
    ],
  },
};

// Prebaked notes to simulate immediate analysis for the three demo videos
export const PREBAKED_NOTES: Record<string, Record<number, any>> = {
  '7UJt_KqYrFY': {
    20: {
      topic: 'Row vs Column Picture',
      keyIdea: 'System of equations can be viewed as intersecting lines (row picture) or combining vectors (column picture).',
      explanation: 'In the row picture, each equation represents a geometric shape (line in 2D, plane in 3D) and the solution is their intersection point. In the column picture, the columns of the coefficient matrix are combined as vectors, scale-multiplied by the variables, to equal the output vector. The column picture is mathematically superior for extending to higher dimensions.',
      example: 'For 2x - y = 0 and -x + 2y = 3, the row picture is two lines crossing at (1, 2). The column picture combines vector [2, -1] scaled by 1 and vector [-1, 2] scaled by 2 to reach vector [0, 3].',
      difficulty: 'Beginner',
    },
    50: {
      topic: 'Column Vector Combinations',
      keyIdea: 'Multiplying a matrix by a vector produces a linear combination of the matrix columns.',
      explanation: 'The column vector multiplication Ax represents combining the columns of A with weights from vector x. If we scale column 1 by x and column 2 by y, we obtain a new vector. Solving Ax = b is the reverse process: finding the weights x and y needed to reach the target vector b.',
      example: 'Taking 1 of vector [2, -1] and 2 of vector [-1, 2] yields the coordinate [0, 3], proving the coefficients are (1, 2).',
      difficulty: 'Intermediate',
    },
    115: {
      topic: 'Matrix Singularities',
      keyIdea: 'A matrix is singular (non-invertible) if its columns lie in the same subspace, rendering some equations unsolvable.',
      explanation: 'When the column vectors of a matrix are dependent (e.g., they lie in the same line or plane), they cannot span the entire coordinate space. This means there are target vectors b that cannot be reached by any linear combination of the columns. In this state, the matrix has no inverse and the system has either zero or infinite solutions.',
      example: 'Two 2D vectors pointing in the exact same direction (e.g. [1, 2] and [2, 4]) can only describe points along that single line, leaving all other coordinates in the plane unreachable.',
      difficulty: 'Advanced',
    },
  },
  'jGwO_thI7yI': {
    15: {
      topic: 'Machine Learning Definition',
      keyIdea: 'Machine learning enables computers to learn from data without explicit programmatic instructions.',
      explanation: 'Traditional programming requires writing exact logical rules for inputs. Machine learning algorithms, however, take input data and historical outcomes, using statistical patterns to learn the rules autonomously. Arthur Samuel demonstrated this in 1959 by training a checkers computer program that played against itself to refine its strategies.',
      example: 'A spam filter learns to recognize spam by analyzing patterns in millions of marked email messages rather than relying on a programmer list of banned words.',
      difficulty: 'Beginner',
    },
    60: {
      topic: 'Supervised Learning',
      keyIdea: 'Supervised learning trains algorithms on labeled training datasets containing correct answers.',
      explanation: 'In supervised learning, the training dataset consists of input features paired with their corresponding correct output labels. The model learns to map inputs to outputs. If the label is a continuous number, it is regression; if it is a category or discrete value, it is classification.',
      example: 'Predicting real estate prices based on house sizes (regression) or diagnosing medical scans as malignant or benign (classification).',
      difficulty: 'Beginner',
    },
  },
  'WUvTyaaN2dQ': {
    30: {
      topic: 'Circle Area Integration',
      keyIdea: 'Continuous curved areas can be computed by accumulating infinite straight segments.',
      explanation: 'To compute the area of a circle, we can decompose it into concentric rings of thickness dr. Unrolling these rings creates rectangles of length 2*pi*r and height dr. Stacking them side-by-side forms a right triangle. Finding the area of the straight-sided triangle yields pi*r^2, illustrating how integration transforms curved problems into simple linear geometry.',
      example: 'Peeling an onion layer by layer and flattening the rings side-by-side to approximate a triangular shape.',
      difficulty: 'Intermediate',
    },
  },
};

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Fetches transcript items for a given video ID.
 * Tries the pre-baked list first, then falls back to public proxies.
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
  // 1. Check prebaked transcripts
  if (PREBAKED_TRANSCRIPTS[videoId]) {
    return PREBAKED_TRANSCRIPTS[videoId].items;
  }

  // 2. Try youtube-transcript.ai plaintext endpoint (CORS-enabled, robust proxy bypass)
  try {
    const res = await fetch(`https://youtube-transcript.ai/transcript/${videoId}.txt`);
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('Transcript unavailable') && !text.startsWith('# Transcript unavailable')) {
        const regex = /\[(\d+):(\d+)(?::(\d+))?\]/g;
        let match;
        const matches: Array<{ match: RegExpExecArray; index: number; length: number }> = [];
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            match,
            index: match.index,
            length: match[0].length
          });
        }
        
        if (matches.length > 0) {
          const items: TranscriptItem[] = [];
          for (let i = 0; i < matches.length; i++) {
            const m = matches[i];
            const nextIndex = i < matches.length - 1 ? matches[i+1].index : text.length;
            const rawText = text.substring(m.index + m.length, nextIndex).trim();
            
            // Parse timestamp format
            const parts = m.match;
            let secs = 0;
            if (parts[3] !== undefined) {
              secs = parseInt(parts[1]) * 3600 + parseInt(parts[2]) * 60 + parseInt(parts[3]);
            } else {
              secs = parseInt(parts[1]) * 60 + parseInt(parts[2]);
            }
            
            items.push({
              text: rawText.replace(/\s+/g, ' '),
              start: secs,
              duration: 0
            });
          }
          
          // Compute duration differences
          for (let i = 0; i < items.length; i++) {
            if (i < items.length - 1) {
              items[i].duration = items[i+1].start - items[i].start;
            } else {
              items[i].duration = 10;
            }
          }
          
          return items;
        }
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch from youtube-transcript.ai:`, e);
  }

  // 3. Fallback to public JSON proxies
  const proxyUrls = [
    `https://youtube-transcript-api.vercel.app/api/transcript?videoId=${videoId}`,
    `https://yt-transcript-proxy.fly.dev/transcript?v=${videoId}`,
  ];

  for (const url of proxyUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data.map(item => ({
          text: item.text || item.snippet || '',
          start: parseFloat(item.start ?? item.offset ?? 0) / (item.offset ? 1000 : 1),
          duration: parseFloat(item.duration ?? 0) / (item.offset ? 1000 : 1)
        }));
      }
      if (data && Array.isArray(data.transcript)) {
        return data.transcript;
      }
    } catch (e) {
      console.warn(`Failed to fetch from transcript proxy: ${url}`, e);
    }
  }

  throw new Error('Could not fetch transcript. Ensure the video has captions enabled or try a demo video.');
}

/**
 * Groups raw transcript items into 40-second chunks (matching FastAPI backend logic)
 */
export function chunkTranscript(items: TranscriptItem[], windowSeconds = 40): Chunk[] {
  if (!items || items.length === 0) return [];
  
  const chunks: Chunk[] = [];
  let currentText = '';
  let chunkStart = items[0].start;

  items.forEach((item, index) => {
    const text = item.text.replace(/\n/g, ' ');
    if (currentText === '') {
      chunkStart = item.start;
    }
    
    currentText += `${text} `;

    const duration = item.duration || 0;
    const end = item.start + duration;

    if ((end - chunkStart) > windowSeconds || index === items.length - 1) {
      chunks.push({
        text: currentText.trim(),
        start: chunkStart,
        end: end
      });
      currentText = '';
    }
  });

  return chunks;
}

/**
 * In-browser keyword RAG: Finds the most relevant transcript chunks for a user query.
 */
export function getLocalRagContext(chunks: Chunk[], query: string, topK = 3): string {
  if (!chunks || chunks.length === 0) return '';

  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2); // Filter out short stop words

  if (queryWords.length === 0) {
    // Return chronological start chunks if query is empty
    return chunks.slice(0, topK).map(c => c.text).join('\n');
  }

  // Score chunks based on keyword matching
  const scoredChunks = chunks.map((chunk, index) => {
    let score = 0;
    const textLower = chunk.text.toLowerCase();
    
    queryWords.forEach(word => {
      // Direct exact match gives high weight
      if (textLower.includes(word)) {
        score += 1;
        // Count frequencies
        const matches = textLower.match(new RegExp(word, 'g'));
        if (matches) {
          score += matches.length * 0.1;
        }
      }
    });

    return { chunk, index, score };
  });

  // Sort by score descending and get top elements
  const topMatches = scoredChunks
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // Fallback: If no keywords matched, take chunks around the start of the search
  if (topMatches.length === 0) {
    return chunks.slice(0, topK).map(c => c.text).join('\n');
  }

  // To build logical context, we want to include adjacent chunks for flow,
  // and then sort chronologically.
  const indicesToInclude = new Set<number>();
  topMatches.forEach(match => {
    const idx = match.index;
    indicesToInclude.add(idx);
    if (idx > 0) indicesToInclude.add(idx - 1);
    if (idx < chunks.length - 1) indicesToInclude.add(idx + 1);
  });

  const sortedIndices = Array.from(indicesToInclude).sort((a, b) => a - b);
  const context = sortedIndices.map(i => chunks[i].text).join('\n');
  
  return context.slice(0, 1200); // cap size
}

/**
 * Parses SRT or WebVTT transcript file contents into TranscriptItems
 */
export function parseSrtOrVtt(text: string): TranscriptItem[] {
  const items: TranscriptItem[] = [];
  
  // Clean carriage returns
  const cleanText = text.replace(/\r/g, '');
  
  // Split by double newline (blocks)
  const blocks = cleanText.split(/\n\n+/);
  
  const timeRegex = /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/;

  blocks.forEach(block => {
    const lines = block.trim().split('\n');
    if (lines.length < 2) return;
    
    // Find timeline index
    let timeLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (timeRegex.test(lines[i])) {
        timeLineIdx = i;
        break;
      }
    }
    
    if (timeLineIdx === -1) return;
    
    const timeMatch = lines[timeLineIdx].match(timeRegex);
    if (!timeMatch) return;
    
    const startSecs = 
      parseInt(timeMatch[1]) * 3600 + 
      parseInt(timeMatch[2]) * 60 + 
      parseInt(timeMatch[3]) + 
      parseInt(timeMatch[4]) / 1000;
      
    const endSecs = 
      parseInt(timeMatch[5]) * 3600 + 
      parseInt(timeMatch[6]) * 60 + 
      parseInt(timeMatch[7]) + 
      parseInt(timeMatch[8]) / 1000;
      
    const duration = endSecs - startSecs;
    
    // Subtitle text is everything after timeline
    const textLines = lines.slice(timeLineIdx + 1);
    const subtitleText = textLines.join(' ').replace(/<[^>]*>/g, ''); // strip HTML tags
    
    if (subtitleText.trim()) {
      items.push({
        text: subtitleText.trim(),
        start: startSecs,
        duration: duration
      });
    }
  });
  
  return items;
}

/**
 * Parses manual transcript text lines into TranscriptItems
 */
export function parseManualTranscript(text: string): TranscriptItem[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items: TranscriptItem[] = [];
  let currentStart = 0;
  
  lines.forEach(line => {
    items.push({
      text: line,
      start: currentStart,
      duration: 5
    });
    currentStart += 5;
  });
  
  return items;
}
