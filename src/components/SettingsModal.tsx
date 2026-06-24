import React, { useState, useEffect, useRef } from 'react';
import { X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import type { Settings, DirectProvider } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';
import { checkBackendHealth } from '../utils/llm';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  
  // Test connection state
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Update states when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(loadSettings());
      setTestState('idle');
      setTestMessage('');
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      onClose();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    onClose();
  };

  const handleTestConnection = async () => {
    setTestState('testing');
    const isHealthy = await checkBackendHealth(settings.localBackendUrl);
    if (isHealthy) {
      setTestState('success');
      setTestMessage('Successfully connected to local backend!');
    } else {
      setTestState('error');
      setTestMessage(`Could not connect. Ensure your backend is running at ${settings.localBackendUrl}`);
    }
  };

  const updateField = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      
      // Auto-set standard models if provider changes
      if (key === 'directProvider') {
        if (value === 'openai') {
          next.modelName = 'gpt-4o-mini';
        } else if (value === 'groq') {
          next.modelName = 'llama-3.3-70b-versatile';
        } else if (value === 'gemini') {
          next.modelName = 'gemini-2.5-flash';
        } else if (value === 'openrouter') {
          next.modelName = 'meta-llama/llama-3.1-8b-instruct:free';
        }
      }
      return next;
    });
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-modal border border-border-base bg-surface p-0 shadow-medium"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-base px-6 py-4">
        <h2 className="text-base font-semibold text-text-primary m-0">Settings</h2>
        <button
          onClick={onClose}
          className="rounded-sm p-1 text-text-secondary hover:bg-bg-base hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSave} className="p-6 space-y-5">
        {/* API Mode Toggle */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-medium text-text-secondary uppercase tracking-wider">
            API Integration Mode
          </label>
          <div className="grid grid-cols-2 gap-1 rounded-sm bg-bg-base p-1 border border-border-base">
            <button
              type="button"
              onClick={() => updateField('apiType', 'direct')}
              className={`rounded-sm py-1.5 text-xs font-medium transition-all ${
                settings.apiType === 'direct'
                  ? 'bg-surface text-accent-base shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Direct API Keys
            </button>
            <button
              type="button"
              onClick={() => updateField('apiType', 'local')}
              className={`rounded-sm py-1.5 text-xs font-medium transition-all ${
                settings.apiType === 'local'
                  ? 'bg-surface text-accent-base shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Local Python Backend
            </button>
          </div>
        </div>

        {/* Dynamic Fields based on mode */}
        {settings.apiType === 'direct' ? (
          <div className="space-y-4">
            {/* Direct Provider */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-text-secondary uppercase tracking-wider">
                API Provider
              </label>
              <select
                value={settings.directProvider}
                onChange={(e) => updateField('directProvider', e.target.value as DirectProvider)}
                className="w-full rounded-button border border-border-base bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent-base focus:outline-none focus:ring-1 focus:ring-accent-base"
              >
                <option value="openai">OpenAI</option>
                <option value="groq">Groq</option>
                <option value="gemini">Google Gemini (Free tier available)</option>
                <option value="openrouter">OpenRouter (Access free Llama/Qwen models)</option>
              </select>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-text-secondary uppercase tracking-wider">
                API Key
              </label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => updateField('apiKey', e.target.value)}
                placeholder={
                  settings.directProvider === 'openai' 
                    ? 'sk-...' 
                    : settings.directProvider === 'groq' 
                    ? 'gsk_...' 
                    : settings.directProvider === 'gemini'
                    ? 'AIzaSy...'
                    : 'sk-or-v1-...'
                }
                className="w-full rounded-button border border-border-base bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-gray-400 focus:border-accent-base focus:outline-none focus:ring-1 focus:ring-accent-base"
              />
              <p className="text-[11px] text-text-secondary">
                Your key is stored locally in your browser and never leaves your device.
              </p>
            </div>

            {/* Model Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-text-secondary uppercase tracking-wider">
                Model Name
              </label>
              <input
                type="text"
                value={settings.modelName}
                onChange={(e) => updateField('modelName', e.target.value)}
                placeholder={
                  settings.directProvider === 'openai' 
                    ? 'gpt-4o-mini' 
                    : settings.directProvider === 'groq' 
                    ? 'llama-3.3-70b-versatile'
                    : settings.directProvider === 'gemini'
                    ? 'gemini-2.5-flash'
                    : 'meta-llama/llama-3.1-8b-instruct:free'
                }
                className="w-full rounded-button border border-border-base bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent-base focus:outline-none focus:ring-1 focus:ring-accent-base"
              />
            </div>

            {/* API Keys Setup Guide */}
            <div className="border border-border-base rounded-card p-3 bg-bg-base text-[10.5px] text-text-secondary leading-relaxed max-h-44 overflow-y-auto space-y-2.5">
              <span className="font-semibold text-text-primary block font-mono text-[9px] uppercase tracking-wider">
                Setup Guides for Free & Paid Keys:
              </span>
              
              <div className="space-y-0.5">
                <span className="font-bold text-text-primary block">1. Google Gemini Key (Free Tier):</span>
                <p className="m-0 text-text-secondary">
                  Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-accent-base hover:underline font-semibold">Google AI Studio</a>. Click <strong>Get API Key</strong> and select <strong>Create API Key</strong>. Copy your key here. The free tier offers 15 requests per minute!
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-text-primary block">2. OpenRouter Key (Free Llama/Qwen Models):</span>
                <p className="m-0 text-text-secondary">
                  Go to <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="text-accent-base hover:underline font-semibold">OpenRouter.ai</a>. Go to <strong>Keys</strong> and click <strong>Create Key</strong>. Copy it. You can query models appended with <code>:free</code> (e.g. Llama 3) with zero balance.
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="font-bold text-text-primary block">3. Groq API Key (Fast Free Beta):</span>
                <p className="m-0 text-text-secondary">
                  Go to the <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-accent-base hover:underline font-semibold">Groq Console</a>. Go to <strong>API Keys</strong> in the sidebar, generate a key, and copy it here.
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="font-bold text-text-primary block">4. OpenAI API Key (Paid Credits):</span>
                <p className="m-0 text-text-secondary">
                  Go to <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className="text-accent-base hover:underline font-semibold">OpenAI API Keys</a> and create a secret key. Requires a funded platform billing balance.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Local Backend URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-text-secondary uppercase tracking-wider">
                Backend Server URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.localBackendUrl}
                  onChange={(e) => updateField('localBackendUrl', e.target.value)}
                  placeholder="http://localhost:8000"
                  className="flex-1 rounded-button border border-border-base bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent-base focus:outline-none focus:ring-1 focus:ring-accent-base"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testState === 'testing'}
                  className="rounded-button border border-border-base px-3 py-2 text-xs font-medium text-text-primary hover:bg-bg-base disabled:opacity-50"
                >
                  {testState === 'testing' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </button>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Connects to the FastAPI backend at <code>localhost:8000</code>. Ensure you have run <code>python main.py</code> in the backend directory.
              </p>
            </div>

            {/* Test Connection Results */}
            {testState !== 'idle' && (
              <div
                className={`flex gap-2 rounded-sm border p-3 text-xs leading-relaxed ${
                  testState === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {testState === 'success' ? (
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span>{testMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-border-base pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-button border border-border-base px-4 py-2 text-xs font-medium text-text-secondary hover:bg-bg-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-button bg-accent-base px-4 py-2 text-xs font-medium text-white transition-all hover:bg-accent-hover active:translate-y-0 hover:-translate-y-0.5 shadow-subtle"
          >
            Save Changes
          </button>
        </div>
      </form>
    </dialog>
  );
};
