/**
 * Code Editor Component
 * Monaco Editor wrapper for HTML/CSS editing with fallback
 */

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  language: 'html' | 'css';
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
  options?: editor.IStandaloneEditorConstructionOptions;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  value,
  onChange,
  height = '300px',
  readOnly = false,
  options = {},
}) => {
  const [monacoFailed, setMonacoFailed] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<number | null>(null);

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const handleEditorMount = () => {
    console.log('Monaco Editor mounted successfully');
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  };

  // Set a timeout to fallback to textarea if Monaco takes too long
  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      console.warn('Monaco Editor taking too long to load, falling back to textarea');
      setMonacoFailed(true);
    }, 10000); // 10 second timeout

    setLoadingTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // Fallback textarea when Monaco fails
  if (monacoFailed) {
    return (
      <div className="w-full h-full bg-[#1e1e1e] text-white relative">
        <div className="absolute top-2 right-2 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/30">
          Fallback Editor
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className="w-full h-full bg-[#1e1e1e] text-white font-mono text-sm p-4 border-none outline-none resize-none"
          style={{ height }}
          placeholder="Enter your HTML and CSS code here..."
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={handleEditorChange}
      onMount={handleEditorMount}
      theme="vs-dark"
      beforeMount={() => {
        // Configure Monaco before mounting
        console.log('Monaco Editor before mount');
      }}
      loading={
        <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-primary mx-auto mb-2"></div>
            <p className="text-sm">Loading editor...</p>
            <p className="text-xs text-text-secondary mt-2">Will fallback to basic editor if this takes too long</p>
          </div>
        </div>
      }
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        readOnly,
        padding: { top: 10, bottom: 10 },
        contextmenu: false, // Disable right-click context menu
        ...options,
      }}
    />
  );
};
