/**
 * Code Editor Component
 * Monaco Editor wrapper for HTML/CSS editing
 */

import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  language: 'html' | 'css';
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  value,
  onChange,
  height = '300px',
  readOnly = false,
}) => {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
        <span className="text-sm font-medium text-slate-300 uppercase">
          {language}
        </span>
      </div>
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
        }}
      />
    </div>
  );
};
