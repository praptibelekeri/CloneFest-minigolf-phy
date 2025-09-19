// src/enhancedScoring.js
export class EnhancedScoringDisplay {
  constructor() {
    this.sessionStats = {
      totalStrokes: 0,
      holesCompleted: 0,
      bestStreak: 0,
      currentStreak: 0,
      holesInOne: 0,
      underParCount: 0
    };
    
    this.currentHoleStats = {
      par: 3,
      strokes: 0,
      previousBest: null
    };
    
    this.createEnhancedHUD();
    this.loadSessionStats();
  }

  createEnhancedHUD() {
    // Replace the basic HUD with an enhanced version
    const existingHUD = document.getElementById('hud');
    if (existingHUD) {
      existingHUD.remove();
    }

    const enhancedHUDHTML = `
      <div id="enhancedHUD" style="
        position: fixed;
        left: 12px;
        top: 12px;
        background: linear-gradient(135deg, rgba(43, 132, 177, 0.6), rgba(20, 78, 117, 0.7));
        backdrop-filter: blur(10px);
        color: #d7e6f2;
        padding: 15px;
        border-radius: 15px;
        z-index: 10;
        font-size: 14px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        min-width: 250px;
      ">
        <!-- Current Hole Info -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        ">
          <div style="text-align: center;">
            <div id="holeDisplay" style="font-size: 18px; font-weight: bold; color: #3498db;">Hole 1</div>
            <div style="font-size: 11px; opacity: 0.8;">Current</div>
          </div>
          <div style="text-align: center;">
            <div id="parDisplay" style="font-size: 18px; font-weight: bold; color: #f39c12;">Par 3</div>
            <div style="font-size: 11px; opacity: 0.8;">Target</div>
          </div>
          <div style="text-align: center;">
            <div id="strokesDisplay" style="font-size: 18px; font-weight: bold; color: #e74c3c;">0</div>
            <div style="font-size: 11px; opacity: 0.8;">Strokes</div>
          </div>
        </div>

        <!-- Score Status -->
        <div id="scoreStatus" style="
          text-align: center;
          padding: 8px;
          border-radius: 8px;
          margin-bottom: 12px;
          background: rgba(52, 152, 219, 0.2);
          border: 1px solid #3498db;
          font-weight: 500;
          font-size: 13px;
        ">
          Ready to play
        </div>

        <!-- Power Bar -->
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="font-size: 12px; opacity: 0.9;">Power</span>
            <span id="powerPercentage" style="font-size: 11px; opacity: 0.7;">0%</span>
          </div>
          <div id="powerbar" style="
            width: 100%;
            height: 12px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            overflow: hidden;
            position: relative;
          ">
            <div id="powerfill" style="
              height: 100%;
              width: 0%;
              background: linear-gradient(90deg, #27ae60, #f39c12, #e74c3c);
              border-radius: 8px;
              transition: width 0.05s linear;
              box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
            "></div>
          </div>
        </div>

        <!-- Session Stats (Collapsible) -->
        <div style="margin-bottom: 12px;">
          <button id="statsToggle" style="
            width: 100%;
            background: none;
            border: none;
            color: inherit;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
            opacity: 0.8;
          ">
            <span>Session Stats</span>
            <span id="statsArrow">▼</span>
          </button>
          <div id="sessionStatsPanel" style="
            display: none;
            background: rgba(0, 0, 0, 0.2);
            padding: 10px;
            border-radius: 8px;
            font-size: 11px;
            margin-top: 5px;
          ">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>Completed: <span id="holesCompleted">0</span></div>
              <div>Total Strokes: <span id="totalStrokes">0</span></div>
              <div>Under Par: <span id="underParCount">0</span></div>
              <div>Holes-in-One: <span id="holesInOne">0</span></div>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              Best Streak: <span id="bestStreak">0</span> | Current: <span id="currentStreak">0</span>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div id="controls" style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button id="resetBtn" style="
            flex: 1;
            min-width: 70px;
            padding: 6px 8px;
            background: linear-gradient(45deg, #95a5a6, #7f8c8d);
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
          ">Reset</button>
          <button id="nextBtn" style="
            flex: 1;
            min-width: 70px;
            padding: 6px 8px;
            background: linear-gradient(45deg, #3498db, #2980b9);
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
          ">Next</button>
          <button id="followBtn" style="
            flex: 1;
            min-width: 70px;
            padding: 6px 8px;
            background: linear-gradient(45deg, #27ae60, #229954);
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
          ">Follow: Off</button>
        </div>

        <!-- Hint Text -->
        <div id="hint" style="
          margin-top: 10px;
          font-size: 11px;
          text-align: center;
          opacity: 0.7;
          line-height: 1.3;
        ">Hold SHIFT + drag to aim (or drag on touch)</div>

        <!-- Previous Best Display -->
        <div id="previousBest" style="
          margin-top: 8px;
          text-align: center;
          font-size: 10px;
          opacity: 0.6;
          display: none;
        ">Previous best: <span id="prevBestScore">-</span></div>
      </div>

      <!-- Floating Achievements -->
      <div id="achievementContainer" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        pointer-events: none;
      "></div>
    `;

    document.body.insertAdjacentHTML('beforeend', enhancedHUDHTML);
    this.bindHUDEvents();
  }

