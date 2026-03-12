/**
 * Code Editor Component
 * Monaco Editor wrapper for HTML/CSS editing with enhanced reliability
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<number | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    onChange(value || '');
  }, [onChange]);

  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setIsLoading(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Configure editor for better performance
    editor.updateOptions({
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      renderWhitespace: 'selection',
      fontSize: 14,
      lineHeight: 1.5,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      ...options,
    });

    // Add HTML/CSS specific configurations
    if (language === 'html') {
      editor.updateOptions({
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
      });
    }
  }, [language, options]);

  // Set fallback timeout
  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => {
      if (isLoading) {
        setMonacoFailed(true);
        setIsLoading(false);
      }
    }, 8000); // 8 second timeout

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

  // Fallback textarea when Monaco fails
  if (monacoFailed) {
    return (
      <div className="w-full h-full bg-[#1e1e1e] text-white relative">
        <div className="absolute top-2 right-2 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/30 z-10">
          Basic Editor
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className="w-full h-full bg-[#1e1e1e] text-white font-mono text-sm p-4 border-none outline-none resize-none leading-relaxed"
          style={{ height }}
          placeholder="Enter your HTML and CSS code here..."
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        beforeMount={(monaco) => {
          // Configure Monaco environment
          monaco.editor.defineTheme('custom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '6A9955' },
              { token: 'keyword', foreground: '569CD6' },
              { token: 'string', foreground: 'CE9178' },
              { token: 'number', foreground: 'B5CEA8' },
            ],
            colors: {
              'editor.background': '#1e1e1e',
              'editor.foreground': '#d4d4d4',
              'editorLineNumber.foreground': '#858585',
              'editor.selectionBackground': '#264f78',
              'editor.inactiveSelectionBackground': '#3a3d41',
            }
          });
          
          // Set HTML language options
          monaco.languages.html.htmlDefaults.setOptions({
            format: {
              tabSize: 2,
              insertSpaces: true,
              wrapLineLength: 120,
              unformatted: 'default"',
              contentUnformatted: 'pre,code,textarea',
              indentInnerHtml: false,
              preserveNewLines: true,
              maxPreserveNewLines: undefined,
              indentHandlebars: false,
              endWithNewline: false,
              extraLiners: 'head, body, /html',
              wrapAttributes: 'auto'
            },
            suggest: { html5: true }
          });

          // Set CSS language options
          monaco.languages.css.cssDefaults.setOptions({
            validate: true,
            lint: {
              compatibleVendorPrefixes: 'ignore',
              vendorPrefix: 'warning',
              duplicateProperties: 'warning',
              emptyRules: 'warning',
              importStatement: 'ignore',
              boxModel: 'ignore',
              universalSelector: 'ignore',
              zeroUnits: 'ignore',
              fontFaceProperties: 'warning',
              hexColorLength: 'error',
              argumentsInColorFunction: 'error',
              unknownProperties: 'warning',
              ieHack: 'ignore',
              unknownVendorSpecificProperties: 'ignore',
              propertyIgnoredDueToDisplay: 'warning',
              important: 'ignore',
              float: 'ignore',
              idSelector: 'ignore'
            }
          });
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-primary mx-auto mb-2"></div>
              <p className="text-sm">Loading Monaco Editor...</p>
              <p className="text-xs text-text-secondary mt-1">Fallback available if needed</p>
            </div>
          </div>
        }
        options={{
          contextmenu: false,
          readOnly,
          padding: { top: 10, bottom: 10 },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'line',
          selectOnLineNumbers: true,
          roundedSelection: false,
          scrollbar: {
            horizontal: 'auto',
            vertical: 'auto',
            horizontalScrollbarSize: 12,
            verticalScrollbarSize: 12,
          },
          ...options,
        }}
      />
    </div>
  );
};
