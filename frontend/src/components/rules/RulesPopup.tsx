/**
 * Rules Popup Component - Challenge Rules Modal
 */

import React from 'react';
import type { DifficultyLevel } from '@/utils/difficulty';

interface RulesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  difficulty: DifficultyLevel;
}

export const RulesPopup: React.FC<RulesPopupProps> = ({ isOpen, onClose, difficulty }) => {
  if (!isOpen) return null;

  const getDifficultyRules = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'easy':
        return {
          title: 'Easy Challenge Rules',
          points: '10 points',
          description: 'Basic shapes and layouts',
          tips: [
            'Focus on simple geometric shapes',
            'Use basic CSS properties like width, height, background',
            'Position elements using margin, padding, or flexbox',
            'Keep your code clean and minimal'
          ]
        };
      case 'medium':
        return {
          title: 'Medium Challenge Rules',
          points: '20 points',
          description: 'Requires creative CSS techniques',
          tips: [
            'May require pseudo-elements (::before, ::after)',
            'Use advanced positioning techniques',
            'Consider CSS transforms and gradients',
            'Think creatively about combining shapes'
          ]
        };
      case 'hard':
        return {
          title: 'Hard Challenge Rules',
          points: '30 points',
          description: 'Complex shapes and advanced positioning',
          tips: [
            'Requires advanced CSS techniques',
            'May need complex positioning and transforms',
            'Consider using clip-path or advanced selectors',
            'Optimize for pixel-perfect accuracy'
          ]
        };
    }
  };

  const rules = getDifficultyRules(difficulty);
  
  const getDifficultyClasses = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'easy':
        return {
          badge: 'bg-green-500/10 text-green-500 border-green-500/30',
          dot: 'bg-green-500',
          points: 'text-green-500'
        };
      case 'medium':
        return {
          badge: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
          dot: 'bg-orange-500',
          points: 'text-orange-500'
        };
      case 'hard':
        return {
          badge: 'bg-red-500/10 text-red-500 border-red-500/30',
          dot: 'bg-red-500',
          points: 'text-red-500'
        };
    }
  };

  const difficultyClasses = getDifficultyClasses(difficulty);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface rounded-lg border border-purple-primary/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-primary/20">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold font-rajdhani border ${difficultyClasses.badge}`}>
              {difficulty.toUpperCase()}
            </span>
            <h2 className="text-xl font-bold text-text-primary font-orbitron">
              {rules.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-purple-primary/10 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Challenge Info */}
          <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-primary font-semibold font-rajdhani">Points:</span>
              <span className={`font-bold font-rajdhani ${difficultyClasses.points}`}>{rules.points}</span>
            </div>
            <p className="text-text-secondary font-rajdhani">{rules.description}</p>
          </div>

          {/* General Rules */}
          <div>
            <h3 className="text-lg font-bold text-text-primary mb-3 font-orbitron">General Rules</h3>
            <ul className="space-y-2 text-text-secondary font-rajdhani">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                Use only HTML and internal CSS
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                Only one submission allowed per challenge
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                Auto-save available for work-in-progress
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                No external frameworks or libraries
              </li>
            </ul>
          </div>

          {/* Difficulty-specific Tips */}
          <div>
            <h3 className="text-lg font-bold text-text-primary mb-3 font-orbitron">Tips for This Difficulty</h3>
            <ul className="space-y-2 text-text-secondary font-rajdhani">
              {rules.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${difficultyClasses.dot}`}></span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prohibited */}
          <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/20">
            <h3 className="text-lg font-bold text-red-400 mb-3 font-orbitron">Prohibited</h3>
            <ul className="space-y-2 text-text-secondary font-rajdhani">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                JavaScript
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                External CSS files or frameworks
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                AI code generators
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Copying from other sources
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary text-white font-bold rounded-lg transition-all font-rajdhani shadow-lg shadow-purple-primary/30"
            >
              Got it, Let's Code!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};