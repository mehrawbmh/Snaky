// Canvas Management
import { CONFIG } from '../config/Config.js';

export class CanvasManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = CONFIG.GRID_SIZE;
    this.tileCount = CONFIG.TILE_COUNT;
    
    this.resizeCanvas();
    this.setupResizeListener();
  }
  
  resizeCanvas() {
    const wrapper = document.querySelector('.canvas-wrapper');
    const maxWidth = wrapper.clientWidth - 40;
    const maxHeight = wrapper.clientHeight - 40;
    
    const minDimension = Math.min(maxWidth, maxHeight);
    const canvasSize = Math.floor(minDimension / this.tileCount) * this.tileCount;
    
    this.canvas.width = canvasSize;
    this.canvas.height = canvasSize;
    this.gridSize = canvasSize / this.tileCount;
  }
  
  setupResizeListener() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }
  
  clear() {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  getContext() {
    return this.ctx;
  }
  
  getGridSize() {
    return this.gridSize;
  }
  
  getTileCount() {
    return this.tileCount;
  }
  
  getCanvas() {
    return this.canvas;
  }
}

