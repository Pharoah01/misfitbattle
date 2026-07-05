/**
 * Editor Preferences — stored in localStorage per user.
 */

export interface EditorPreferences {
  theme: 'vs-dark' | 'vs';
  fontSize: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  lineNumbers: 'on' | 'off';
}

const STORAGE_KEY = 'editor_preferences';

export const DEFAULT_PREFERENCES: EditorPreferences = {
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'on',
  minimap: false,
  lineNumbers: 'on',
};

export function getPreferences(): EditorPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PREFERENCES;
}

export function savePreferences(prefs: EditorPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function resetPreferences(): EditorPreferences {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_PREFERENCES;
}
