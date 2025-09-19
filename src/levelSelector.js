// src/levelSelector.js
export class LevelSelector {
  constructor(levels, onLevelSelect, getBestScore) {
    this.levels = levels;
    this.onLevelSelect = onLevelSelect;
    this.getBestScore = getBestScore;
    this.isVisible = false;
    
    this.createLevelSelectorUI();
    this.bindEvents();
  }

  createLevelSelectorUI() {
    const levelSelectorHTML = `
      <div id="levelSelectorOverlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 150;
        overflow-y: auto;
      ">
        <div class="level-selector-panel" style="
          background: linear-gradient(135deg, #2c3e50, #34495e);
          border-radius: 20px;
          padding: 30px;
          max-width: 800px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          color: white;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #ecf0f1;">Select Level</h2>
            <button id="closeLevelSelector" style="
              background: #e74c3c;
              border: none;
              border-radius: 50%;
              width: 35px;
              height: 35px;
              color: white;
              cursor: pointer;
              font-size: 18px;
            ">×</button>
          </div>

          <div id="levelGrid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          "></div>

          <div style="
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
          ">
            <h3 style="margin: 0 0 10px 0; color: #3498db;">Your Progress</h3>
            <div id="progressStats" style="display: flex; justify-content: space-between; font-size: 14px;">
              <div>Levels Completed: <span id="completedCount">0</span>/<span id="totalCount">${this.levels.length}</span></div>
              <div>Total Strokes: <span id="totalStrokes">0</span></div>
              <div>Average Score: <span id="averageScore">-</span></div>
            </div>
            <div style="
              width: 100%;
              height: 8px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 4px;
              margin-top: 10px;
              overflow: hidden;
            ">
              <div id="progressBar" style="
                height: 100%;
                background: linear-gradient(90deg, #27ae60, #2ecc71);
                border-radius: 4px;
                width: 0%;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', levelSelectorHTML);
    this.populateLevelGrid();
  }

  async populateLevelGrid() {
    const levelGrid = document.getElementById('levelGrid');
    let completedCount = 0;
    let totalStrokes = 0;

    for (let i = 0; i < this.levels.length; i++) {
      const level = this.levels[i];
      const bestScore = await this.getBestScore(level.id);
      
      if (bestScore) {
        completedCount++;
        totalStrokes += bestScore;
      }

      const levelCard = this.createLevelCard(level, bestScore, i);
      levelGrid.appendChild(levelCard);
    }

    // Update progress stats
    this.updateProgressStats(completedCount, totalStrokes);
  }

  createLevelCard(level, bestScore, index) {
    const card = document.createElement('div');
    const isCompleted = bestScore !== null;
    const isLocked = false; // For now, all levels are unlocked
    
    // Determine card status
    let statusColor = '#95a5a6'; // Default gray
    let statusText = 'Not Played';
    
    if (isCompleted) {
      if (bestScore <= level.par) {
        statusColor = '#27ae60'; // Green for par or better
        statusText = bestScore < level.par ? 'Under Par!' : 'Par';
      } else {
        statusColor = '#f39c12'; // Orange for over par
        statusText = 'Over Par';
      }
    }

    card.style.cssText = `
      background: linear-gradient(135deg, #34495e, #2c3e50);
      border-radius: 12px;
      padding: 20px;
      cursor: ${isLocked ? 'not-allowed' : 'pointer'};
      transition: all 0.3s ease;
      border: 2px solid ${isCompleted ? statusColor : 'rgba(255, 255, 255, 0.1)'};
      opacity: ${isLocked ? '0.5' : '1'};
      position: relative;
      overflow: hidden;
    `;

    // Add hover effect
    if (!isLocked) {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      });
    }

    card.innerHTML = `
      <!-- Level Preview (simple geometric representation) -->
      <div style="
        width: 100%;
        height: 80px;
        background: linear-gradient(45deg, #4a7c59, #5d8a6b);
        border-radius: 8px;
        margin-bottom: 15px;
        position: relative;
        overflow: hidden;
      ">
        ${this.generateLevelPreview(level)}
        ${isLocked ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px;">🔒</div>' : ''}
      </div>

      <!-- Level Info -->
      <div style="margin-bottom: 10px;">
        <h4 style="margin: 0 0 5px 0; color: #ecf0f1;">Hole ${level.id}</h4>
        <div style="font-size: 12px; color: #bdc3c7;">Par ${level.par}</div>
      </div>

      <!-- Score Display -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div style="font-size: 12px; color: ${statusColor}; font-weight: 500;">
          ${statusText}
        </div>
        <div style="font-size: 14px; font-weight: bold;">
          ${bestScore ? `${bestScore} strokes` : 'Not played'}
        </div>
      </div>

      <!-- Difficulty Indicator -->
      <div style="margin-bottom: 10px;">
        <div style="font-size: 11px; color: #95a5a6; margin-bottom: 3px;">Difficulty</div>
        <div style="display: flex; gap: 2px;">
          ${this.generateDifficultyStars(level.par)}
        </div>
      </div>

      <!-- Play Button -->
      <button class="level-play-btn" data-level-index="${index}" style="
        width: 100%;
        padding: 8px;
        background: ${isCompleted ? statusColor : '#3498db'};
        border: none;
        border-radius: 6px;
        color: white;
        cursor: ${isLocked ? 'not-allowed' : 'pointer'};
        font-weight: 500;
        font-size: 12px;
        transition: all 0.2s ease;
        ${isLocked ? 'pointer-events: none;' : ''}
      ">
        ${isLocked ? 'Locked' : (isCompleted ? 'Play Again' : 'Play Level')}
      </button>
    `;

    // Add click handler
    if (!isLocked) {
      card.querySelector('.level-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectLevel(index);
      });
    }

    return card;
  }

  generateLevelPreview(level) {
    // Create a simple visual representation of the level
    const startX = 10;
    const startY = 40;
    const holeX = 160;
    const holeY = 40;

    let wallsHTML = '';
    level.walls.forEach(wall => {
      // Scale and position walls for preview
      const x = (wall.x + 5) * 15; // Scale and offset
      const y = (wall.z + 2.5) * 15 + 10; // Scale and offset
      const w = wall.w * 10;
      const h = wall.d * 10;
      
      wallsHTML += `<div style="
        position: absolute;
        left: ${Math.max(0, Math.min(180, x - w/2))}px;
        top: ${Math.max(0, Math.min(70, y - h/2))}px;
        width: ${Math.min(w, 20)}px;
        height: ${Math.min(h, 20)}px;
        background: #8b4513;
        border-radius: 2px;
      "></div>`;
    });

    return `
      ${wallsHTML}
      <!-- Start position -->
      <div style="
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
      "></div>
      <!-- Hole position -->
      <div style="
        position: absolute;
        left: ${holeX}px;
        top: ${holeY}px;
        width: 12px;
        height: 12px;
        background: #000;
        border-radius: 50%;
        border: 2px solid #333;
      "></div>
    `;
  }

  generateDifficultyStars(par) {
    const difficulty = Math.min(5, Math.max(1, par - 1)); // Convert par to 1-5 difficulty
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<div style="
        width: 12px;
        height: 12px;
        background: ${i <= difficulty ? '#f39c12' : 'rgba(255, 255, 255, 0.2)'};
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
      "></div>`;
    }
    return stars;
  }

