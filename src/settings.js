// src/settings.js
export class SettingsPanel {
  constructor() {
    this.settings = {
      audioVolume: 0.7,
      sfxVolume: 0.8,
      graphicsQuality: 'high', // high, medium, low
      showTrajectory: true,
      cameraSpeed: 1.0,
      fullscreen: false,
      colorBlindMode: false,
      highContrast: false
    };
    
    this.loadSettings();
    this.createSettingsUI();
    this.bindEvents();
  }

  loadSettings() {
    const saved = localStorage.getItem('minigolf_settings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  saveSettings() {
    localStorage.setItem('minigolf_settings', JSON.stringify(this.settings));
    this.applySettings();
  }

  createSettingsUI() {
    const settingsHTML = `
      <div id="settingsOverlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 100;
      ">
        <div class="settings-panel" style="
          background: linear-gradient(135deg, #2c3e50, #34495e);
          border-radius: 20px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          color: white;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #ecf0f1;">Game Settings</h2>
            <button id="closeSettings" style="
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

          <!-- Audio Settings -->
          <div class="settings-section">
            <h3 style="color: #3498db; margin-bottom: 15px;">Audio</h3>
            
            <div class="setting-item" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px;">Master Volume</label>
              <div style="display: flex; align-items: center; gap: 10px;">
                <input type="range" id="audioVolume" min="0" max="1" step="0.1" 
                       value="${this.settings.audioVolume}" style="flex: 1;">
                <span id="audioVolumeValue" style="min-width: 40px;">${Math.round(this.settings.audioVolume * 100)}%</span>
              </div>
            </div>

            <div class="setting-item" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px;">Sound Effects</label>
              <div style="display: flex; align-items: center; gap: 10px;">
                <input type="range" id="sfxVolume" min="0" max="1" step="0.1" 
                       value="${this.settings.sfxVolume}" style="flex: 1;">
                <span id="sfxVolumeValue" style="min-width: 40px;">${Math.round(this.settings.sfxVolume * 100)}%</span>
              </div>
            </div>
          </div>

          <!-- Graphics Settings -->
          <div class="settings-section">
            <h3 style="color: #3498db; margin-bottom: 15px;">Graphics</h3>
            
            <div class="setting-item" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px;">Graphics Quality</label>
              <select id="graphicsQuality" style="
                width: 100%;
                padding: 8px;
                border-radius: 5px;
                border: none;
                background: #34495e;
                color: white;
              ">
                <option value="high" ${this.settings.graphicsQuality === 'high' ? 'selected' : ''}>High</option>
                <option value="medium" ${this.settings.graphicsQuality === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="low" ${this.settings.graphicsQuality === 'low' ? 'selected' : ''}>Low</option>
              </select>
            </div>

            <div class="setting-item" style="margin-bottom: 15px;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="showTrajectory" ${this.settings.showTrajectory ? 'checked' : ''} 
                       style="margin-right: 10px;">
                Show Shot Trajectory
              </label>
            </div>

            <div class="setting-item" style="margin-bottom: 15px;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="fullscreen" ${this.settings.fullscreen ? 'checked' : ''} 
                       style="margin-right: 10px;">
                Fullscreen Mode
              </label>
            </div>
          </div>

          <!-- Gameplay Settings -->
          <div class="settings-section">
            <h3 style="color: #3498db; margin-bottom: 15px;">Gameplay</h3>
            
            <div class="setting-item" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px;">Camera Speed</label>
              <div style="display: flex; align-items: center; gap: 10px;">
                <input type="range" id="cameraSpeed" min="0.3" max="2" step="0.1" 
                       value="${this.settings.cameraSpeed}" style="flex: 1;">
                <span id="cameraSpeedValue" style="min-width: 40px;">${this.settings.cameraSpeed}x</span>
              </div>
            </div>
          </div>

          <!-- Accessibility Settings -->
          <div class="settings-section">
            <h3 style="color: #3498db; margin-bottom: 15px;">Accessibility</h3>
            
            <div class="setting-item" style="margin-bottom: 15px;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="colorBlindMode" ${this.settings.colorBlindMode ? 'checked' : ''} 
                       style="margin-right: 10px;">
                Colorblind Friendly Mode
              </label>
            </div>

            <div class="setting-item" style="margin-bottom: 15px;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="highContrast" ${this.settings.highContrast ? 'checked' : ''} 
                       style="margin-right: 10px;">
                High Contrast Mode
              </label>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 10px; margin-top: 25px;">
            <button id="resetSettings" style="
              flex: 1;
              padding: 12px;
              background: #95a5a6;
              border: none;
              border-radius: 8px;
              color: white;
              cursor: pointer;
              font-weight: 500;
            ">Reset to Default</button>
            <button id="saveSettings" style="
              flex: 1;
              padding: 12px;
              background: #27ae60;
              border: none;
              border-radius: 8px;
              color: white;
              cursor: pointer;
              font-weight: 500;
            ">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', settingsHTML);
  }

  bindEvents() {
    // Close settings
    document.getElementById('closeSettings').addEventListener('click', () => this.hide());

    // Volume sliders
    const audioSlider = document.getElementById('audioVolume');
    const audioValue = document.getElementById('audioVolumeValue');
    audioSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.settings.audioVolume = value;
      audioValue.textContent = `${Math.round(value * 100)}%`;
    });

    const sfxSlider = document.getElementById('sfxVolume');
    const sfxValue = document.getElementById('sfxVolumeValue');
    sfxSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.settings.sfxVolume = value;
      sfxValue.textContent = `${Math.round(value * 100)}%`;
    });

    // Camera speed
    const cameraSlider = document.getElementById('cameraSpeed');
    const cameraValue = document.getElementById('cameraSpeedValue');
    cameraSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.settings.cameraSpeed = value;
      cameraValue.textContent = `${value}x`;
    });

    // Graphics quality
    document.getElementById('graphicsQuality').addEventListener('change', (e) => {
      this.settings.graphicsQuality = e.target.value;
    });

    // Checkboxes
    ['showTrajectory', 'fullscreen', 'colorBlindMode', 'highContrast'].forEach(setting => {
      document.getElementById(setting).addEventListener('change', (e) => {
        this.settings[setting] = e.target.checked;
      });
    });

    // Buttons
    document.getElementById('resetSettings').addEventListener('click', () => this.resetToDefault());
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
      this.hide();
    });

    // Close on outside click
    document.getElementById('settingsOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'settingsOverlay') this.hide();
    });
  }

  show() {
    document.getElementById('settingsOverlay').style.display = 'flex';
  }

  hide() {
    document.getElementById('settingsOverlay').style.display = 'none';
  }

  resetToDefault() {
    this.settings = {
      audioVolume: 0.7,
      sfxVolume: 0.8,
      graphicsQuality: 'high',
      showTrajectory: true,
      cameraSpeed: 1.0,
      fullscreen: false,
      colorBlindMode: false,
      highContrast: false
    };
    
    // Update UI
    document.getElementById('audioVolume').value = this.settings.audioVolume;
    document.getElementById('audioVolumeValue').textContent = `${Math.round(this.settings.audioVolume * 100)}%`;
    document.getElementById('sfxVolume').value = this.settings.sfxVolume;
    document.getElementById('sfxVolumeValue').textContent = `${Math.round(this.settings.sfxVolume * 100)}%`;
    document.getElementById('cameraSpeed').value = this.settings.cameraSpeed;
    document.getElementById('cameraSpeedValue').textContent = `${this.settings.cameraSpeed}x`;
    document.getElementById('graphicsQuality').value = this.settings.graphicsQuality;
    document.getElementById('showTrajectory').checked = this.settings.showTrajectory;
    document.getElementById('fullscreen').checked = this.settings.fullscreen;
    document.getElementById('colorBlindMode').checked = this.settings.colorBlindMode;
    document.getElementById('highContrast').checked = this.settings.highContrast;
  }

  applySettings() {
    // Apply graphics quality
    if (window.renderer) {
      const pixelRatio = this.settings.graphicsQuality === 'high' ? 
        Math.min(window.devicePixelRatio, 2) : 
        this.settings.graphicsQuality === 'medium' ? 1.5 : 1;
      window.renderer.setPixelRatio(pixelRatio);
    }

    // Apply accessibility
    if (this.settings.colorBlindMode) {
      document.body.classList.add('colorblind-mode');
    } else {
      document.body.classList.remove('colorblind-mode');
    }

    if (this.settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Apply fullscreen
    if (this.settings.fullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  getSettings() {
    return this.settings;
  }
}