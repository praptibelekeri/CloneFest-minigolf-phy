// src/leaderboard.js
import { getGlobalLeaderboard, getAllUserScores } from './supabase.js';

export class LeaderboardSystem {
  constructor() {
    this.isVisible = false;
    this.currentTab = 'global';
    this.currentLevel = 1;
    
    this.createLeaderboardUI();
    this.bindEvents();
  }

  createLeaderboardUI() {
    const leaderboardHTML = `
      <div id="leaderboardOverlay" style="
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
        <div class="leaderboard-panel" style="
          background: linear-gradient(135deg, #2c3e50, #34495e);
          border-radius: 20px;
          padding: 30px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          color: white;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #ecf0f1;">Leaderboards</h2>
            <button id="closeLeaderboard" style="
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

          <!-- Tabs -->
          <div style="display: flex; margin-bottom: 20px; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
            <button id="globalTab" class="leaderboard-tab" data-tab="global" style="
              flex: 1;
              padding: 10px;
              background: none;
              border: none;
              color: white;
              cursor: pointer;
              border-bottom: 2px solid #3498db;
              font-weight: 500;
            ">Global Rankings</button>
            <button id="personalTab" class="leaderboard-tab" data-tab="personal" style="
              flex: 1;
              padding: 10px;
              background: none;
              border: none;
              color: rgba(255, 255, 255, 0.6);
              cursor: pointer;
              border-bottom: 2px solid transparent;
              font-weight: 500;
            ">Your Progress</button>
          </div>

          <!-- Level Selector -->
          <div id="levelSelector" style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-size: 14px;">Select Level:</label>
            <select id="levelDropdown" style="
              width: 100%;
              padding: 8px 12px;
              border-radius: 8px;
              border: none;
              background: #34495e;
              color: white;
              font-size: 14px;
            ">
              <option value="1">Hole 1</option>
              <option value="2">Hole 2</option>
            </select>
          </div>

          <!-- Content Container -->
          <div id="leaderboardContent" style="min-height: 300px;">
            <!-- Content will be populated here -->
          </div>

          <!-- Loading Indicator -->
          <div id="leaderboardLoading" style="
            display: none;
            text-align: center;
            padding: 40px;
            color: #95a5a6;
          ">
            <div style="
              border: 3px solid rgba(255, 255, 255, 0.1);
              border-radius: 50%;
              border-top: 3px solid #3498db;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 15px;
            "></div>
            <div>Loading leaderboard...</div>
          </div>
        </div>
      </div>

      <!-- Leaderboard Button in HUD -->
      <button id="leaderboardBtn" style="
        position: fixed;
        bottom: 80px;
        right: 20px;
        padding: 10px 15px;
        background: linear-gradient(45deg, #9b59b6, #8e44ad);
        border: none;
        border-radius: 20px;
        color: white;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        z-index: 50;
        box-shadow: 0 4px 15px rgba(155, 89, 182, 0.4);
        transition: all 0.3s ease;
      ">
        <span style="margin-right: 5px;">🏆</span>
        Leaderboard
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', leaderboardHTML);
  }

  bindEvents() {
    // Show/hide leaderboard
    document.getElementById('leaderboardBtn').addEventListener('click', () => this.show());
    document.getElementById('closeLeaderboard').addEventListener('click', () => this.hide());

    // Tab switching
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Level selection
    document.getElementById('levelDropdown').addEventListener('change', (e) => {
      this.currentLevel = parseInt(e.target.value);
      this.loadCurrentTabContent();
    });

    // Close on outside click
    document.getElementById('leaderboardOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'leaderboardOverlay') {
        this.hide();
      }
    });

    // Hover effects
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    leaderboardBtn.addEventListener('mouseenter', () => {
      leaderboardBtn.style.transform = 'translateY(-2px)';
      leaderboardBtn.style.boxShadow = '0 6px 20px rgba(155, 89, 182, 0.6)';
    });
    leaderboardBtn.addEventListener('mouseleave', () => {
      leaderboardBtn.style.transform = 'translateY(0)';
      leaderboardBtn.style.boxShadow = '0 4px 15px rgba(155, 89, 182, 0.4)';
    });
  }

  async show() {
    this.isVisible = true;
    document.getElementById('leaderboardOverlay').style.display = 'flex';
    await this.loadCurrentTabContent();
  }

  hide() {
    this.isVisible = false;
    document.getElementById('leaderboardOverlay').style.display = 'none';
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Update tab styles
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.style.borderBottomColor = '#3498db';
        tab.style.color = 'white';
      } else {
        tab.style.borderBottomColor = 'transparent';
        tab.style.color = 'rgba(255, 255, 255, 0.6)';
      }
    });

    this.loadCurrentTabContent();
  }

  async loadCurrentTabContent() {
    const content = document.getElementById('leaderboardContent');
    const loading = document.getElementById('leaderboardLoading');
    
    // Show loading
    content.style.display = 'none';
    loading.style.display = 'block';

    try {
      if (this.currentTab === 'global') {
        await this.loadGlobalLeaderboard();
      } else {
        await this.loadPersonalProgress();
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
          <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
          <div>Failed to load leaderboard data</div>
          <div style="font-size: 12px; margin-top: 10px; opacity: 0.7;">
            Please check your internet connection and try again
          </div>
        </div>
      `;
    }

