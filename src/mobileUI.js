// src/mobileUI.js
export class MobileUIEnhancer {
  constructor() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isTablet = this.isMobile && window.innerWidth > 768;
    this.touchStartPos = null;
    this.isGestureActive = false;
    
    if (this.isMobile) {
      this.initMobileEnhancements();
    }
  }

  initMobileEnhancements() {
    this.createMobileHUD();
    this.setupTouchGestures();
    this.createMobileControlPad();
    this.addMobileSpecificStyles();
    this.handleOrientationChange();
  }

  createMobileHUD() {
    // Mobile-optimized HUD layout
    const existingHUD = document.getElementById('enhancedHUD');
    if (existingHUD) {
      existingHUD.style.cssText += `
        position: fixed;
        left: 8px;
        top: 8px;
        right: 8px;
        max-width: none;
        padding: 12px;
        font-size: 13px;
        backdrop-filter: blur(8px);
        background: linear-gradient(135deg, rgba(43, 132, 177, 0.8), rgba(20, 78, 117, 0.85));
      `;

      // Adjust grid layout for mobile
      const holeGrid = existingHUD.querySelector('[style*="grid-template-columns"]');
      if (holeGrid) {
        holeGrid.style.gridTemplateColumns = '1fr 1fr 1fr';
        holeGrid.style.gap = '8px';
      }

      // Make buttons touch-friendly
      const buttons = existingHUD.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.style.minHeight = '44px';
        btn.style.fontSize = '12px';
        btn.style.padding = '8px 12px';
      });
    }

    // Create mobile-specific floating controls
    const mobileControlsHTML = `
      <div id="mobileControls" style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 12px;
        z-index: 100;
        ${this.isMobile ? '' : 'display: none;'}
      ">
        <button id="mobileCameraBtn" style="
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3498db, #2980b9);
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">📹</button>
        
        <button id="mobileAimBtn" style="
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(45deg, #e74c3c, #c0392b);
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">🎯</button>
        
        <button id="mobileMenuBtn" style="
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(45deg, #27ae60, #229954);
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">☰</button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', mobileControlsHTML);
    this.bindMobileControlEvents();
  }

  createMobileControlPad() {
    const controlPadHTML = `
      <div id="mobileControlPad" style="
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle, rgba(52, 152, 219, 0.8) 0%, rgba(52, 152, 219, 0.4) 70%);
        border-radius: 50%;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 90;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.3);
        touch-action: none;
      ">
        <!-- Center dot -->
        <div style="
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          opacity: 0.8;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        "></div>
        
        <!-- Direction indicators -->
        <div style="
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-size: 12px;
          opacity: 0.6;
        ">↑</div>
        <div style="
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-size: 12px;
          opacity: 0.6;
        ">↓</div>
        <div style="
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: white;
          font-size: 12px;
          opacity: 0.6;
        ">←</div>
        <div style="
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: white;
          font-size: 12px;
          opacity: 0.6;
        ">→</div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', controlPadHTML);
    this.setupControlPadEvents();
  }

  bindMobileControlEvents() {
    // Camera toggle
    document.getElementById('mobileCameraBtn').addEventListener('click', () => {
      const controlPad = document.getElementById('mobileControlPad');
      if (controlPad.style.display === 'none' || !controlPad.style.display) {
        controlPad.style.display = 'flex';
        this.showTemporaryHint('Use the control pad to adjust camera');
      } else {
        controlPad.style.display = 'none';
      }
    });

    // Aim mode toggle
    document.getElementById('mobileAimBtn').addEventListener('click', () => {
      this.toggleAimMode();
    });

    // Mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
      this.showMobileMenu();
    });

    // Add touch feedback
    ['mobileCameraBtn', 'mobileAimBtn', 'mobileMenuBtn'].forEach(id => {
      const btn = document.getElementById(id);
      btn.addEventListener('touchstart', (e) => {
        btn.style.transform = 'scale(0.95)';
        btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      });
      btn.addEventListener('touchend', (e) => {
        setTimeout(() => {
          btn.style.transform = 'scale(1)';
          btn.style.boxShadow = btn.id === 'mobileCameraBtn' ? 
            '0 4px 15px rgba(52, 152, 219, 0.4)' :
            btn.id === 'mobileAimBtn' ?
            '0 4px 15px rgba(231, 76, 60, 0.4)' :
            '0 4px 15px rgba(39, 174, 96, 0.4)';
        }, 100);
      });
    });
  }

  setupControlPadEvents() {
    const controlPad = document.getElementById('mobileControlPad');
    let isDragging = false;
    let startPos = { x: 0, y: 0 };

    controlPad.addEventListener('touchstart', (e) => {
      isDragging = true;
      const rect = controlPad.getBoundingClientRect();
      startPos.x = e.touches[0].clientX - rect.left - rect.width / 2;
      startPos.y = e.touches[0].clientY - rect.top - rect.height / 2;
      e.preventDefault();
    });

    controlPad.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const rect = controlPad.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const currentX = e.touches[0].clientX - rect.left - centerX;
      const currentY = e.touches[0].clientY - rect.top - centerY;
      
      // Calculate camera movement based on touch position
      const deltaX = (currentX - startPos.x) * 0.01;
      const deltaY = (currentY - startPos.y) * 0.01;
      
      // Apply camera rotation if camera controls are available
      if (window.controls) {
        window.controls.object.position.x += deltaX;
        window.controls.object.position.z += deltaY;
        window.controls.update();
      }
      
      e.preventDefault();
    });

    controlPad.addEventListener('touchend', (e) => {
      isDragging = false;
      e.preventDefault();
    });
  }

  setupTouchGestures() {
    let lastTouchTime = 0;
    let touchCount = 0;

    document.addEventListener('touchstart', (e) => {
      const currentTime = Date.now();
      if (currentTime - lastTouchTime < 300) {
        touchCount++;
      } else {
        touchCount = 1;
      }
      lastTouchTime = currentTime;

      // Double tap to reset camera
      if (touchCount === 2) {
        this.resetCameraPosition();
        touchCount = 0;
      }
    });

    // Pinch to zoom gesture
    let initialDistance = 0;
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && window.controls) {
        const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        
        // Apply zoom
        const camera = window.controls.object;
        const newY = Math.max(2, Math.min(20, camera.position.y * (2 - scale)));
        camera.position.y = newY;
        window.controls.update();
        
        initialDistance = currentDistance;
        e.preventDefault();
      }
    });
  }

  getDistance(touch1, touch2) {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }

  toggleAimMode() {
    // Toggle aiming assistance mode
    const aimBtn = document.getElementById('mobileAimBtn');
    const isActive = aimBtn.classList.contains('active');
    
    if (isActive) {
      aimBtn.classList.remove('active');
      aimBtn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
      this.showTemporaryHint('Aim assist disabled');
    } else {
      aimBtn.classList.add('active');
      aimBtn.style.background = 'linear-gradient(45deg, #27ae60, #229954)';
      this.showTemporaryHint('Aim assist enabled - tap and drag from ball');
    }
  }

  showMobileMenu() {
    const menuHTML = `
      <div id="mobileMenuOverlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 200;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: linear-gradient(135deg, #34495e, #2c3e50);
          border-radius: 20px;
          padding: 30px;
          width: 80%;
          max-width: 300px;
          color: white;
          text-align: center;
        ">
          <h3 style="margin: 0 0 20px 0;">Game Menu</h3>
          
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <button id="mobileResetBtn" style="
              padding: 15px;
              background: #95a5a6;
              border: none;
              border-radius: 10px;
              color: white;
              font-size: 16px;
              cursor: pointer;
            ">Reset Ball</button>
            
            <button id="mobileNextBtn" style="
              padding: 15px;
              background: #3498db;
              border: none;
              border-radius: 10px;
              color: white;
              font-size: 16px;
              cursor: pointer;
            ">Next Hole</button>
            
            <button id="mobileSettingsBtn" style="
              padding: 15px;
              background: #9b59b6;
              border: none;
              border-radius: 10px;
              color: white;
              font-size: 16px;
              cursor: pointer;
            ">Settings</button>
            
            <button id="mobileCloseMenu" style="
              padding: 15px;
              background: #e74c3c;
              border: none;
              border-radius: 10px;
              color: white;
              font-size: 16px;
              cursor: pointer;
            ">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', menuHTML);

    // Bind menu events
    document.getElementById('mobileResetBtn').addEventListener('click', () => {
      document.getElementById('resetBtn')?.click();
      this.closeMobileMenu();
    });

    document.getElementById('mobileNextBtn').addEventListener('click', () => {
      document.getElementById('nextBtn')?.click();
      this.closeMobileMenu();
    });

    document.getElementById('mobileSettingsBtn').addEventListener('click', () => {
      if (window.settingsPanel) window.settingsPanel.show();
      this.closeMobileMenu();
    });

    document.getElementById('mobileCloseMenu').addEventListener('click', () => {
      this.closeMobileMenu();
    });

    document.getElementById('mobileMenuOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'mobileMenuOverlay') {
        this.closeMobileMenu();
      }
    });
  }

  closeMobileMenu() {
    const menu = document.getElementById('mobileMenuOverlay');
    if (menu) menu.remove();
  }

  addMobileSpecificStyles() {
    const mobileCSS = `
      <style id="mobileStyles">
        @media (max-width: 768px) {
          /* Make all interactive elements touch-friendly */
          button, input, select {
            min-height: 44px !important;
            min-width: 44px !important;
          }

          /* Adjust font sizes for mobile */
          #enhancedHUD {
            font-size: 12px !important;
          }

          /* Hide desktop-only elements */
          #hint {
            display: none !important;
          }

          /* Optimize power bar for mobile */
          #powerbar {
            height: 16px !important;
          }

          /* Make buttons more prominent */
          #controls button {
            font-size: 13px !important;
            font-weight: 600 !important;
          }

          /* Adjust canvas for mobile viewport */
          #c {
            height: 100vh !important;
            height: 100dvh !important;
          }
        }

        @media (max-width: 480px) {
          #enhancedHUD {
            left: 5px !important;
            right: 5px !important;
            top: 5px !important;
            padding: 10px !important;
          }
          
          #mobileControls {
            bottom: 15px !important;
          }
          
          #mobileControls button {
            width: 48px !important;
            height: 48px !important;
            font-size: 16px !important;
          }
        }

        /* Orientation-specific styles */
        @media (orientation: landscape) and (max-width: 768px) {
          #enhancedHUD {
            max-height: 70vh;
            overflow-y: auto;
          }
        }

        /* Touch feedback animations */
        .touch-feedback {
          animation: touchPulse 0.2s ease;
        }

        @keyframes touchPulse {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', mobileCSS);
  }

  handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        // Adjust HUD layout after orientation change
        const hud = document.getElementById('enhancedHUD');
        if (hud && this.isMobile) {
          if (window.innerHeight < window.innerWidth) {
            // Landscape mode
            hud.style.maxHeight = '60vh';
            hud.style.overflowY = 'auto';
          } else {
            // Portrait mode
            hud.style.maxHeight = 'none';
            hud.style.overflowY = 'visible';
          }
        }
      }, 500);
    });
  }

  resetCameraPosition() {
    if (window.controls && window.camera) {
      // Reset to default camera position
      window.camera.position.set(0, 6, 10);
      window.controls.target.set(0, 0.2, 0);
      window.controls.update();
      this.showTemporaryHint('Camera reset');
    }
  }

  showTemporaryHint(message) {
    const hint = document.createElement('div');
    hint.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px 20px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 1000;
      pointer-events: none;
      animation: fadeInOut 2s ease forwards;
    `;
    hint.textContent = message;
    document.body.appendChild(hint);

    setTimeout(() => hint.remove(), 2000);
  }

  // Method to check if device is mobile
  static isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Method to get optimal settings for mobile
  getMobileOptimalSettings() {
    return {
      graphicsQuality: this.isTablet ? 'medium' : 'low',
      showTrajectory: true,
      cameraSpeed: 0.8,
      audioVolume: 0.6,
      sfxVolume: 0.7
    };
  }
}