  bindHUDEvents() {
    // Stats panel toggle
    document.getElementById('statsToggle').addEventListener('click', () => {
      const panel = document.getElementById('sessionStatsPanel');
      const arrow = document.getElementById('statsArrow');
      
      if (panel.style.display === 'none') {
        panel.style.display = 'block';
        arrow.textContent = '▲';
      } else {
        panel.style.display = 'none';
        arrow.textContent = '▼';
      }
    });
  }

  updateHoleInfo(holeNum, par) {
    this.currentHoleStats.par = par;
    document.getElementById('holeDisplay').textContent = `Hole ${holeNum}`;
    document.getElementById('parDisplay').textContent = `Par ${par}`;
    this.updateScoreStatus();
  }

  updateStrokes(strokes) {
    this.currentHoleStats.strokes = strokes;
    document.getElementById('strokesDisplay').textContent = strokes;
    this.updateScoreStatus();
  }

  updateScoreStatus() {
    const status = document.getElementById('scoreStatus');
    const strokes = this.currentHoleStats.strokes;
    const par = this.currentHoleStats.par;

    if (strokes === 0) {
      status.textContent = 'Ready to play';
      status.style.background = 'rgba(52, 152, 219, 0.2)';
      status.style.borderColor = '#3498db';
      status.style.color = '#3498db';
      return;
    }

    let statusText, bgColor, borderColor, textColor;

    if (strokes === 1 && par > 1) {
      statusText = 'Hole-in-One! 🎯';
      bgColor = 'rgba(241, 196, 15, 0.3)';
      borderColor = '#f1c40f';
      textColor = '#f1c40f';
    } else if (strokes < par) {
      const under = par - strokes;
      statusText = `${under} Under Par! 🔥`;
      bgColor = 'rgba(46, 204, 113, 0.2)';
      borderColor = '#2ecc71';
      textColor = '#2ecc71';
    } else if (strokes === par) {
      statusText = 'On Par 👌';
      bgColor = 'rgba(52, 152, 219, 0.2)';
      borderColor = '#3498db';
      textColor = '#3498db';
    } else {
      const over = strokes - par;
      statusText = `${over} Over Par`;
      bgColor = 'rgba(231, 76, 60, 0.2)';
      borderColor = '#e74c3c';
      textColor = '#e74c3c';
    }

    status.textContent = statusText;
    status.style.background = bgColor;
    status.style.borderColor = borderColor;
    status.style.color = textColor;
  }

  updatePowerDisplay(power, maxPower = 1) {
    const percentage = Math.round((power / (maxPower || 1)) * 100);
    document.getElementById('powerfill').style.width = Math.min(100, Math.max(0, percentage)) + '%';
    document.getElementById('powerPercentage').textContent = percentage + '%';
  }

