/**
 * Challenge Page - Production Grade
 * Full viewport coding interface optimized for competitions
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useChallenge, useSubmitSolution, useSubmissions } from '@/hooks';
import { CodeEditor, RulesPopup, SubmissionSuccess } from '@/components';
import { EditorSettings } from '@/components/editor/EditorSettings';
import { getPreferences, type EditorPreferences } from '@/config/editorPreferences';
import { VALIDATION } from '@/config/constants';
import { toast } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import DOMPurify from 'dompurify';

export const ChallengePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { registerAutoSubmit } = useAuth();

  const { data: challenge, isLoading, error } = useChallenge(slug || '');
  const submitMutation = useSubmitSolution();
  
  const { data: existingSubmissions } = useSubmissions(challenge?.id);

  const [code, setCode] = useState('');
  const [scaleToFit, setScaleToFit] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewBg, setPreviewBg] = useState<'white' | 'black' | 'checker'>('white');
  const [showRulesPopup, setShowRulesPopup] = useState(false);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const [isViewingSolution, setIsViewingSolution] = useState(false);
  const [showEditorSettings, setShowEditorSettings] = useState(false);
  const [editorPrefs, setEditorPrefs] = useState<EditorPreferences>(getPreferences());
  const [showShortcuts, setShowShortcuts] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const autoSaveKey = useMemo(() => `user_session_${slug}`, [slug]);
  
  const submissionCount = useMemo(() => {
    if (!existingSubmissions || !Array.isArray(existingSubmissions)) return 0;
    
    const manualSubmissions = existingSubmissions.filter(
      (sub: any) => sub.is_auto_save === false
    );
    
    return manualSubmissions.length;
  }, [existingSubmissions]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('Right-click is disabled during the challenge');
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      
      const isPrintScreen = e.key === 'PrintScreen';
      const isWindowsSnip = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S');
      const isWindowsSnipTool = e.metaKey && e.shiftKey && (e.key === 's' || e.key === 'S');
      const isMacScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key);
      const isLinuxScreenshot = e.ctrlKey && e.key === 'PrintScreen';
      
      if (isPrintScreen || isWindowsSnip || isWindowsSnipTool || isMacScreenshot || isLinuxScreenshot) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Screenshots are disabled during the challenge');
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyDown); // Also prevent on keyup

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyDown);
    };
  }, []);

  const canvasSize = useMemo(() => {
    if (!previewContainerRef.current) {
      return { width: 300, height: 169 }; // Default 16:9 ratio, smaller
    }

    const container = previewContainerRef.current;
    const containerWidth = container.clientWidth - 32; // Account for padding
    const containerHeight = container.clientHeight - 32;
    
    const availableWidth = Math.max(200, containerWidth);
    const availableHeight = Math.max(150, containerHeight);
    
    if (scaleToFit) {
      const aspectRatio = 16 / 9;
      let width = availableWidth;
      let height = width / aspectRatio;
      
      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }
      
      return {
        width: Math.floor(Math.min(width, availableWidth)),
        height: Math.floor(Math.min(height, availableHeight))
      };
    } else {
      const maxWidth = Math.min(350, availableWidth);
      
      return {
        width: maxWidth,
        height: Math.floor(maxWidth * 9 / 16)
      };
    }
  }, [scaleToFit, previewContainerRef.current?.clientWidth, previewContainerRef.current?.clientHeight]);

  useEffect(() => {
    if (challenge) {
      const state = location.state as any;
      if (state?.viewSolution && state?.submissionData) {
        setIsViewingSolution(true);
        const { html_code, css_code } = state.submissionData;
        const submittedCode = `${html_code}\n<style>\n${css_code}\n</style>`;
        setCode(submittedCode);
        
        if (!sessionStorage.getItem(`solution_toast_${slug}`)) {
          toast.success('Viewing your submitted solution');
          sessionStorage.setItem(`solution_toast_${slug}`, 'true');
        }
        
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }

      if (!isViewingSolution) {
        const rulesShownKey = `rules_shown_${slug}`;
        const rulesShown = sessionStorage.getItem(rulesShownKey);
        if (!rulesShown) {
          setShowRulesPopup(true);
          sessionStorage.setItem(rulesShownKey, 'true');
        }
      }

      const saved = localStorage.getItem(autoSaveKey);
      if (saved && !isViewingSolution) {
        try {
          const { code: savedCode } = JSON.parse(saved);
          setCode(savedCode);
          return;
        } catch (e) {
        }
      }
      
      if (!isViewingSolution) {
        const html = challenge.html_boilerplate || '';
        const css = challenge.css_boilerplate || '';
        // If CSS already contains <style> tags, use as-is. Otherwise wrap.
        const hasStyleTag = css.trim().toLowerCase().startsWith('<style');
        const boilerplate = hasStyleTag 
          ? `${html}\n${css}`
          : `${html}\n<style>\n${css}\n</style>`;
        setCode(boilerplate);
      }
    }

    return () => {
      if (slug) {
        sessionStorage.removeItem(`solution_toast_${slug}`);
      }
    };
  }, [challenge, autoSaveKey, slug, location.state, location.pathname, navigate, isViewingSolution]);

  useEffect(() => {
    if (!code || isViewingSolution) return; // Don't auto-save when viewing solution

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(autoSaveKey, JSON.stringify({
          code,
          timestamp: Date.now(),
        }));
      } catch (e) {
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [code, autoSaveKey]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Preview in sandboxed iframe — no sanitization needed for display.
      // Backend sanitizes on submission.
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const doc = iframeRef.current.contentWindow.document;
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
              </style>
            </head>
            <body>
              ${code}
            </body>
          </html>
        `;
        
        try {
          doc.open();
          doc.write(htmlContent);
          doc.close();
        } catch (error) {
          if (doc.documentElement) {
            doc.documentElement.innerHTML = htmlContent.replace(/<!DOCTYPE html>\s*<html[^>]*>|<\/html>/gi, '');
          }
        }
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
    } catch (error) {
    }
  }, [code, challenge, exceedsLimit, submitMutation]);

  useEffect(() => {
    registerAutoSubmit(handleAutoSubmit);
    return () => registerAutoSubmit(null);
  }, [registerAutoSubmit, handleAutoSubmit]);

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

    if (submissionCount >= 1) {
      toast.error('You have already submitted for this challenge');
      return;
    }

    try {
      const styleMatch = code.match(/<style>([\s\S]*?)<\/style>/i);
      const cssCode = styleMatch ? styleMatch[1].trim() : '';
      const htmlCode = code.replace(/<style>[\s\S]*?<\/style>/gi, '').trim();

      await submitMutation.mutateAsync({
        challenge: challenge.id,
        html_code: htmlCode,
        css_code: cssCode,
        is_auto_save: false,
      });

      localStorage.removeItem(autoSaveKey);
      toast.success('Submitted');

      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { submissionSuccess: true, challengeTitle: challenge.title } 
        });
      }, 1500);
      
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Submission failed';
      toast.error(msg);
    }
  }, [code, challenge, exceedsLimit, submitMutation, autoSaveKey, submissionCount, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + Enter → Submit
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
        return;
      }

      // Ctrl/Cmd + S → Save (prevent browser save, trigger auto-save via code change)
      if (mod && e.key === 's') {
        e.preventDefault();
        toast.info('Code auto-saved');
        return;
      }

      // Ctrl/Cmd + R → Refresh preview (re-trigger render)
      if (mod && e.key === 'r') {
        e.preventDefault();
        // Force preview re-render by toggling code
        setCode(prev => prev + ' ');
        setTimeout(() => setCode(prev => prev.trimEnd()), 50);
        return;
      }

      // ? → Show shortcuts help
      if (e.key === '?' && !mod) {
        setShowShortcuts(true);
        return;
      }

      // Esc → Close modals
      if (e.key === 'Escape') {
        setShowRulesPopup(false);
        setShowEditorSettings(false);
        setShowShortcuts(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const handleReset = useCallback(() => {
    if (challenge && window.confirm('Reset to boilerplate? This will discard your current code.')) {
      const html = challenge.html_boilerplate || '';
      const css = challenge.css_boilerplate || '';
      const hasStyleTag = css.trim().toLowerCase().startsWith('<style');
      const boilerplate = hasStyleTag 
        ? `${html}\n${css}`
        : `${html}\n<style>\n${css}\n</style>`;
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
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-purple-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-purple-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary font-orbitron mb-2">Challenge Unavailable</h2>
          <p className="text-text-secondary font-rajdhani mb-6">This challenge hasn't been released yet or doesn't exist.</p>
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
    <div className="w-full h-screen overflow-hidden bg-dark-bg flex flex-col">
      {/* Header Bar - Fixed Height */}
      <header className="bg-dark-surface/80 backdrop-blur-sm border-b border-purple-primary/20 px-4 py-2 flex-shrink-0 h-14 w-full">
        <div className="flex items-center justify-between h-full max-w-full">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-text-secondary hover:text-purple-primary transition-colors flex items-center gap-2 font-rajdhani font-semibold text-sm flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="h-4 w-px bg-purple-primary/30 flex-shrink-0"></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-text-primary font-rajdhani truncate">{challenge.title}</h1>
                {isViewingSolution && (
                  <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/30 font-rajdhani flex-shrink-0">
                    SOLUTION
                  </span>
                )}
              </div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-full flex-shrink-0 flex items-center justify-center">
              <span className="text-orange-500 text-xs font-bold font-rajdhani px-3 py-1">{challenge.points} pts</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <div className={`text-xs font-mono px-2 py-1 rounded flex-shrink-0 ${exceedsLimit ? 'bg-red-500/10 text-red-500' : 'bg-dark-bg text-text-secondary border border-purple-primary/20'}`}>
              {codeLength} / {VALIDATION.MAX_CODE_LENGTH}
            </div>

            {/* Submission count indicator */}
            <div className={`text-xs font-rajdhani font-semibold px-2 py-1 rounded flex-shrink-0 ${
              submissionCount >= 1 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : 'bg-dark-bg text-text-secondary border border-purple-primary/20'
            }`}>
              {submissionCount}/1 submitted
            </div>
            
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 hover:border-purple-primary rounded transition-all text-xs font-semibold font-rajdhani flex-shrink-0"
            >
              Reset
            </button>
            
            <button
              onClick={() => setShowRulesPopup(true)}
              className="px-3 py-1 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 hover:border-purple-primary rounded transition-all text-xs font-semibold font-rajdhani flex-shrink-0"
            >
              Rules
            </button>

            <button
              onClick={() => setShowEditorSettings(true)}
              className="px-3 py-1 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 hover:border-purple-primary rounded transition-all text-xs font-semibold font-rajdhani flex-shrink-0"
              title="Editor Settings"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending || exceedsLimit || !code.trim() || submissionCount >= 1 || isViewingSolution}
              className="px-4 py-1 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded transition-all text-xs shadow-lg shadow-purple-primary/30 font-rajdhani flex-shrink-0"
            >
              {isViewingSolution 
                ? 'Viewing Solution' 
                : submitMutation.isPending 
                ? 'Submitting...' 
                : submissionCount >= 1 
                ? 'Submitted' 
                : 'Submit'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive Grid */}
      <div className="flex-1 overflow-hidden w-full">
        <div className="grid grid-cols-1 xl:grid-cols-2 h-full w-full">
          {/* Left Column: Code Editor */}
          <div className="flex flex-col xl:border-r border-purple-primary/20 overflow-hidden w-full">
            <div className="px-4 py-2 bg-dark-surface/50 border-b border-purple-primary/20 flex-shrink-0 w-full">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-rajdhani">Code Editor</h3>
            </div>
            <div className="flex-1 bg-[#1e1e1e] min-h-0 w-full relative">
              <CodeEditor
                language="html"
                value={code}
                onChange={setCode}
                height="100%"
                options={{ 
                  automaticLayout: true,
                  fontSize: editorPrefs.fontSize,
                  lineHeight: 1.5,
                  minimap: { enabled: editorPrefs.minimap },
                  scrollBeyondLastLine: false,
                  wordWrap: editorPrefs.wordWrap,
                  wordWrapColumn: 80,
                  wrappingIndent: 'indent',
                  folding: true,
                  lineNumbers: editorPrefs.lineNumbers,
                  tabSize: editorPrefs.tabSize,
                  insertSpaces: editorPrefs.insertSpaces,
                  renderWhitespace: 'selection',
                  scrollbar: {
                    horizontal: 'hidden',
                    vertical: 'auto',
                    horizontalScrollbarSize: 0,
                    verticalScrollbarSize: 8
                  },
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false
                }}
              />
            </div>
          </div>

          {/* Right Column: Color Palette + Preview */}
          <div className="flex flex-col overflow-hidden min-h-0 w-full">
            {/* Color Palette - Compact */}
            {challenge.palette && challenge.palette.length > 0 && (
              <div className="px-4 py-3 bg-dark-surface/50 border-b border-purple-primary/20 flex-shrink-0 w-full">
                <div className="flex items-center justify-center gap-2 min-w-0">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-rajdhani flex-shrink-0">Colors:</h4>
                  <div className="flex gap-2 flex-wrap justify-center min-w-0">
                    {challenge.palette.map((color, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-center gap-1 group cursor-pointer px-3 py-1 bg-dark-bg rounded border border-purple-primary/20 hover:border-purple-primary transition-all flex-shrink-0" 
                        onClick={() => {
                          navigator.clipboard.writeText(color);
                          toast.success(`Copied ${color}`);
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded border border-purple-primary/30 flex-shrink-0 group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-text-primary font-mono text-xs group-hover:text-purple-primary transition-colors text-center">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Preview Section - Takes remaining space */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 w-full">
              <div className="px-4 py-2 bg-dark-surface/50 border-b border-purple-primary/20 flex-shrink-0 flex items-center justify-between w-full">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-rajdhani">Your Output</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Zoom Controls */}
                  <button onClick={() => setPreviewZoom(Math.max(25, previewZoom - 25))} className="w-5 h-5 bg-dark-bg border border-purple-primary/20 rounded text-text-secondary text-xs hover:text-text-primary">-</button>
                  <span className="text-xs text-text-secondary font-mono w-8 text-center">{previewZoom}%</span>
                  <button onClick={() => setPreviewZoom(Math.min(400, previewZoom + 25))} className="w-5 h-5 bg-dark-bg border border-purple-primary/20 rounded text-text-secondary text-xs hover:text-text-primary">+</button>
                  <button onClick={() => setPreviewZoom(100)} className="text-xs text-text-secondary hover:text-purple-primary font-rajdhani px-1">1:1</button>
                  {/* Background Toggle */}
                  <div className="flex border border-purple-primary/20 rounded overflow-hidden ml-1">
                    <button onClick={() => setPreviewBg('white')} className={`w-4 h-4 bg-white ${previewBg === 'white' ? 'ring-1 ring-purple-primary' : ''}`} title="White" />
                    <button onClick={() => setPreviewBg('black')} className={`w-4 h-4 bg-black ${previewBg === 'black' ? 'ring-1 ring-purple-primary' : ''}`} title="Black" />
                    <button onClick={() => setPreviewBg('checker')} className={`w-4 h-4 ${previewBg === 'checker' ? 'ring-1 ring-purple-primary' : ''}`} title="Transparent" style={{backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0'}} />
                  </div>
                  {/* Scale to Fit */}
                  <label className="flex items-center gap-1 cursor-pointer ml-1">
                    <input type="checkbox" checked={scaleToFit} onChange={(e) => { setScaleToFit(e.target.checked); if (e.target.checked) setPreviewZoom(100); }} className="w-3 h-3 rounded border-purple-primary/30 bg-dark-bg text-purple-primary focus:ring-purple-primary focus:ring-offset-0" />
                    <span className="text-xs text-text-secondary font-rajdhani">Fit</span>
                  </label>
                </div>
              </div>
              <div ref={previewContainerRef} className={`flex-1 flex items-center justify-center p-4 overflow-auto min-h-0 w-full ${
                previewBg === 'black' ? 'bg-black' : previewBg === 'checker' ? 'bg-dark-bg' : 'bg-dark-bg'
              }`} style={previewBg === 'checker' ? {backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0'} : {}}>
                <iframe
                  ref={iframeRef}
                  sandbox="allow-same-origin allow-scripts"
                  className={`border border-purple-primary/20 rounded shadow-lg flex-shrink-0 ${previewBg === 'white' ? 'bg-white' : previewBg === 'black' ? 'bg-black' : 'bg-white'}`}
                  style={{
                    width: scaleToFit ? `${canvasSize.width}px` : `${canvasSize.width * (previewZoom / 100)}px`,
                    height: scaleToFit ? `${canvasSize.height}px` : `${canvasSize.height * (previewZoom / 100)}px`,
                    display: 'block',
                    maxWidth: scaleToFit ? '100%' : 'none',
                    maxHeight: scaleToFit ? '100%' : 'none',
                    transform: scaleToFit ? undefined : `scale(1)`,
                  }}
                  title="Code Preview"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Popup */}
      {challenge && (
        <RulesPopup
          isOpen={showRulesPopup}
          onClose={() => setShowRulesPopup(false)}
          difficulty={challenge.difficulty}
        />
      )}

      {/* Editor Settings */}
      {showEditorSettings && (
        <EditorSettings onClose={() => setShowEditorSettings(false)} onChange={setEditorPrefs} />
      )}

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-bg/80" onClick={() => setShowShortcuts(false)}>
          <div className="bg-dark-surface border border-purple-primary/20 rounded-lg p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary font-orbitron mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Ctrl + Enter', 'Submit Solution'],
                ['Ctrl + S', 'Save Draft'],
                ['Ctrl + R', 'Refresh Preview'],
                ['?', 'Show Shortcuts'],
                ['Esc', 'Close Modal'],
              ].map(([key, desc]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-text-secondary font-rajdhani">{desc}</span>
                  <kbd className="px-2 py-0.5 bg-dark-bg border border-purple-primary/20 rounded text-xs font-mono text-purple-primary">{key}</kbd>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcuts(false)} className="w-full mt-4 px-4 py-2 bg-dark-bg border border-purple-primary/20 text-text-secondary rounded text-sm font-rajdhani hover:text-text-primary">Close</button>
          </div>
        </div>
      )}

      {/* Submission Success Modal */}
      {challenge && (
        <SubmissionSuccess
          isOpen={showSubmissionSuccess}
          challenge={challenge}
          onClose={() => {
            setShowSubmissionSuccess(false);
            navigate('/dashboard', { 
              state: { 
                submissionSuccess: true, 
                challengeTitle: challenge.title,
                points: challenge.points 
              } 
            });
          }}
          redirectCountdown={5}
        />
      )}
    </div>
  );
};
