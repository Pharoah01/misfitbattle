/**
 * Code Editor Component
 * Monaco Editor wrapper for HTML/CSS editing
 */

import React from 'react';
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
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={handleEditorChange}
      theme="vs-dark"
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
        ...options,
      }}
    />
  );
};
