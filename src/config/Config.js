// Game Configuration and Constants
export const CONFIG = {
    GRID_SIZE: 20,
    TILE_COUNT: 20,
    FOOD_LIFETIME: 5000, // 5 seconds
    DRUNK_DELAY: 1000, // 1 second
    DRUNK_DURATION: 1500, // 1.5 seconds
    MAX_PARTICLES: 100,
    MAX_EXPLOSIONS: 50,
    MAX_LOG_MESSAGES: 5,
    LOG_DISPLAY_TIME: 10000, // 10 seconds
    DELAY_1X: 150,
};

export const SPEEDS = [
    {multiplier: 1, delay: CONFIG.DELAY_1X, name: "1x"},
    {multiplier: 1.5, delay: CONFIG.DELAY_1X / 1.5, name: "1.5x"},
    {multiplier: 2, delay: CONFIG.DELAY_1X / 2, name: "2x"},
    {multiplier: 3, delay: CONFIG.DELAY_1X / 3, name: "3x"},
    {multiplier: 4, delay: CONFIG.DELAY_1X / 4, name: "4x"},
    {multiplier: 10, delay: CONFIG.DELAY_1X / 10, name: "10x"}
];

export const FOOD_TYPES = [
    {
        type: 'apple',
        name: 'Apple',
        points: 1,
        probability: 18,
        emoji: '🍎',
        effect: {
            color: '#FF0000', // Bright red
            template: 'classic'
        }
    },
    {
        type: 'grapes',
        name: 'Grapes',
        points: 2,
        probability: 15,
        emoji: '🍇',
        effect: {
            color: '#8B00FF', // Purple
            template: 'neon'
        }
    },
    {
        type: 'orange',
        name: 'Orange',
        points: 2,
        probability: 15,
        emoji: '🍊',
        effect: {
            color: '#FF6600', // Orange
            template: 'fire'
        }
    },
    {
        type: 'watermelon',
        name: 'Watermelon',
        points: 3,
        probability: 12,
        emoji: '🍉',
        effect: {
            color: '#00FF00', // Green (not used for rainbow)
            template: 'rainbow'
        }
    },
    {
        type: 'strawberry',
        name: 'Strawberry',
        points: 2,
        probability: 12,
        emoji: '🍓',
        effect: {
            color: '#FF1493', // Deep pink
            template: 'neon'
        }
    },
    {
        type: 'banana',
        name: 'Banana',
        points: 2,
        probability: 10,
        emoji: '🍌',
        effect: {
            color: '#FFD700', // Golden yellow
            template: 'metal'
        }
    },
    {
        type: 'cherry',
        name: 'Cherry',
        points: 3,
        probability: 8,
        emoji: '🍒',
        effect: {
            color: '#DC143C', // Crimson red
            template: 'fire'
        }
    },
    {
        type: 'beer',
        name: 'Beer',
        points: 5,
        probability: 7,
        emoji: '🍺',
        effect: {
            color: '#FFD700', // Golden
            template: 'rainbow' // Party mode!
        }
    },
    {
        type: 'toxic',
        name: 'Toxic',
        points: 0,
        probability: 3,
        emoji: '☠️',
        effect: null // No effect, instant death
    }
];

export const FOOD_EFFECT_DELAY = 200; // ms delay before effect applies
export const FOOD_EFFECT_DURATION = 5000; // 5 seconds effect duration


// Difficulty settings
export const DIFFICULTY_LEVELS = {
    easy: {
        name: 'Easy',
        obstacleMin: 10,
        obstacleMax: 15,
        policeSnake: false
    },
    medium: {
        name: 'Medium',
        obstacleMin: 15,
        obstacleMax: 20,
        policeSnake: false
    },
    hard: {
        name: 'Hard',
        obstacleMin: 20,
        obstacleMax: 25,
        policeSnake: true // Police snake enabled in hard mode!
    }
};

// Police Snake Configuration
export const POLICE_SNAKE_CONFIG = {
    baseSpeed: 1.1,
    directionDelay: 1000,     // Re-aim at player after this many ms on same heading
    initialLength: 5,
    spawnDelay: 3000,         // After first move, delay before police spawns (ms)
    speedBoostOnFood: true,
    sameDirectionFollowMs: 1000
};

// Obstacle configuration (legacy - now uses DIFFICULTY_LEVELS)
export const OBSTACLE_NUMBERS = 15;
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

