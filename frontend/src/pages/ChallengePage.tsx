/**
 * Challenge Page - Production Grade
 * Full viewport coding interface optimized for competitions
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChallenge, useSubmitSolution } from '@/hooks';
import { CodeEditor } from '@/components';
import { VALIDATION } from '@/config/constants';
import { toast } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import DOMPurify from 'dompurify';

export const ChallengePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { registerAutoSubmit } = useAuth();

  const { data: challenge, isLoading, error } = useChallenge(slug || '');
  const submitMutation = useSubmitSolution();

  const [code, setCode] = useState('');
  const [scaleToFit, setScaleToFit] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const autoSaveKey = useMemo(() => `challenge_${slug}_autosave`, [slug]);

  // Calculate scaled canvas size
  const canvasSize = useMemo(() => {
    if (!scaleToFit || !previewContainerRef.current) {
      return { width: 400, height: 225 }; // 16:9 aspect ratio (400 / 16 * 9 = 225)
    }

    const container = previewContainerRef.current;
    const containerWidth = container.clientWidth - 88; // Subtract padding and frame
    const containerHeight = container.clientHeight - 88;
    
    // Maintain 16:9 aspect ratio
    const aspectRatio = 16 / 9;
    let width = containerWidth;
    let height = width / aspectRatio;
    
    if (height > containerHeight) {
      height = containerHeight;
      width = height * aspectRatio;
    }
    
    return {
      width: Math.floor(width),
      height: Math.floor(height)
    };
  }, [scaleToFit, previewContainerRef.current?.clientWidth, previewContainerRef.current?.clientHeight]);

  // Load challenge boilerplate or auto-saved code
  useEffect(() => {
    if (challenge) {
      const saved = localStorage.getItem(autoSaveKey);
      if (saved) {
        try {
          const { code: savedCode } = JSON.parse(saved);
          setCode(savedCode);
          return;
        } catch (e) {
          console.error('Failed to load auto-saved code:', e);
        }
      }
      
      const boilerplate = `${challenge.html_boilerplate || ''}\n<style>\n${challenge.css_boilerplate || ''}\n</style>`;
      setCode(boilerplate);
    }
  }, [challenge, autoSaveKey]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!code) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(autoSaveKey, JSON.stringify({
          code,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.error('Failed to auto-save:', e);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [code, autoSaveKey]);

  // Sanitize and debounce preview updates (300ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const sanitized = DOMPurify.sanitize(code, {
        ALLOWED_TAGS: ['div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'style', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside'],
        ALLOWED_ATTR: ['class', 'id', 'style', 'href', 'src', 'alt', 'title'],
        FORBID_TAGS: ['script'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      });
      
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const doc = iframeRef.current.contentWindow.document;
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
              </style>
            </head>
            <body>
              ${sanitized}
            </body>
          </html>
        `);
        doc.close();
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [code, canvasSize]);

  const codeLength = useMemo(() => code.length, [code]);
  const exceedsLimit = codeLength > VALIDATION.MAX_CODE_LENGTH;

  // Auto-submit function for session timeout
  const handleAutoSubmit = useCallback(async () => {
    if (!code.trim() || !challenge || exceedsLimit) return;

    try {
      const styleMatch = code.match(/<style>([\s\S]*?)<\/style>/i);
      const cssCode = styleMatch ? styleMatch[1].trim() : '';
      const htmlCode = code.replace(/<style>[\s\S]*?<\/style>/gi, '').trim();

      await submitMutation.mutateAsync({
        challenge: challenge.id,
        html_code: htmlCode,
        css_code: cssCode,
        is_auto_save: true,
      });

      console.log('Code auto-submitted on session timeout');
    } catch (error) {
      console.error('Auto-submit failed:', error);
    }
  }, [code, challenge, exceedsLimit, submitMutation]);

  // Register auto-submit callback with AuthContext
  useEffect(() => {
    registerAutoSubmit(handleAutoSubmit);
    return () => registerAutoSubmit(null);
  }, [registerAutoSubmit, handleAutoSubmit]);

  // Handle CTRL+ENTER shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, challenge]);

  const handleSubmit = useCallback(async () => {
    if (exceedsLimit) {
      toast.error('Code exceeds maximum length');
      return;
    }

    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    if (!challenge) return;

    // Check submission limit (max 2 manual submissions)
    if (submissionCount >= 2) {
      toast.error('Maximum 2 submissions allowed per challenge');
      return;
    }

    try {
      const styleMatch = code.match(/<style>([\s\S]*?)<\/style>/i);
      const cssCode = styleMatch ? styleMatch[1].trim() : '';
      const htmlCode = code.replace(/<style>[\s\S]*?<\/style>/gi, '').trim();

      const response = await submitMutation.mutateAsync({
        challenge: challenge.id,
        html_code: htmlCode,
        css_code: cssCode,
        is_auto_save: false,
      });

      // Update submission count from response
      if (response && 'submission_count' in response) {
        setSubmissionCount((response as any).submission_count);
      }

      localStorage.removeItem(autoSaveKey);
      
      // Show appropriate message based on submission count
      if (submissionCount === 0) {
        toast.success('First submission successful! You have 1 more submission remaining.');
      } else {
        toast.success('Final submission successful! No more submissions allowed.');
      }
    } catch (error: any) {
      // Error toast is already handled by the mutation hook
    }
  }, [code, challenge, exceedsLimit, submitMutation, autoSaveKey, submissionCount]);

  const handleReset = useCallback(() => {
    if (challenge && window.confirm('Reset to boilerplate? This will discard your current code.')) {
      const boilerplate = `${challenge.html_boilerplate || ''}\n<style>\n${challenge.css_boilerplate || ''}\n</style>`;
      setCode(boilerplate);
      localStorage.removeItem(autoSaveKey);
    }
  }, [challenge, autoSaveKey]);

  if (isLoading) {
    return (
      <div style={{ width: '100%', height: '100vh' }} className="bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mx-auto mb-4"></div>
          <p className="text-text-secondary font-rajdhani">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div style={{ width: '100%', height: '100vh' }} className="bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-purple-primary mb-4 font-rajdhani font-semibold">Challenge not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary text-white rounded-lg font-rajdhani font-bold shadow-lg shadow-purple-primary/30"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} className="bg-dark-bg flex flex-col">
      {/* Header Bar */}
      <header className="bg-dark-surface/50 backdrop-blur-sm border-b border-purple-primary/20 px-6 py-3 flex-shrink-0" style={{ height: '60px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-text-secondary hover:text-purple-primary transition-colors flex items-center gap-2 font-rajdhani font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="h-6 w-px bg-purple-primary/30"></div>
            <div>
              <h1 className="text-lg font-bold text-text-primary font-rajdhani">{challenge.title}</h1>
            </div>
            <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full">
              <span className="text-orange-500 text-sm font-bold font-rajdhani">{challenge.points} pts</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`text-sm font-mono px-3 py-1 rounded ${exceedsLimit ? 'bg-red-500/10 text-red-500' : 'bg-dark-bg text-text-secondary border border-purple-primary/20'}`}>
              {codeLength} / {VALIDATION.MAX_CODE_LENGTH}
            </div>
            
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 hover:border-purple-primary rounded transition-all text-sm font-semibold font-rajdhani"
            >
              Reset
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending || exceedsLimit || !code.trim() || submissionCount >= 2}
              className="px-6 py-2 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-sm shadow-lg shadow-purple-primary/30 font-rajdhani"
            >
              {submitMutation.isPending ? 'Submitting...' : submissionCount >= 2 ? 'Max Submissions Reached' : `Submit (${2 - submissionCount} left)`}
            </button>
          </div>
        </div>
      </header>

      {/* Grid Layout - Editor Left, Preview Right */}
      <div 
        style={{ 
          width: '100vw', 
          height: 'calc(100vh - 60px)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          overflow: 'hidden'
        }}
      >
        {/* Column 1: Code Editor */}
        <div className="flex flex-col border-r border-purple-primary/20 overflow-hidden">
          <div className="px-6 py-3 bg-dark-surface/50 border-b border-purple-primary/20 flex-shrink-0">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-rajdhani">Code Editor</h3>
          </div>
          <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
            <CodeEditor
              language="html"
              value={code}
              onChange={setCode}
              height="100%"
              options={{ automaticLayout: true }}
            />
          </div>
        </div>

        {/* Column 2: Preview + Colors + Description */}
        <div className="flex flex-col overflow-hidden">
          {/* Color Palette - Top */}
          {challenge.palette && challenge.palette.length > 0 && (
            <div className="px-6 py-4 bg-dark-surface/50 border-b border-purple-primary/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-rajdhani">Colors:</h4>
                <div className="flex gap-2">
                  {challenge.palette.map((color, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 group cursor-pointer px-3 py-1.5 bg-dark-bg rounded border border-purple-primary/20 hover:border-purple-primary transition-all" 
                      onClick={() => {
                        navigator.clipboard.writeText(color);
                        toast.success(`Copied ${color}`);
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded border border-purple-primary/30 flex-shrink-0 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-text-primary font-mono text-xs group-hover:text-purple-primary transition-colors">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-3 bg-dark-surface/50 border-b border-purple-primary/20 flex-shrink-0 flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-rajdhani">Your Output</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scaleToFit}
                  onChange={(e) => setScaleToFit(e.target.checked)}
                  className="w-4 h-4 rounded border-purple-primary/30 bg-dark-bg text-purple-primary focus:ring-purple-primary focus:ring-offset-0"
                />
                <span className="text-xs text-text-secondary font-rajdhani">Scale to Fit</span>
              </label>
            </div>
            <div ref={previewContainerRef} className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-dark-bg">
              <iframe
                ref={iframeRef}
                sandbox="allow-same-origin"
                className="bg-white border border-purple-primary/20 rounded"
                style={{
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`,
                  display: 'block'
                }}
                title="Code Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