    // Hide loading
    loading.style.display = 'none';
    content.style.display = 'block';
  }

  async loadGlobalLeaderboard() {
    const { data, error } = await getGlobalLeaderboard(this.currentLevel, 20);
    const content = document.getElementById('leaderboardContent');

    if (error || !data || data.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #95a5a6;">
          <div style="font-size: 48px; margin-bottom: 15px;">🏌️</div>
          <div>No scores yet for Hole ${this.currentLevel}</div>
          <div style="font-size: 12px; margin-top: 10px; opacity: 0.7;">
            Be the first to complete this level!
          </div>
        </div>
      `;
      return;
    }

    let leaderboardHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #3498db;">Hole ${this.currentLevel} - Top Players</h3>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    data.forEach((entry, index) => {
      const rank = index + 1;
      const displayName = entry.user_profiles?.display_name || 'Anonymous Player';
      const avatarUrl = entry.user_profiles?.avatar_url;
      
      // Determine rank styling
      let rankColor = '#95a5a6';
      let rankBg = 'rgba(255, 255, 255, 0.1)';
      if (rank === 1) {
        rankColor = '#f1c40f';
        rankBg = 'linear-gradient(45deg, #f1c40f, #f39c12)';
      } else if (rank === 2) {
        rankColor = '#95a5a6';
        rankBg = 'linear-gradient(45deg, #95a5a6, #7f8c8d)';
      } else if (rank === 3) {
        rankColor = '#cd7f32';
        rankBg = 'linear-gradient(45deg, #cd7f32, #b8860b)';
      }

      leaderboardHTML += `
        <div style="
          display: flex;
          align-items: center;
          padding: 12px;
          background: ${rank <= 3 ? rankBg : 'rgba(255, 255, 255, 0.05)'};
          border-radius: 8px;
          border-left: 3px solid ${rankColor};
          ${rank <= 3 ? 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);' : ''}
        ">
          <div style="
            width: 30px;
            height: 30px;
            background: ${rank <= 3 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: ${rank <= 3 ? 'white' : '#ecf0f1'};
            margin-right: 15px;
          ">
            ${rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : rank}
          </div>
          
          <div style="display: flex; align-items: center; flex: 1;">
            ${avatarUrl ? 
              `<img src="${avatarUrl}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 12px; border: 2px solid ${rankColor};">` :
              `<div style="width: 32px; height: 32px; border-radius: 50%; background: ${rankBg}; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; color: white;">${displayName.charAt(0).toUpperCase()}</div>`
            }
            <div>
              <div style="font-weight: 500; color: #ecf0f1;">${displayName}</div>
              <div style="font-size: 12px; color: #bdc3c7;">
                ${entry.best_score === 1 ? 'Hole-in-one!' : `${entry.best_score} strokes`}
              </div>
            </div>
          </div>
          
          <div style="text-align: right; color: ${rankColor}; font-weight: bold;">
            ${entry.best_score}
          </div>
        </div>
      `;
    });

    leaderboardHTML += '</div>';
    content.innerHTML = leaderboardHTML;
  }

  async loadPersonalProgress() {
    const { data, error } = await getAllUserScores();
    const content = document.getElementById('leaderboardContent');

    if (error) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
          <div style="font-size: 48px; margin-bottom: 15px;">🔒</div>
          <div>Sign in to track your progress</div>
          <div style="font-size: 12px; margin-top: 10px; opacity: 0.7;">
            Your personal statistics will appear here once you're logged in
          </div>
        </div>
      `;
      return;
    }

    if (!data || data.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #95a5a6;">
          <div style="font-size: 48px; margin-bottom: 15px;">🎯</div>
          <div>Start playing to see your progress</div>
          <div style="font-size: 12px; margin-top: 10px; opacity: 0.7;">
            Complete levels to track your personal records
          </div>
        </div>
      `;
      return;
    }

    // Calculate statistics
    const totalStrokes = data.reduce((sum, score) => sum + score.best_score, 0);
    const averageScore = (totalStrokes / data.length).toFixed(1);
    const bestLevel = data.reduce((best, current) => 
      current.best_score < best.best_score ? current : best
    );

    let personalHTML = `
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; color: #3498db;">Your Statistics</h3>
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        ">
          <div style="
            background: rgba(46, 204, 113, 0.2);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #2ecc71;
          ">
            <div style="font-size: 24px; font-weight: bold; color: #2ecc71;">${data.length}</div>
            <div style="font-size: 12px; color: #bdc3c7;">Levels Completed</div>
          </div>
          <div style="
            background: rgba(52, 152, 219, 0.2);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #3498db;
          ">
            <div style="font-size: 24px; font-weight: bold; color: #3498db;">${averageScore}</div>
            <div style="font-size: 12px; color: #bdc3c7;">Average Score</div>
          </div>
          <div style="
            background: rgba(241, 196, 15, 0.2);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #f1c40f;
          ">
            <div style="font-size: 24px; font-weight: bold; color: #f1c40f;">${bestLevel.best_score}</div>
            <div style="font-size: 12px; color: #bdc3c7;">Best Score (Hole ${bestLevel.level_id})</div>
          </div>
        </div>
      </div>

      <h4 style="margin: 0 0 15px 0; color: #ecf0f1;">Level Progress</h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    data.sort((a, b) => a.level_id - b.level_id).forEach(score => {
      const parValue = score.level_id <= 2 ? (score.level_id === 1 ? 3 : 4) : 3; // Default par values
      const isUnderPar = score.best_score < parValue;
      const isPar = score.best_score === parValue;
      
      let statusColor = '#e74c3c'; // Over par - red
      let statusText = `+${score.best_score - parValue}`;
      
      if (isUnderPar) {
        statusColor = '#27ae60'; // Under par - green
        statusText = `-${parValue - score.best_score}`;
      } else if (isPar) {
        statusColor = '#3498db'; // Par - blue
        statusText = 'PAR';
      }

      personalHTML += `
        <div style="
          display: flex;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border-left: 3px solid ${statusColor};
        ">
          <div style="flex: 1;">
            <div style="font-weight: 500; color: #ecf0f1;">Hole ${score.level_id}</div>
            <div style="font-size: 12px; color: #bdc3c7;">
              Par ${parValue} • Played ${score.total_attempts || 1} time${score.total_attempts === 1 ? '' : 's'}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: bold; color: ${statusColor};">
              ${score.best_score}
            </div>
            <div style="font-size: 11px; color: ${statusColor};">
              ${statusText}
            </div>
          </div>
        </div>
      `;
    });

    personalHTML += '</div>';
    content.innerHTML = personalHTML;
  }

  // Method to refresh leaderboard when new score is achieved
  async refresh() {
    if (this.isVisible) {
      await this.loadCurrentTabContent();
    }
  }
}