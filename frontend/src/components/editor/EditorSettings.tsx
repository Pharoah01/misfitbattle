/**
 * Editor Settings Modal
 */

import React, { useState } from 'react';
import { getPreferences, savePreferences, resetPreferences, type EditorPreferences } from '@/config/editorPreferences';

interface Props {
  onClose: () => void;
  onChange: (prefs: EditorPreferences) => void;
}

export const EditorSettings: React.FC<Props> = ({ onClose, onChange }) => {
  const [prefs, setPrefs] = useState<EditorPreferences>(getPreferences());

  const update = (partial: Partial<EditorPreferences>) => {
    const newPrefs = { ...prefs, ...partial };
    setPrefs(newPrefs);
    savePreferences(newPrefs);
    onChange(newPrefs);
  };

  const handleReset = () => {
    const defaults = resetPreferences();
    setPrefs(defaults);
    onChange(defaults);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-bg/80" onClick={onClose}>
      <div className="bg-dark-surface border border-purple-primary/20 rounded-lg p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-text-primary font-orbitron">Editor Settings</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Theme */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary font-rajdhani">Theme</span>
            <select value={prefs.theme} onChange={e => update({ theme: e.target.value as any })} className="px-2 py-1 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-xs font-rajdhani">
              <option value="vs-dark">Dark</option>
              <option value="vs">Light</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary font-rajdhani">Font Size</span>
            <div className="flex items-center gap-2">
              <button onClick={() => update({ fontSize: Math.max(10, prefs.fontSize - 1) })} className="w-6 h-6 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-xs">-</button>
              <span className="text-sm text-text-primary font-mono w-6 text-center">{prefs.fontSize}</span>
              <button onClick={() => update({ fontSize: Math.min(24, prefs.fontSize + 1) })} className="w-6 h-6 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-xs">+</button>
            </div>
          </div>

          {/* Tab Size */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary font-rajdhani">Tab Size</span>
            <select value={prefs.tabSize} onChange={e => update({ tabSize: parseInt(e.target.value) })} className="px-2 py-1 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-xs font-rajdhani">
              <option value="2">2</option>
              <option value="4">4</option>
            </select>
          </div>

          {/* Insert Spaces */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary font-rajdhani">Use Spaces</span>
            <Toggle checked={prefs.insertSpaces} onChange={v => update({ insertSpaces: v })} />
          </div>

          {/* Word Wrap */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary font-rajdhani">Word Wrap</span>
            <Toggle checked={prefs.wordWrap === 'on'} onChange={v => update({ wordWrap: v ? 'on' : 'off' })} />
          </div>

          {/* Line Numbers */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary font-rajdhani">Line Numbers</span>
            <Toggle checked={prefs.lineNumbers === 'on'} onChange={v => update({ lineNumbers: v ? 'on' : 'off' })} />
          </div>

          {/* Minimap */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary font-rajdhani">Minimap</span>
            <Toggle checked={prefs.minimap} onChange={v => update({ minimap: v })} />
          </div>
        </div>

        <button onClick={handleReset} className="w-full mt-5 px-4 py-2 bg-dark-bg border border-purple-primary/20 text-text-secondary rounded text-sm font-rajdhani hover:text-text-primary hover:border-purple-primary/40 transition-all">
          Reset to Default
        </button>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-purple-primary' : 'bg-dark-bg border border-purple-primary/30'}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-4' : 'left-0.5'}`} />
  </button>
);
