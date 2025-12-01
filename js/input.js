// Input Handling (Keyboard and Mobile Controls)
import { isInputElement } from './utils.js';

export class InputManager {
  constructor(game) {
    this.game = game;
    this.setupKeyboardControls();
    this.setupMobileControls();
  }
  
  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      const activeElement = document.activeElement;
      
      if (isInputElement(activeElement)) {
        return;
      }
      
      if (e.code === 'Enter') {
        e.preventDefault();
        this.game.shootBullet();
        return;
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        
        if (e.shiftKey) {
          this.game.decreaseSpeed();
        } else {
          this.game.increaseSpeed();
        }
        return;
      }
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      
      const keyPressed = e.code;
      const velocity = this.game.getSnakeVelocity();
      
      if (keyPressed === 'ArrowUp' && velocity.y !== 1) {
        this.game.setSnakeVelocity(0, -1);
      } else if (keyPressed === 'ArrowDown' && velocity.y !== -1) {
        this.game.setSnakeVelocity(0, 1);
      } else if (keyPressed === 'ArrowLeft' && velocity.x !== 1) {
        this.game.setSnakeVelocity(-1, 0);
      } else if (keyPressed === 'ArrowRight' && velocity.x !== -1) {
        this.game.setSnakeVelocity(1, 0);
      } else if (keyPressed === 'KeyW' && velocity.y !== 1) {
        this.game.setSnakeVelocity(0, -1);
      } else if (keyPressed === 'KeyS' && velocity.y !== -1) {
        this.game.setSnakeVelocity(0, 1);
      } else if (keyPressed === 'KeyA' && velocity.x !== 1) {
        this.game.setSnakeVelocity(-1, 0);
      } else if (keyPressed === 'KeyD' && velocity.x !== -1) {
        this.game.setSnakeVelocity(1, 0);
      }
    });
  }
  
  setupMobileControls() {
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnCenter = document.getElementById('btn-center');
    
    if (btnUp) {
      btnUp.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const velocity = this.game.getSnakeVelocity();
        if (velocity.y !== 1) {
          this.game.setSnakeVelocity(0, -1);
        }
      });
    }
    
    if (btnDown) {
      btnDown.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const velocity = this.game.getSnakeVelocity();
        if (velocity.y !== -1) {
          this.game.setSnakeVelocity(0, 1);
        }
      });
    }
    
    if (btnLeft) {
      btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const velocity = this.game.getSnakeVelocity();
        if (velocity.x !== 1) {
          this.game.setSnakeVelocity(-1, 0);
        }
      });
    }
    
    if (btnRight) {
      btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const velocity = this.game.getSnakeVelocity();
        if (velocity.x !== -1) {
          this.game.setSnakeVelocity(1, 0);
        }
      });
    }
    
    if (btnCenter) {
      btnCenter.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.shootBullet();
      });
    }
  }
}

