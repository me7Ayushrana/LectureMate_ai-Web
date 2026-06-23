import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon, BookOpen, GraduationCap, Video } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-base bg-surface px-6 py-4 no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent-base text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="font-semibold text-text-primary text-lg tracking-tight">LectureMate</span>
            <span className="text-[10px] text-text-secondary font-mono tracking-wider uppercase mt-0.5">Study AI</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-accent-base ${
              isActive('/') ? 'text-accent-base' : 'text-text-secondary'
            }`}
          >
            Home
          </Link>
          <Link
            to="/app"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-accent-base ${
              isActive('/app') ? 'text-accent-base font-semibold' : 'text-text-secondary'
            }`}
          >
            <Video className="h-4 w-4" />
            App Mode
          </Link>
          <Link
            to="/notebook"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-accent-base ${
              isActive('/notebook') ? 'text-accent-base font-semibold' : 'text-text-secondary'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            My Notebook
          </Link>
          <Link
            to="/extension"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-accent-base ${
              isActive('/extension') ? 'text-accent-base font-semibold' : 'text-text-secondary'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Chrome Extension
          </Link>
        </nav>

        {/* Settings CTA */}
        <div>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 rounded-button border border-border-base bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition-all hover:bg-bg-base hover:border-text-secondary"
            title="Configure API Keys & Server"
          >
            <SettingsIcon className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
      </div>
    </header>
  );
};
