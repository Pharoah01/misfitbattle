/**
 * Challenge Page
 * Main coding interface with editor and live preview
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChallenge, useSubmitSolution } from '@/hooks';
import { CodeEditor, LivePreview } from '@/components';
import { VALIDATION } from '@/config/constants';

export const ChallengePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const challengeId = parseInt(id || '0', 10);

  const { data: challenge, isLoading, error } = useChallenge(challengeId);
  const submitMutation = useSubmitSolution();

  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');

  // Auto-save key for localStorage
  const autoSaveKey = useMemo(() => `challenge_${challengeId}_autosave`, [challengeId]);

  // Load challenge boilerplate or auto-saved code
  useEffect(() => {
    if (challenge) {
      // Try to load auto-saved code
      const saved = localStorage.getItem(autoSaveKey);
      if (saved) {
        try {
          const { htmlCode: savedHtml, cssCode: savedCss } = JSON.parse(saved);
          setHtmlCode(savedHtml);
          setCssCode(savedCss);
          return;
        } catch (e) {
          console.error('Failed to load auto-saved code:', e);
        }
      }
      
      // Load boilerplate if no auto-save
      setHtmlCode(challenge.html_boilerplate || '');
      setCssCode(challenge.css_boilerplate || '');
    }
  }, [challenge, autoSaveKey]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!htmlCode && !cssCode) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(autoSaveKey, JSON.stringify({
          htmlCode,
          cssCode,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.error('Failed to auto-save:', e);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [htmlCode, cssCode, autoSaveKey]);

  // Calculate code length
  const codeLength = useMemo(() => {
    return htmlCode.length + cssCode.length;
  }, [htmlCode, cssCode]);

  // Check if code exceeds limit
  const exceedsLimit = codeLength > VALIDATION.MAX_CODE_LENGTH;

  /**
   * Handle solution submission
   */
  const handleSubmit = async () => {
    if (exceedsLimit) {
      return;
    }

    if (!htmlCode.trim() && !cssCode.trim()) {
      return;
    }

    await submitMutation.mutateAsync({
      challenge: challengeId,
      html_code: htmlCode,
      css_code: cssCode,
    });

    // Clear auto-save after successful submission
    localStorage.removeItem(autoSaveKey);
  };

  /**
   * Reset to boilerplate
   */
  const handleReset = () => {
    if (challenge && window.confirm('Reset to boilerplate? This will discard your current code.')) {
      setHtmlCode(challenge.html_boilerplate || '');
      setCssCode(challenge.css_boilerplate || '');
      localStorage.removeItem(autoSaveKey);
    }
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading challenge...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-primary mb-4">Challenge not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{challenge.title}</h1>
              <p className="text-sm text-text-secondary">{challenge.points} points</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Code Length Counter */}
            <div className={`text-sm ${exceedsLimit ? 'text-primary' : 'text-text-secondary'}`}>
              {codeLength} / {VALIDATION.MAX_CODE_LENGTH} chars
            </div>
            
            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-dark-bg hover:bg-dark-border text-text-primary border border-dark-border rounded transition-colors"
            >
              Reset
            </button>
            
            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending || exceedsLimit || (!htmlCode.trim() && !cssCode.trim())}
              className="px-6 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded transition-colors"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Challenge Info */}
        <div className="w-80 bg-dark-surface border-r border-dark-border overflow-y-auto p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Challenge</h2>
          
          {/* Preview Image */}
          {challenge.preview_image && (
            <div className="mb-4 rounded overflow-hidden bg-dark-bg border border-dark-border">
              <img
                src={challenge.preview_image}
                alt={challenge.title}
                className="w-full"
              />
            </div>
          )}
          
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Description</h3>
            <p className="text-text-primary text-sm whitespace-pre-wrap">{challenge.description}</p>
          </div>
          
          {/* Color Palette */}
          {challenge.palette && challenge.palette.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-2">Color Palette</h3>
              <div className="space-y-2">
                {challenge.palette.map((color, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded border border-dark-border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-text-primary font-mono text-sm">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Middle Panel - Code Editors */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <CodeEditor
              language="html"
              value={htmlCode}
              onChange={setHtmlCode}
              height="calc(50vh - 100px)"
            />
            <CodeEditor
              language="css"
              value={cssCode}
              onChange={setCssCode}
              height="calc(50vh - 100px)"
            />
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-96 bg-dark-surface border-l border-dark-border flex flex-col">
          <div className="px-4 py-3 border-b border-dark-border">
            <h3 className="text-sm font-medium text-text-primary">Live Preview</h3>
          </div>
          <div className="flex-1 p-4">
            <LivePreview htmlCode={htmlCode} cssCode={cssCode} />
          </div>
        </div>
      </div>
    </div>
  );
};
