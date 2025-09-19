// src/uiIntegration.js
// This file integrates all the UI systems with your existing main.js

import { SettingsPanel } from './settings.js';
import { TutorialSystem } from './tutorial.js';
import { LevelSelector } from './levelSelector.js';
import { LeaderboardSystem } from './leaderboard.js';
import { EnhancedScoringDisplay } from './enhancedScoring.js';
import { MobileUIEnhancer } from './mobileUI.js';
import { TrajectoryVisualizer } from './trajectoryVisualizer.js';

export class UIManager {
  constructor(gameContext) {
    this.game = gameContext; // Reference to game systems
    this.systems = {};
    
    this.initializeSystems();
    this.setupIntegrations();
    this.bindGlobalEvents();
  }

  initializeSystems() {
    // Initialize all UI systems
    this.systems.settings = new SettingsPanel();
    this.systems.tutorial = new TutorialSystem();
    this.systems.levelSelector = new LevelSelector(
      this.game.levels,
      (levelIndex) => this.game.loadLevel(levelIndex),
      (levelId) => this.game.getBestScore(levelId)
    );
    this.systems.leaderboard = new LeaderboardSystem();
    this.systems.enhancedScoring = new EnhancedScoringDisplay();
    this.systems.mobileUI = new MobileUIEnhancer();
    this.systems.trajectory = new TrajectoryVisualizer(
      this.game.scene,
      this.game.ballPhysics
    );

    // Make systems globally available
    window.settingsPanel = this.systems.settings;
    window.tutorialSystem = this.systems.tutorial;
    window.levelSelector = this.systems.levelSelector;
    window.leaderboard = this.systems.leaderboard;
    window.uiManager = this;
  }

  setupIntegrations() {
    // Integrate settings with game systems
    this.integrateSettings();
    
    // Integrate enhanced scoring with game events
    this.integrateScoring();
    
    // Integrate trajectory visualization with aiming
    this.integrateTrajectoryVisualization();
    
    // Setup level selector integration
    this.integrateLevelSelector();
    
    // Setup mobile UI integration
    this.integrateMobileUI();
  }

  integrateSettings() {
    const settings = this.systems.settings;
    
    // Apply settings to game systems
    const gameSettings = settings.getSettings();
    
    // Apply graphics settings
    if (this.game.renderer) {
      const pixelRatio = gameSettings.graphicsQuality === 'high' ? 
        Math.min(window.devicePixelRatio, 2) : 
        gameSettings.graphicsQuality === 'medium' ? 1.5 : 1;
      this.game.renderer.setPixelRatio(pixelRatio);
    }

    // Apply trajectory visualization setting
    if (this.systems.trajectory) {
      this.systems.trajectory.setEnabled(gameSettings.showTrajectory);
    }

    // Apply camera speed settings
    if (this.game.controls) {
      this.game.controls.panSpeed = gameSettings.cameraSpeed;
      this.game.controls.rotateSpeed = gameSettings.cameraSpeed;
      this.game.controls.zoomSpeed = gameSettings.cameraSpeed;
    }

    // Apply audio settings
    if (this.game.audioContext) {
      this.game.audioContext.volume = gameSettings.audioVolume;
    }
  }

  integrateScoring() {
    const scoring = this.systems.enhancedScoring;
    
    // Replace existing UI update functions with enhanced versions
    window.updateHUDStroke = (strokes) => scoring.updateStrokes(strokes);
    window.updateHUDHole = (holeNum, par) => scoring.updateHoleInfo(holeNum, par);
    window.updatePowerUI = (power, maxPower) => scoring.updatePowerDisplay(power, maxPower);
    
    // Hook into hole completion
    const originalHandleHoleComplete = this.game.handleHoleComplete;
    this.game.handleHoleComplete = async (strokes) => {
      scoring.onHoleComplete(strokes);
      if (this.systems.leaderboard) {
        await this.systems.leaderboard.refresh();
      }
      if (this.systems.levelSelector) {
        await this.systems.levelSelector.refreshLevel(this.game.currentLevelInfo?.id);
      }
      return originalHandleHoleComplete.call(this.game, strokes);
    };
  }

