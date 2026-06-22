import type { Note } from '../types';

/**
 * PDF Export triggers the native browser print layout on a clean print-only document
 */
export function exportToPDF(videoTitle: string, notes: Note[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export to PDF.');
    return;
  }

  const notesHtml = notes.map(note => `
    <div class="print-card" style="border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 20px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; page-break-inside: avoid; background: #ffffff;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        <span style="font-weight: 600; color: #1a1a2e; font-size: 18px;">${note.topic}</span>
        <span style="color: #6b7280; font-size: 14px; font-family: monospace;">${note.timestamp}</span>
      </div>
      <div style="margin-bottom: 12px; font-size: 15px; color: #1a1a2e;">
        <strong>Key Idea:</strong> ${note.keyIdea}
      </div>
      <div style="margin-bottom: 12px; font-size: 14px; color: #4b5563; line-height: 1.6;">
        <strong>Explanation:</strong> ${note.explanation}
      </div>
      <div style="margin-bottom: 12px; font-size: 14px; color: #4b5563; line-height: 1.6; font-style: italic; border-left: 2px solid #e5e7eb; padding-left: 10px;">
        <strong>Example:</strong> ${note.example}
      </div>
      <div style="font-size: 12px; color: #2563eb; display: flex; gap: 8px; margin-top: 15px;">
        <span style="background: #eff6ff; padding: 3px 8px; border-radius: 4px; font-weight: 500;">Difficulty: ${note.difficulty}</span>
        ${note.tags.map(t => `<span style="background: #f3f4f6; color: #4b5563; padding: 3px 8px; border-radius: 4px;">${t}</span>`).join('')}
      </div>
    </div>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>LectureMate - ${videoTitle}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 40px; 
            color: #1a1a2e; 
            max-width: 800px; 
            margin: 0 auto; 
            background: #fafbfc;
          }
          h1 { font-size: 26px; font-weight: 600; margin-bottom: 8px; color: #1a1a2e; }
          p.meta { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
          @media print {
            body { padding: 0; background: white; }
            .print-card { border: 1px solid #e5e7eb !important; background: transparent !important; }
          }
        </style>
      </head>
      <body>
        <h1>${videoTitle}</h1>
        <p class="meta">Study notes generated with LectureMate on ${new Date().toLocaleDateString()}</p>
        <div>${notesHtml}</div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Generate Markdown content
 */
export function exportToMarkdown(videoTitle: string, notes: Note[]): string {
  let md = `# LectureMate Notes: ${videoTitle}\n\n`;
  md += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
  md += `---\n\n`;

  notes.forEach((note) => {
    md += `## [${note.timestamp}] ${note.topic}\n\n`;
    md += `**Difficulty:** \`${note.difficulty}\` | **Tags:** ${note.tags.length ? note.tags.join(' ') : '_None_'}\n\n`;
    md += `### Key Idea\n${note.keyIdea}\n\n`;
    md += `### Explanation\n${note.explanation}\n\n`;
    md += `### Example\n${note.example}\n\n`;
    md += `---\n\n`;
  });

  return md;
}

/**
 * Generate JSON content
 */
export function exportToJson(videoTitle: string, notes: Note[]): string {
  return JSON.stringify({
    videoTitle,
    exportedAt: Date.now(),
    notes
  }, null, 2);
}

/**
 * Generate Anki-compatible CSV string
 */
export function exportToAnkiCsv(notes: Note[]): string {
  // Anki CSV fields: Front, Back, Tags
  let csv = 'Front,Back,Tags\n';

  notes.forEach((note) => {
    const front = `<h1>${note.topic}</h1><p>What is the key idea of this concept?</p>`.replace(/"/g, '""');
    
    const back = `
      <h3>Key Idea</h3>
      <p>${note.keyIdea}</p>
      <h3>Explanation</h3>
      <p>${note.explanation}</p>
      <h3>Example</h3>
      <p><i>${note.example}</i></p>
    `.trim().replace(/\s+/g, ' ').replace(/"/g, '""');
    
    const tags = note.tags.map(t => t.replace('#', '')).join(' ');

    csv += `"${front}","${back}","${tags}"\n`;
  });

  return csv;
}

/**
 * Utility to download string content as a local file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
