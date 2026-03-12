/**
 * Difficulty Level Utilities - Difficulty Levels Feature
 */

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const getDifficultyConfig = (difficulty: DifficultyLevel): DifficultyConfig => {
  const configs: Record<DifficultyLevel, DifficultyConfig> = {
    easy: {
      label: 'Easy',
      color: '#10B981',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-500',
    },
    medium: {
      label: 'Medium',
      color: '#F59E0B',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-500',
    },
    hard: {
      label: 'Hard',
      color: '#EF4444',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-500',
    },
  };

  return configs[difficulty];
};

export const getDifficultyBadgeClasses = (difficulty: DifficultyLevel): string => {
  const config = getDifficultyConfig(difficulty);
  return `${config.bgColor} ${config.borderColor} ${config.textColor} border px-2 py-1 rounded-full text-xs font-bold font-rajdhani`;
};

export const getDifficultyDotColor = (difficulty: DifficultyLevel): string => {
  return getDifficultyConfig(difficulty).color;
};

export const sortByDifficulty = (a: DifficultyLevel, b: DifficultyLevel): number => {
  const order: Record<DifficultyLevel, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
  };
  
  return order[a] - order[b];
};