  integrateTrajectoryVisualization() {
    const trajectory = this.systems.trajectory;
    
    // Hook into aiming system
    if (this.game.attachAimControls) {
      const originalAttachAimControls = this.game.attachAimControls;
      this.game.attachAimControls = (renderer, camera, ballMesh, ballPhysics, scene, opts = {}) => {
        // Add trajectory visualization to aiming
        const enhancedOpts = {
          ...opts,
          onAimMove: (ballPos, direction, power) => {
            trajectory.updateTrajectoryPreview(ballPos, direction, power);
          },
          onAimEnd: () => {
            trajectory.hideTrajectory();
            if (opts.onAimEnd) opts.onAimEnd();
          }
        };
        
        return originalAttachAimControls(renderer, camera, ballMesh, ballPhysics, scene, enhancedOpts);
      };
    }
  }

  integrateLevelSelector() {
    // Add level selector button to HUD
    const levelSelectorBtn = document.createElement('button');
    levelSelectorBtn.id = 'levelSelectorBtn';
    levelSelectorBtn.textContent = 'Levels';
    levelSelectorBtn.style.cssText = `
      position: fixed;
      bottom: 140px;
      right: 20px;
      padding: 10px 15px;
      background: linear-gradient(45deg, #34495e, #2c3e50);
      border: none;
      border-radius: 20px;
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      z-index: 50;
      box-shadow: 0 4px 15px rgba(52, 73, 94, 0.4);
      transition: all 0.3s ease;
    `;

    levelSelectorBtn.addEventListener('click', () => {
      this.systems.levelSelector.show();
    });

    // Add hover effect
    levelSelectorBtn.addEventListener('mouseenter', () => {
      levelSelectorBtn.style.transform = 'translateY(-2px)';
      levelSelectorBtn.style.boxShadow = '0 6px 20px rgba(52, 73, 94, 0.6)';
    });
    levelSelectorBtn.addEventListener('mouseleave', () => {
      levelSelectorBtn.style.transform = 'translateY(0)';
      levelSelectorBtn.style.boxShadow = '0 4px 15px rgba(52, 73, 94, 0.4)';
    });

    document.body.appendChild(levelSelectorBtn);
  }

  integrateMobileUI() {
    // Apply mobile-specific optimizations if on mobile device
    if (MobileUIEnhancer.isMobileDevice()) {
      const mobileSettings = this.systems.mobileUI.getMobileOptimalSettings();
      
      // Apply mobile optimizations to settings
      Object.assign(this.systems.settings.settings, mobileSettings);
      this.systems.settings.saveSettings();
    }
  }

  bindGlobalEvents() {
    // Update existing button handlers to use new systems
    this.updateExistingButtonHandlers();
    
    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Add accessibility features
    this.setupAccessibilityFeatures();
  }

  updateExistingButtonHandlers() {
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.removeEventListener('click', settingsBtn.onclick);
      settingsBtn.addEventListener('click', () => {
        this.systems.settings.show();
      });
    }

