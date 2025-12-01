// Game Configuration and Constants
export const CONFIG = {
  GRID_SIZE: 20,
  TILE_COUNT: 20,
  FOOD_LIFETIME: 5000, // 5 seconds
  DRUNK_DELAY: 1000, // 1 second
  DRUNK_DURATION: 3000, // 3 seconds
  MAX_PARTICLES: 100,
  MAX_EXPLOSIONS: 50,
  MAX_LOG_MESSAGES: 5,
  LOG_DISPLAY_TIME: 10000 // 10 seconds
};

export const SPEEDS = [
  { multiplier: 1, delay: 150, name: "1x" },
  { multiplier: 1.5, delay: 100, name: "1.5x" },
  { multiplier: 2, delay: 75, name: "2x" },
  { multiplier: 3, delay: 50, name: "3x" },
  { multiplier: 4, delay: 37, name: "4x" },
  { multiplier: 10, delay: 15, name: "10x" }
];

export const FOOD_TYPES = [
  { type: 'apple', name: 'Apple', points: 1, probability: 18, emoji: '🍎' },
  { type: 'grapes', name: 'Grapes', points: 2, probability: 15, emoji: '🍇' },
  { type: 'orange', name: 'Orange', points: 2, probability: 15, emoji: '🍊' },
  { type: 'watermelon', name: 'Watermelon', points: 3, probability: 12, emoji: '🍉' },
  { type: 'strawberry', name: 'Strawberry', points: 2, probability: 12, emoji: '🍓' },
  { type: 'banana', name: 'Banana', points: 2, probability: 10, emoji: '🍌' },
  { type: 'cherry', name: 'Cherry', points: 3, probability: 8, emoji: '🍒' },
  { type: 'beer', name: 'Beer', points: 5, probability: 7, emoji: '🍺' },
  { type: 'toxic', name: 'Toxic', points: 0, probability: 3, emoji: '☠️' }
];

export const OBSTACLE_COLOR_PALETTE = [
  '#8B0000', // Dark red
  '#006400', // Dark green
  '#000080', // Navy
  '#800080', // Purple
  '#8B4513', // Saddle brown
  '#2F4F4F', // Dark slate gray
  '#4B0082'  // Indigo
];

export const TEMPLATES = {
  CLASSIC: 'classic',
  RAINBOW: 'rainbow',
  FIRE: 'fire',
  OCEAN: 'ocean',
  NEON: 'neon',
  METAL: 'metal'
};

