/**
 * Rules Page - Competition Rules and Guidelines
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';

export const Rules: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface/50 backdrop-blur-sm border-b border-purple-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 
              className="text-2xl font-bold text-text-primary font-orbitron tracking-wider cursor-pointer group transition-colors duration-300 hover:text-purple-primary"
              onClick={() => navigate('/dashboard')}
            >
              <span className="text-purple-primary">MISFITS</span>-BATTLE
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-text-secondary hidden sm:inline font-rajdhani">
                {user?.name}
              </span>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 hover:border-purple-primary rounded transition-all font-rajdhani font-semibold"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-text-primary mb-2 font-orbitron">
              <span className="bg-gradient-to-r from-purple-primary to-purple-tertiary bg-clip-text text-transparent">
                Rules & Guidelines
              </span>
            </h2>
            <p className="text-text-secondary font-rajdhani text-lg">Competition rules and submission guidelines</p>
          </div>

          {/* Rules Content */}
          <div className="space-y-8">
            {/* Objective */}
            <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4 font-orbitron flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
                Objective
              </h3>
              <p className="text-text-secondary font-rajdhani text-lg leading-relaxed">
                Participants must recreate a given UI design or target image as accurately as possible using only HTML and CSS within the allotted time.
              </p>
            </div>

            {/* Team Structure */}
            <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4 font-orbitron flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
                Team Structure
              </h3>
              <ul className="text-text-secondary font-rajdhani text-lg space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  Individual participation only
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  No team collaboration allowed
                </li>
              </ul>
            </div>

            {/* Allowed Technologies */}
            <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4 font-orbitron flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
                Allowed Technologies
              </h3>
              <p className="text-text-secondary font-rajdhani text-lg mb-4">Participants may use only:</p>
              <ul className="text-text-secondary font-rajdhani text-lg space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  HTML
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  CSS (Internal CSS only)
                </li>
              </ul>
              <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10">
                <p className="text-text-secondary font-rajdhani text-sm mb-2">Example:</p>
                <code className="text-purple-primary font-mono text-sm">
                  &lt;style&gt;<br />
                  &nbsp;&nbsp;/* internal CSS only */<br />
                  &lt;/style&gt;
                </code>
              </div>
              <p className="text-red-400 font-rajdhani text-sm mt-4">
                External stylesheets, frameworks, or libraries are not allowed.
              </p>
            </div>
            {/* Prohibited Tools */}
            <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4 font-orbitron flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
                Prohibited Tools
              </h3>
              <p className="text-text-secondary font-rajdhani text-lg mb-4">The following are not allowed:</p>
              <ul className="text-text-secondary font-rajdhani text-lg space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  JavaScript
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  CSS frameworks (Bootstrap, Tailwind, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  External CSS files
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  AI code generators
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Copying solutions from CSSBattle or other participants
                </li>
              </ul>
            </div>

            {/* Round Format */}
            <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4 font-orbitron flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
                Round Format
              </h3>
              <div className="space-y-4">
                {/* Easy Round */}
                <div className="bg-dark-bg rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-bold font-rajdhani border border-green-500/30">
                      EASY
                    </span>
                    <h4 className="text-text-primary font-semibold font-rajdhani">Round 1</h4>
                  </div>
                  <ul className="text-text-secondary font-rajdhani space-y-1">
                    <li>• 10 challenges</li>
                    <li>• 10 points each</li>
                    <li>• Basic shapes and layouts</li>
                    <li>• <span className="text-green-500 font-semibold">Total: 100 points</span></li>
                  </ul>
                </div>

                {/* Medium Round */}
                <div className="bg-dark-bg rounded-lg p-4 border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-sm font-bold font-rajdhani border border-orange-500/30">
                      MEDIUM
                    </span>
                    <h4 className="text-text-primary font-semibold font-rajdhani">Round 2</h4>
                  </div>
                  <ul className="text-text-secondary font-rajdhani space-y-1">
                    <li>• 5 challenges</li>
                    <li>• 20 points each</li>
                    <li>• Requires creative CSS techniques</li>
                    <li>• <span className="text-orange-500 font-semibold">Total: 100 points</span></li>
                  </ul>
                </div>

                {/* Hard Round */}
                <div className="bg-dark-bg rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-sm font-bold font-rajdhani border border-red-500/30">
                      HARD
                    </span>
                    <h4 className="text-text-primary font-semibold font-rajdhani">Round 3</h4>
                  </div>
                  <ul className="text-text-secondary font-rajdhani space-y-1">
                    <li>• 3 challenges</li>
                    <li>• 30 points each</li>
                    <li>• Complex shapes and advanced positioning</li>
                    <li>• <span className="text-red-500 font-semibold">Total: 90 points</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submission Rules */}
            <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4 font-orbitron flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
                Submission Rules
              </h3>
              <ul className="text-text-secondary font-rajdhani text-lg space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  Only <span className="text-purple-primary font-semibold">one submission</span> allowed per challenge
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  Auto-save feature available for work-in-progress
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  Submit before time limit expires
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  No modifications allowed after submission
                </li>
              </ul>
            </div>

            {/* Time Limit */}
            <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4 font-orbitron flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
                Time Limit
              </h3>
              <ul className="text-text-secondary font-rajdhani text-lg space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  Each round will have a fixed time limit announced during the event
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  Participants must submit their solutions before the timer ends
                </li>
              </ul>
            </div>

            {/* Judging Criteria */}
            <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4 font-orbitron flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
                Judging Criteria
              </h3>
              <p className="text-text-secondary font-rajdhani text-lg mb-4">Submissions will be evaluated based on:</p>
              <ul className="text-text-secondary font-rajdhani text-lg space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  <span className="text-purple-primary font-semibold">Visual Accuracy</span> (how closely it matches the target design)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  <span className="text-purple-primary font-semibold">CSS Efficiency</span> (clean and minimal code)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  <span className="text-purple-primary font-semibold">Creativity</span> in implementation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-primary rounded-full"></span>
                  <span className="text-purple-primary font-semibold">Completion</span> within time
                </li>
              </ul>
            </div>

            {/* Organizer's Decision */}
            <div className="bg-gradient-to-br from-purple-primary/10 to-purple-tertiary/10 rounded-lg border border-purple-primary/30 p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4 font-orbitron flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
                Organizer's Decision
              </h3>
              <p className="text-text-secondary font-rajdhani text-lg">
                The organizers' decision is final in all matters regarding scoring and rule interpretation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};