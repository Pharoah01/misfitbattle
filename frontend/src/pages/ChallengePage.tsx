/**
 * Challenge Page - Production Grade
 * Full viewport coding interface optimized for competitions
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChallenge, useSubmitSolution, useSubmissions } from '@/hooks';
import { CodeEditor, RulesPopup, SubmissionSuccess } from '@/components';
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
  
  // Fetch existing submissions for this challenge to get submission count
  const { data: existingSubmissions } = useSubmissions(challenge?.id);

  const [code, setCode] = useState('');
  const [scaleToFit, setScaleToFit] = useState(true); // Default to true
  const [showRulesPopup, setShowRulesPopup] = useState(false);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const autoSaveKey = useMemo(() => `user_session_${slug}`, [slug]);
  
  // Calculate submission count from existing submissions (exclude auto-saves)
  const submissionCount = useMemo(() => {
    if (!existingSubmissions || !Array.isArray(existingSubmissions)) return 0;
    
    // Filter to only count manual submissions (is_auto_save = false)
    const manualSubmissions = existingSubmissions.filter(
      (sub: any) => sub.is_auto_save === false
    );
    
    return manualSubmissions.length;
  }, [existingSubmissions]);

  // Security: Prevent screenshots, right-click, and drag-drop
  useEffect(() => {
    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('Right-click is disabled during the challenge');
      return false;
    };

    // Prevent drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent all screenshot shortcuts (cross-platform)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Windows: PrtScn, Alt+PrtScn, Win+Shift+S, Shift+Win+S
      // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      // Linux: PrtScn, Shift+PrtScn, Ctrl+PrtScn
      
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

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyDown); // Also prevent on keyup

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyDown);
    };
  }, []);

  // Calculate scaled canvas size - Prevent overflow
  const canvasSize = useMemo(() => {
    if (!previewContainerRef.current) {
      return { width: 300, height: 169 }; // Default 16:9 ratio, smaller
    }

    const container = previewContainerRef.current;
    const containerWidth = container.clientWidth - 32; // Account for padding
    const containerHeight = container.clientHeight - 32;
    
    // Ensure minimum container size
    const availableWidth = Math.max(200, containerWidth);
    const availableHeight = Math.max(150, containerHeight);
    
    if (scaleToFit) {
      // Scale to fit container while maintaining aspect ratio
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
      // Fixed size that fits well in most containers
      const maxWidth = Math.min(350, availableWidth);
      
      return {
        width: maxWidth,
        height: Math.floor(maxWidth * 9 / 16)
      };
    }
  }, [scaleToFit, previewContainerRef.current?.clientWidth, previewContainerRef.current?.clientHeight]);

  // Load challenge boilerplate or auto-saved code
  useEffect(() => {
    if (challenge) {
      // Show rules popup when challenge loads (only once per session)
      const rulesShownKey = `rules_shown_${slug}`;
      const rulesShown = sessionStorage.getItem(rulesShownKey);
      if (!rulesShown) {
        setShowRulesPopup(true);
        sessionStorage.setItem(rulesShownKey, 'true');
      }

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
  }, [challenge, autoSaveKey, slug]);

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
        
        // Use innerHTML instead of doc.write to avoid security issues
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
              ${sanitized}
            </body>
          </html>
        `;
        
        // Clear and set new content safely
        try {
          doc.open();
          doc.write(htmlContent);
          doc.close();
        } catch (error) {
          // Fallback: set innerHTML directly
          console.warn('doc.write failed, using innerHTML fallback:', error);
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

    // Check submission limit (max 1 manual submission)
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
      
      // Show success modal instead of toast
      setShowSubmissionSuccess(true);
      
    } catch (error: any) {
      // Error toast is already handled by the mutation hook
    }
  }, [code, challenge, exceedsLimit, submitMutation, autoSaveKey, submissionCount]);

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
  }, [handleSubmit]);

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
              <h1 className="text-base font-bold text-text-primary font-rajdhani truncate">{challenge.title}</h1>
            </div>
            <div className="px-2 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full flex-shrink-0">
              <span className="text-orange-500 text-xs font-bold font-rajdhani">{challenge.points} pts</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <div className={`text-xs font-mono px-2 py-1 rounded flex-shrink-0 ${exceedsLimit ? 'bg-red-500/10 text-red-500' : 'bg-dark-bg text-text-secondary border border-purple-primary/20'}`}>
              {codeLength} / {VALIDATION.MAX_CODE_LENGTH}
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
              onClick={handleSubmit}
              disabled={submitMutation.isPending || exceedsLimit || !code.trim() || submissionCount >= 1}
              className="px-4 py-1 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded transition-all text-xs shadow-lg shadow-purple-primary/30 font-rajdhani flex-shrink-0"
            >
              {submitMutation.isPending ? 'Submitting...' : submissionCount >= 1 ? 'Already Submitted' : 'Submit'}
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
            <div className="flex-1 overflow-hidden bg-[#1e1e1e] min-h-0 w-full">
              <CodeEditor
                language="html"
                value={code}
                onChange={setCode}
                height="100%"
                options={{ 
                  automaticLayout: true,
                  fontSize: 14,
                  lineHeight: 1.5,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  folding: true,
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  scrollbar: {
                    horizontal: 'auto',
                    vertical: 'auto'
                  }
                }}
              />
            </div>
          </div>

          {/* Right Column: Color Palette + Preview */}
          <div className="flex flex-col overflow-hidden min-h-0 w-full">
            {/* Color Palette - Compact */}
            {challenge.palette && challenge.palette.length > 0 && (
              <div className="px-4 py-3 bg-dark-surface/50 border-b border-purple-primary/20 flex-shrink-0 w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-rajdhani flex-shrink-0">Colors:</h4>
                  <div className="flex gap-1 flex-wrap min-w-0 overflow-hidden">
                    {challenge.palette.map((color, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-1 group cursor-pointer px-2 py-1 bg-dark-bg rounded border border-purple-primary/20 hover:border-purple-primary transition-all flex-shrink-0" 
                        onClick={() => {
                          navigator.clipboard.writeText(color);
                          toast.success(`Copied ${color}`);
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded border border-purple-primary/30 flex-shrink-0 group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-text-primary font-mono text-xs group-hover:text-purple-primary transition-colors">{color}</span>
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
                <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={scaleToFit}
                    onChange={(e) => setScaleToFit(e.target.checked)}
                    className="w-3 h-3 rounded border-purple-primary/30 bg-dark-bg text-purple-primary focus:ring-purple-primary focus:ring-offset-0"
                  />
                  <span className="text-xs text-text-secondary font-rajdhani">Scale to Fit</span>
                </label>
              </div>
              <div ref={previewContainerRef} className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-dark-bg min-h-0 w-full">
                <iframe
                  ref={iframeRef}
                  sandbox="allow-same-origin allow-scripts"
                  className="bg-white border border-purple-primary/20 rounded shadow-lg flex-shrink-0"
                  style={{
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: '100%'
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