  updateProgressStats(completedCount, totalStrokes) {
    document.getElementById('completedCount').textContent = completedCount;
    document.getElementById('totalStrokes').textContent = totalStrokes;
    
    const averageScore = completedCount > 0 ? (totalStrokes / completedCount).toFixed(1) : '-';
    document.getElementById('averageScore').textContent = averageScore;
    
    const progressPercentage = (completedCount / this.levels.length) * 100;
    document.getElementById('progressBar').style.width = `${progressPercentage}%`;
  }

  bindEvents() {
    // Close button
    document.getElementById('closeLevelSelector').addEventListener('click', () => this.hide());

    // Close on outside click
    document.getElementById('levelSelectorOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'levelSelectorOverlay') {
        this.hide();
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  selectLevel(levelIndex) {
    this.hide();
    if (this.onLevelSelect) {
      this.onLevelSelect(levelIndex);
    }
  }

  async show() {
    this.isVisible = true;
    await this.populateLevelGrid(); // Refresh with latest scores
    document.getElementById('levelSelectorOverlay').style.display = 'flex';
  }

  hide() {
    this.isVisible = false;
    document.getElementById('levelSelectorOverlay').style.display = 'none';
  }

  // Method to refresh a specific level's display after completion
  async refreshLevel(levelId) {
    if (this.isVisible) {
      await this.populateLevelGrid();
    }
  }
}