    // How-to-play button
    const howtoBtn = document.getElementById('howtoBtn');
    if (howtoBtn) {
      howtoBtn.removeEventListener('click', howtoBtn.onclick);
      howtoBtn.addEventListener('click', () => {
        this.systems.tutorial.show();
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key.toLowerCase()) {
        case 'h':
          this.systems.tutorial.show();
          break;
        case 's':
          this.systems.settings.show();
          break;
        case 'l':
          this.systems.levelSelector.show();
          break;
        case 'b':
          this.systems.leaderboard.show();
          break;
        case 'r':
          document.getElementById('resetBtn')?.click();
          break;
        case 'n':
          document.getElementById('nextBtn')?.click();
          break;
        case 'f':
          document.getElementById('followBtn')?.click();
          break;
        case 't':
          // Toggle trajectory visualization
          const current = this.systems.settings.getSettings().showTrajectory;
          this.systems.settings.settings.showTrajectory = !current;
          this.systems.trajectory.setEnabled(!current);
          break;
      }
    });
  }

  setupAccessibilityFeatures() {
    // Add ARIA labels to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      if (!btn.getAttribute('aria-label') && btn.textContent) {
        btn.setAttribute('aria-label', btn.textContent);
      }
    });

    // Add focus management
    this.setupFocusManagement();
    
    // Add screen reader announcements
    this.setupScreenReaderSupport();
  }

  setupFocusManagement() {
    // Trap focus in modals
    const modals = ['#settingsOverlay', '#tutorialOverlay', '#levelSelectorOverlay', '#leaderboardOverlay'];
    
    modals.forEach(selector => {
      const modal = document.querySelector(selector);
      if (modal) {
        modal.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            this.trapFocus(modal, e);
          }
        });
      }
    });
  }

  trapFocus(modal, event) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }

  setupScreenReaderSupport() {
    // Create screen reader announcement area
    const announcements = document.createElement('div');
    announcements.id = 'sr-announcements';
    announcements.setAttribute('aria-live', 'polite');
    announcements.setAttribute('aria-atomic', 'true');
    announcements.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcements);

    // Hook into game events for announcements
    this.setupGameAnnouncements();
  }

  setupGameAnnouncements() {
    const announce = (message) => {
      const announcements = document.getElementById('sr-announcements');
      if (announcements) {
        announcements.textContent = message;
      }
    };

    // Announce hole changes
    const originalUpdateHoleInfo = this.systems.enhancedScoring.updateHoleInfo;
    this.systems.enhancedScoring.updateHoleInfo = (holeNum, par) => {
      originalUpdateHoleInfo.call(this.systems.enhancedScoring, holeNum, par);
      announce(`Now playing hole ${holeNum}, par ${par}`);
    };

    // Announce hole completion
    const originalOnHoleComplete = this.systems.enhancedScoring.onHoleComplete;
    this.systems.enhancedScoring.onHoleComplete = (strokes) => {
      originalOnHoleComplete.call(this.systems.enhancedScoring, strokes);
      const par = this.systems.enhancedScoring.currentHoleStats.par;
      
      let announcement = `Hole completed in ${strokes} strokes. `;
      if (strokes === 1) {
        announcement += 'Hole in one!';
      } else if (strokes < par) {
        announcement += `${par - strokes} under par!`;
      } else if (strokes === par) {
        announcement += 'Par achieved!';
      } else {
        announcement += `${strokes - par} over par.`;
      }
      
      announce(announcement);
    };
  }

  // Method to show contextual hints based on game state
  showContextualHint(context) {
    switch (context) {
      case 'first-shot':
        if (MobileUIEnhancer.isMobileDevice()) {
          this.systems.tutorial.showContextualHint('Touch and drag from the ball to aim your shot');
        } else {
          this.systems.tutorial.showContextualHint('Hold SHIFT and drag to aim your shot');
        }
        break;
      case 'high-power':
        this.systems.tutorial.showContextualHint('Try using less power for better accuracy');
        break;
      case 'hole-complete':
        this.systems.tutorial.showContextualHint('Great shot! Ready for the next hole?');
        break;
    }
  }

  // Method to update all systems when game state changes
  onGameStateChange(state) {
    switch (state.type) {
      case 'level-loaded':
        this.systems.enhancedScoring.updateHoleInfo(state.levelId, state.par);
        this.systems.enhancedScoring.setPreviousBest(state.previousBest);
        this.systems.trajectory.showHoleTarget(state.holePosition, state.holeRadius);
        break;
      
      case 'ball-shot':
        this.systems.enhancedScoring.updateStrokes(state.strokes);
        break;
      
      case 'hole-completed':
        this.systems.enhancedScoring.onHoleComplete(state.strokes);
        this.systems.leaderboard.refresh();
        break;
      
      case 'settings-changed':
        this.integrateSettings();
        break;
    }
  }

  // Cleanup method
  dispose() {
    Object.values(this.systems).forEach(system => {
      if (system.dispose) {
        system.dispose();
      }
    });
  }
}

// Usage example for integration with existing main.js:
/*
// In your main.js, after initializing your game systems:

const gameContext = {
  scene,
  camera,
  renderer,
  controls,
  ballPhysics,
  levels,
  loadLevel: (levelIndex) => loadLevel(levelIndex),
  getBestScore: (levelId) => getBestScore(levelId),
  handleHoleComplete: (strokes) => handleHoleComplete(strokes),
  // ... other game references
};

// Initialize UI Manager
const uiManager = new UIManager(gameContext);

// Example of how to trigger contextual hints:
// uiManager.showContextualHint('first-shot');

// Example of how to notify UI of game state changes:
// uiManager.onGameStateChange({
//   type: 'level-loaded',
//   levelId: 1,
//   par: 3,
//   previousBest: bestScore,
//   holePosition: holePos,
//   holeRadius: 0.25
// });
*/