import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { SettingsModal } from './components/SettingsModal';
import { LandingPage } from './pages/LandingPage';
import { AppInterface } from './pages/AppInterface';
import { NotebookView } from './pages/NotebookView';
import { ExtensionPage } from './pages/ExtensionPage';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bg-base selection:bg-accent-base/10 selection:text-accent-base">
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<AppInterface />} />
          <Route path="/notebook" element={<NotebookView />} />
          <Route path="/extension" element={<ExtensionPage />} />
        </Routes>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
