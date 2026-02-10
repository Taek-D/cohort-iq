export const COLORS = {
  bgDark: '#080415',
  bgMid: '#120830',
  bgCard: 'rgba(255, 255, 255, 0.06)',
  bgCardHover: 'rgba(255, 255, 255, 0.1)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.15)',

  indigo: '#818cf8',
  violet: '#a78bfa',
  cyan: '#22d3ee',
  green: '#4ade80',
  amber: '#fbbf24',
  rose: '#fb7185',
  sky: '#38bdf8',

  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
};

export const FONT_FAMILY =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const MONO_FONT = '"JetBrains Mono", "Fira Code", Consolas, monospace';

export const FPS = 30;

export const SCENE = {
  intro: { from: 0, duration: 120 },
  problem: { from: 120, duration: 150 },
  solution: { from: 270, duration: 150 },
  features: { from: 420, duration: 180 },
  closing: { from: 600, duration: 150 },
} as const;

export const TOTAL_FRAMES = 750;
