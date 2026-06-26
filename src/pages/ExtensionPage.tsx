import React from 'react';
import { Download, GraduationCap, Settings } from 'lucide-react';
export const ExtensionPage: React.FC = () => {
  const steps = [
    {
      title: 'Download the Extension',
      desc: 'Click the button below to download the compiled Chrome Extension files as a ZIP archive.',
    },
    {
      title: 'Extract the Archive',
      desc: 'Unzip the downloaded `lecturemate-extension.zip` file into a local folder on your computer (e.g. on your Desktop).',
    },
    {
      title: 'Open Extension Settings',
      desc: 'Open a new tab in Google Chrome and enter `chrome://extensions/` in the URL bar to access extension management.',
    },
    {
      title: 'Enable Developer Mode',
      desc: 'Locate the "Developer mode" toggle in the top-right corner of the Extensions page and toggle it ON.',
    },
    {
      title: 'Load Unpacked Folder',
      desc: 'Click the "Load unpacked" button in the top-left corner and select the folder where you extracted the extension files.',
    },
    {
      title: 'Start Annotating YouTube',
      desc: 'Open any YouTube lecture video, click the LectureMate icon in your browser toolbar, and begin creating study notes instantly!',
    },
  ];

  return (
    <div className="flex-1 bg-bg-base py-16 px-6">
      <div className="mx-auto max-w-3xl space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-accent-base text-white shadow-subtle mb-2">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary m-0">
            LectureMate Chrome Extension
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Bring AI-powered note-taking and active recall reviews directly onto YouTube. Pause lectures, extract transcripts, and generate study cards without switching tabs.
          </p>
        </div>

        {/* Download Action Section */}
        <div className="rounded-card border border-border-base bg-surface p-8 text-center space-y-5 shadow-subtle">
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-text-primary m-0">Get the Extension Package</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Compatible with Google Chrome, Brave, Microsoft Edge, and any Chromium-based browser.
            </p>
          </div>

          <div>
            <a
              href="/lecturemate-extension.zip"
              download="lecturemate-extension.zip"
              className="inline-flex items-center gap-2 rounded-button bg-accent-base hover:bg-accent-hover text-white px-6 py-3 text-sm font-semibold transition-all shadow-subtle hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download className="h-4.5 w-4.5" />
              Download Chrome Extension (.zip)
            </a>
          </div>
        </div>

        {/* Step-by-Step Installation Cards */}
        <div className="space-y-6">
          <h3 className="text-base font-mono font-semibold text-text-secondary uppercase tracking-wider text-center">
            Step-by-step Installation Guide
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="rounded-card border border-border-base bg-surface p-5 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[10px] font-mono font-bold text-accent-base border border-accent-base/10 shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-text-primary m-0">{step.title}</h4>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed m-0">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Settings guide */}
        <div className="rounded-card border border-amber-200 bg-amber-50/50 p-6 space-y-3">
          <h4 className="text-xs font-bold text-amber-800 m-0 flex items-center gap-2">
            <Settings className="h-4 w-4 shrink-0" />
            Configuring the Extension API Settings
          </h4>
          <p className="text-[11px] text-amber-800 leading-relaxed m-0">
            By default, the Chrome Extension connects to the local Python FastAPI backend at <code>http://localhost:8000</code>. You can customize the server URL or test connectivity directly from the extension's popup panel in your browser toolbar.
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed m-0">
            <strong>Data Sync:</strong> To migrate study notes taken in the extension to this master web notebook dashboard, simply click the <strong>Export JSON</strong> option inside the extension popup/history page and load it using the <strong>JSON Import</strong> tool in your master notebook.
          </p>
        </div>

      </div>
    </div>
  );
};