  setPreviousBest(score) {
    this.currentHoleStats.previousBest = score;
    const prevBestEl = document.getElementById('previousBest');
    
    if (score !== null && score !== undefined) {
      document.getElementById('prevBestScore').textContent = `${score} strokes`;
      prevBestEl.style.display = 'block';
    } else {
      prevBestEl.style.display = 'none';
    }
  }

  onHoleComplete(strokes) {
    const par = this.currentHoleStats.par;
    const previousBest = this.currentHoleStats.previousBest;
    
    // Update session stats
    this.sessionStats.totalStrokes += strokes;
    this.sessionStats.holesCompleted += 1;
    
    if (strokes === 1) {
      this.sessionStats.holesInOne += 1;
      this.showAchievement('🎯 Hole-in-One!', '#f1c40f');
    }
    
    if (strokes < par) {
      this.sessionStats.underParCount += 1;
      this.sessionStats.currentStreak += 1;
      this.sessionStats.bestStreak = Math.max(this.sessionStats.bestStreak, this.sessionStats.currentStreak);
    } else {
      this.sessionStats.currentStreak = 0;
    }

    // Check for new personal best
    if (previousBest === null || strokes < previousBest) {
      this.showAchievement('🏆 New Personal Best!', '#27ae60');
    }

    this.updateSessionDisplay();
    this.saveSessionStats();
  }

  updateSessionDisplay() {
    document.getElementById('holesCompleted').textContent = this.sessionStats.holesCompleted;
    document.getElementById('totalStrokes').textContent = this.sessionStats.totalStrokes;
    document.getElementById('underParCount').textContent = this.sessionStats.underParCount;
    document.getElementById('holesInOne').textContent = this.sessionStats.holesInOne;
    document.getElementById('bestStreak').textContent = this.sessionStats.bestStreak;
    document.getElementById('currentStreak').textContent = this.sessionStats.currentStreak;
  }

  showAchievement(text, color = '#3498db') {
    const container = document.getElementById('achievementContainer');
    const achievement = document.createElement('div');
    
    achievement.style.cssText = `
      background: linear-gradient(45deg, ${color}, ${this.darkenColor(color, 20)});
      color: white;
      padding: 15px 25px;
      border-radius: 25px;
      font-weight: bold;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      margin-bottom: 10px;
      animation: achievementPop 3s ease forwards;
      transform: scale(0);
      border: 2px solid rgba(255, 255, 255, 0.3);
    `;
    
    achievement.textContent = text;
    container.appendChild(achievement);
    
    setTimeout(() => achievement.remove(), 3000);
  }

  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  resetHole() {
    this.currentHoleStats.strokes = 0;
    this.updateStrokes(0);
  }

  loadSessionStats() {
    try {
      const saved = localStorage.getItem('minigolf_session_stats');
      if (saved) {
        this.sessionStats = { ...this.sessionStats, ...JSON.parse(saved) };
        this.updateSessionDisplay();
      }
    } catch (e) {
      console.warn('Failed to load session stats:', e);
    }
  }

  saveSessionStats() {
    try {
      localStorage.setItem('minigolf_session_stats', JSON.stringify(this.sessionStats));
    } catch (e) {
      console.warn('Failed to save session stats:', e);
    }
  }

  resetSessionStats() {
    this.sessionStats = {
      totalStrokes: 0,
      holesCompleted: 0,
      bestStreak: 0,
      currentStreak: 0,
      holesInOne: 0,
      underParCount: 0
    };
    this.updateSessionDisplay();
    this.saveSessionStats();
  }

  // CSS animation for achievement pop-up
  injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes achievementPop {
        0% { transform: scale(0) rotate(-5deg); opacity: 0; }
        15% { transform: scale(1.1) rotate(2deg); opacity: 1; }
        30% { transform: scale(1) rotate(0deg); }
        85% { transform: scale(1) rotate(0deg); opacity: 1; }
        100% { transform: scale(0.8) rotate(0deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize CSS when module loads
if (typeof document !== 'undefined') {
  const scoringDisplay = new EnhancedScoringDisplay();
  scoringDisplay.injectCSS();
}