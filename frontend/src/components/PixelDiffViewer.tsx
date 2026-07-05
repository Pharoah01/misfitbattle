/**
 * Pixel Difference Viewer
 * Shows target vs rendered vs diff overlay for a submission.
 */

import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';

interface Props {
  submissionId: number;
  onClose: () => void;
}

interface ComparisonData {
  challenge_title: string;
  challenge_difficulty: string;
  challenge_points: number;
  submitted_by: string;
  submitted_at: string;
  similarity_score: number | null;
  score: number | null;
  code_length: number;
  rendered_image: string | null;
  ground_truth_image: string | null;
  diff_image: string | null;
}

type ViewMode = 'side-by-side' | 'target' | 'rendered' | 'diff';

export const PixelDiffViewer: React.FC<Props> = ({ submissionId, onClose }) => {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [mode, setMode] = useState<ViewMode>('side-by-side');
  const [loading, setLoading] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  useEffect(() => {
    apiClient.get(`/api/submissions/${submissionId}/comparison/`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-dark-bg/95 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-[9999] bg-dark-bg/95 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary font-rajdhani mb-4">Failed to load comparison</p>
          <button onClick={onClose} className="px-4 py-2 bg-purple-primary text-white rounded font-rajdhani">Close</button>
        </div>
      </div>
    );
  }

  const apiBase = import.meta.env.VITE_API_URL || '';

  return (
    <div className="fixed inset-0 z-[9999] bg-dark-bg/98 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-purple-primary/20 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-text-primary font-orbitron">{data.challenge_title}</h2>
          <p className="text-xs text-text-secondary font-rajdhani">
            By {data.submitted_by} • {new Date(data.submitted_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {data.similarity_score !== null && (
            <div className="text-right">
              <p className="text-lg font-bold font-mono text-purple-primary">{(data.similarity_score * 100).toFixed(1)}%</p>
              <p className="text-xs text-text-secondary font-rajdhani">{data.score} pts</p>
            </div>
          )}
          <button onClick={onClose} className="p-2 hover:bg-dark-surface rounded transition-colors text-text-secondary hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-center gap-2 py-3 border-b border-purple-primary/10 flex-shrink-0">
        {(['side-by-side', 'target', 'rendered', 'diff'] as ViewMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded text-xs font-rajdhani font-semibold transition-all ${
              mode === m ? 'bg-purple-primary text-white' : 'bg-dark-surface text-text-secondary hover:text-text-primary border border-purple-primary/20'
            }`}
          >
            {m === 'side-by-side' ? 'Side by Side' : m === 'target' ? 'Target' : m === 'rendered' ? 'Output' : 'Diff Overlay'}
          </button>
        ))}
        {mode === 'diff' && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-text-secondary font-rajdhani">Opacity</span>
            <input type="range" min="0" max="1" step="0.1" value={overlayOpacity} onChange={e => setOverlayOpacity(parseFloat(e.target.value))} className="w-20" />
          </div>
        )}
      </div>

      {/* Image Area */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        {mode === 'side-by-side' && (
          <div className="grid grid-cols-2 gap-4 max-w-4xl w-full">
            <div className="text-center">
              <p className="text-xs text-text-secondary font-rajdhani mb-2">Target</p>
              <div className="bg-white rounded border border-purple-primary/20 overflow-hidden">
                {data.ground_truth_image && <img src={`${apiBase}${data.ground_truth_image}`} alt="Target" className="w-full" />}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-secondary font-rajdhani mb-2">Your Output</p>
              <div className="bg-white rounded border border-purple-primary/20 overflow-hidden">
                {data.rendered_image && <img src={`${apiBase}${data.rendered_image}`} alt="Rendered" className="w-full" />}
              </div>
            </div>
          </div>
        )}

        {mode === 'target' && data.ground_truth_image && (
          <div className="text-center max-w-lg">
            <p className="text-xs text-text-secondary font-rajdhani mb-2">Target Image</p>
            <div className="bg-white rounded border border-purple-primary/20 overflow-hidden">
              <img src={`${apiBase}${data.ground_truth_image}`} alt="Target" className="w-full" />
            </div>
          </div>
        )}

        {mode === 'rendered' && data.rendered_image && (
          <div className="text-center max-w-lg">
            <p className="text-xs text-text-secondary font-rajdhani mb-2">Your Output</p>
            <div className="bg-white rounded border border-purple-primary/20 overflow-hidden">
              <img src={`${apiBase}${data.rendered_image}`} alt="Rendered" className="w-full" />
            </div>
          </div>
        )}

        {mode === 'diff' && (
          <div className="text-center max-w-lg">
            <p className="text-xs text-text-secondary font-rajdhani mb-2">Difference (red = mismatch)</p>
            <div className="bg-black rounded border border-purple-primary/20 overflow-hidden relative">
              {data.rendered_image && <img src={`${apiBase}${data.rendered_image}`} alt="Base" className="w-full" />}
              {data.diff_image && (
                <img
                  src={`${apiBase}${data.diff_image}`}
                  alt="Diff"
                  className="absolute inset-0 w-full h-full"
                  style={{ opacity: overlayOpacity }}
                />
              )}
              {!data.diff_image && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80">
                  <p className="text-text-secondary font-rajdhani text-sm">Diff image not available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
