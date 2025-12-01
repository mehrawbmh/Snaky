# Snaky - A Modern Snake Game

A feature-rich, responsive snake game built with vanilla JavaScript using ES6 modules and best practices.

## 🎮 Features

- **Multiple Food Types**: Apple, Grapes, Orange, Beer (drunk effect), and Toxic food
- **Obstacle System**: Destroyable obstacles with bullet shooting mechanics
- **Visual Effects**: Particle systems, explosions, and animated trails
- **Customizable Settings**: Snake colors, templates (Classic, Rainbow, Fire, Ocean, Neon, Metal)
- **Speed Control**: Adjustable game speed (1x to 10x)
- **High Score System**: Local storage-based scoreboard
- **Mobile Support**: Touch-friendly virtual joystick controls
- **Responsive Design**: Full-screen gameplay on all devices

## 📁 Project Structure

```
Snaky/
├── main.html           # Main HTML entry point
├── styles.css          # All game styles
├── favicon.svg         # Game icon
├── js/                 # Modular JavaScript files
│   ├── game.js         # Main game controller
│   ├── config.js       # Game configuration and constants
│   ├── canvas.js       # Canvas management and rendering
│   ├── snake.js        # Snake logic and drawing
│   ├── food.js         # Food types, generation, and effects
│   ├── obstacles.js    # Obstacle management
│   ├── bullets.js      # Bullet shooting mechanics
│   ├── particles.js    # Particle effects (fire, explosions)
│   ├── ui.js           # UI updates (score, status, logs)
│   ├── storage.js      # High score storage
│   ├── settings.js     # Settings modal management
│   ├── input.js        # Keyboard and mobile input handling
│   └── utils.js        # Utility functions (color manipulation)
└── README.md           # This file
```

## 🏗️ Architecture

### Module Responsibilities

#### **game.js** (Main Controller)
- Coordinates all game modules
- Manages game loop and state
- Handles game initialization and ending
- Provides global functions for HTML interaction

#### **config.js** (Configuration)
- Game constants (grid size, timers, limits)
- Speed configurations
- Food types and probabilities
- Color palettes
- Template definitions

#### **canvas.js** (Canvas Management)
- Canvas initialization and resizing
- Responsive canvas sizing
- Grid calculations
- Drawing context management

#### **snake.js** (Snake Logic)
- Snake movement and collision
- Head and segment drawing
- Direction control
- Visual templates (Classic, Rainbow, Fire, etc.)

#### **food.js** (Food System)
- Random food generation
- Food type selection based on probability
- Food drawing (Apple, Grapes, Orange, Beer, Toxic)
- Food expiration timer
- Visual timer display

#### **obstacles.js** (Obstacles)
- Obstacle generation
- Collision detection
- Health management
- Visual rendering with textures

#### **bullets.js** (Shooting Mechanics)
- Bullet shooting and movement
- Bullet-obstacle collision
- Bullet wrapping around screen
- Bullet aging and removal

#### **particles.js** (Visual Effects)
- Fire trail particles
- Explosion effects
- Particle lifecycle management
- Performance optimization (particle limits)

#### **ui.js** (User Interface)
- Score updates
- Speed display
- Status messages
- Stacked log notifications
- Game over screen

#### **storage.js** (Data Persistence)
- High score saving (localStorage)
- Score loading and sorting
- Scoreboard display

#### **settings.js** (Settings Management)
- Settings modal control
- Setting persistence
- Visual customization options
- Toggle features (scoreboard, logging)

#### **input.js** (Input Handling)
- Keyboard controls (Arrow keys, WASD)
- Mobile touch controls
- Input validation
- Speed controls (Space/Shift+Space)

#### **utils.js** (Utilities)
- Color manipulation (darken, lighten)
- Hex to HSL conversion
- Input element detection

## 🎯 Key Design Patterns

### ES6 Modules
All modules use ES6 import/export syntax for clean dependency management.

### Class-Based Architecture
Most modules are implemented as classes for encapsulation and state management.

### Separation of Concerns
Each module has a single, well-defined responsibility.

### Dependency Injection
Game controller passes necessary dependencies to each module.

### Event-Driven
Input handling is decoupled from game logic through event listeners.

## 🚀 Getting Started

1. Open `main.html` in a modern web browser
2. Configure your settings (player name, colors, templates)
3. Click "Apply Settings"
4. Press "PLAY" to start
5. Use arrow keys or WASD to move
6. Press Enter or tap center button to shoot
7. Press Space to increase speed, Shift+Space to decrease

## 🎮 Controls

### Desktop
- **Arrow Keys / WASD**: Move snake
- **Enter**: Shoot bullet
- **Space**: Increase speed
- **Shift + Space**: Decrease speed

### Mobile
- **D-Pad**: Move snake
- **Center Button (🔫)**: Shoot bullet

## 🎨 Customization

All game settings can be customized through the settings modal:
- Player name
- Snake color
- Visual template
- Obstacle colors
- Bullet properties
- Toggle scoreboard and logs

## 🏆 Scoring

- **Apple**: 1 point
- **Grapes**: 2 points
- **Orange**: 3 points
- **Beer**: 5 points (+ drunk effect)
- **Toxic**: Instant game over
- **Destroyed Obstacle**: 5 points

## 📱 Mobile Responsiveness

- Full-screen gameplay
- Virtual joystick for touch devices
- Hidden status bar and scoreboard on mobile
- Optimized UI for small screens

## 🛠️ Technical Stack

- **Vanilla JavaScript (ES6+)**: No frameworks required
- **HTML5 Canvas**: For rendering
- **CSS3**: Modern styling with animations
- **LocalStorage API**: For high score persistence
- **ES6 Modules**: Modular architecture
- **RequestAnimationFrame**: Smooth game loop

## 📝 Future Enhancements

- Multiplayer mode
- Power-ups and special abilities
- Level system with increasing difficulty
- Sound effects and background music
- Additional snake templates
- Custom map editor

## 📄 License

This project is open source and available for educational purposes.

---

Enjoy playing Snaky! 🐍✨

