// src/tutorial.js
export class TutorialSystem {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.tutorialSteps = [
      {
        title: "Welcome to Minigolf Mania!",
        content: "Learn the basics to become a putting pro!",
        position: "center",
        highlight: null
      },
      {
        title: "Aiming Your Shot",
        content: "Hold SHIFT and drag from the ball to aim your shot. On mobile, just drag directly.",
        position: "bottom-left",
        highlight: "#c",
        action: "aim"
      },
      {
        title: "Power Control",
        content: "The further you drag, the more power your shot will have. Watch the power bar!",
        position: "top-left",
        highlight: "#powerbar",
        action: "power"
      },
      {
        title: "Camera Controls",
        content: "Use your mouse or finger to orbit around and inspect the course. Right-click and drag to pan.",
        position: "center",
        highlight: null,
        action: "camera"
      },
      {
        title: "The Goal",
        content: "Get your ball into the hole in as few strokes as possible. Each hole has a 'par' - the expected number of shots.",
        position: "bottom-right",
        highlight: "#hole, #par",
        action: null
      },
      {
        title: "Game Controls",
        content: "Use the HUD buttons to reset your ball, skip to the next hole, or toggle ball following mode.",
        position: "top-left",
        highlight: "#controls",
        action: null
      },
      {
        title: "Ready to Play!",
        content: "You're all set! Try to complete each hole in par or better. Good luck!",
        position: "center",
        highlight: null
      }
    ];
    
    this.createTutorialUI();
    this.bindEvents();
  }

  createTutorialUI() {
    const tutorialHTML = `
      <!-- Tutorial Overlay -->
      <div id="tutorialOverlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        z-index: 200;
        pointer-events: all;
      ">
        <!-- Spotlight effect -->
        <div id="tutorialSpotlight" style="
          position: absolute;
          border: 3px solid #3498db;
          border-radius: 8px;
          pointer-events: none;
          display: none;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8);
          transition: all 0.3s ease;
        "></div>

        <!-- Tutorial Card -->
        <div id="tutorialCard" style="
          position: absolute;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 16px;
          padding: 25px;
          max-width: 350px;
          color: white;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
            <div style="flex: 1;">
              <div id="tutorialStepCounter" style="
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 5px;
              ">Step 1 of 7</div>
              <h3 id="tutorialTitle" style="margin: 0; font-size: 18px;">Tutorial Title</h3>
            </div>
            <button id="closeTutorial" style="
              background: rgba(255, 255, 255, 0.2);
              border: none;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              color: white;
              cursor: pointer;
              font-size: 16px;
              margin-left: 15px;
            ">×</button>
          </div>

          <div id="tutorialContent" style="
            margin-bottom: 20px;
            line-height: 1.4;
            font-size: 14px;
          ">Tutorial content goes here</div>

          <!-- Interactive Demo Area -->
          <div id="tutorialDemo" style="
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            display: none;
            text-align: center;
          ">
            <div id="tutorialDemoContent"></div>
          </div>

          <!-- Navigation -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button id="tutorialPrev" style="
              padding: 8px 15px;
              background: rgba(255, 255, 255, 0.2);
              border: none;
              border-radius: 6px;
              color: white;
              cursor: pointer;
              font-size: 12px;
            ">← Previous</button>

            <div id="tutorialDots" style="display: flex; gap: 8px;"></div>

            <button id="tutorialNext" style="
              padding: 8px 15px;
              background: #27ae60;
              border: none;
              border-radius: 6px;
              color: white;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
            ">Next →</button>
          </div>
        </div>
      </div>

      <!-- Quick Help Button -->
      <button id="quickHelpBtn" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(45deg, #3498db, #2980b9);
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        z-index: 50;
        box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
        transition: all 0.3s ease;
      ">?</button>
    `;

    document.body.insertAdjacentHTML('beforeend', tutorialHTML);
    this.createProgressDots();
  }

  createProgressDots() {
    const dotsContainer = document.getElementById('tutorialDots');
    dotsContainer.innerHTML = '';
    
    for (let i = 0; i < this.tutorialSteps.length; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${i === this.currentStep ? '#3498db' : 'rgba(255, 255, 255, 0.3)'};
        transition: background 0.3s ease;
        cursor: pointer;
      `;
      dot.addEventListener('click', () => this.goToStep(i));
      dotsContainer.appendChild(dot);
    }
  }

  bindEvents() {
    // Navigation
    document.getElementById('tutorialNext').addEventListener('click', () => this.nextStep());
    document.getElementById('tutorialPrev').addEventListener('click', () => this.prevStep());
    document.getElementById('closeTutorial').addEventListener('click', () => this.hide());

    // Quick help button
    document.getElementById('quickHelpBtn').addEventListener('click', () => this.show());

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.hide();
      }
    });

    // Hover effect for help button
    const helpBtn = document.getElementById('quickHelpBtn');
    helpBtn.addEventListener('mouseenter', () => {
      helpBtn.style.transform = 'scale(1.1)';
      helpBtn.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.6)';
    });
    helpBtn.addEventListener('mouseleave', () => {
      helpBtn.style.transform = 'scale(1)';
      helpBtn.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.4)';
    });
  }

  show() {
    this.isActive = true;
    this.currentStep = 0;
    document.getElementById('tutorialOverlay').style.display = 'block';
    this.updateTutorialContent();
  }

  hide() {
    this.isActive = false;
    document.getElementById('tutorialOverlay').style.display = 'none';
    this.hideSpotlight();
  }

  nextStep() {
    if (this.currentStep < this.tutorialSteps.length - 1) {
      this.currentStep++;
      this.updateTutorialContent();
    } else {
      this.hide();
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateTutorialContent();
    }
  }

  goToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.tutorialSteps.length) {
      this.currentStep = stepIndex;
      this.updateTutorialContent();
    }
  }

  updateTutorialContent() {
    const step = this.tutorialSteps[this.currentStep];
    
    // Update content
    document.getElementById('tutorialStepCounter').textContent = 
      `Step ${this.currentStep + 1} of ${this.tutorialSteps.length}`;
    document.getElementById('tutorialTitle').textContent = step.title;
    document.getElementById('tutorialContent').textContent = step.content;

    // Update navigation buttons
    const prevBtn = document.getElementById('tutorialPrev');
    const nextBtn = document.getElementById('tutorialNext');
    
    prevBtn.style.opacity = this.currentStep === 0 ? '0.5' : '1';
    prevBtn.disabled = this.currentStep === 0;
    
    nextBtn.textContent = this.currentStep === this.tutorialSteps.length - 1 ? 'Finish' : 'Next →';

    // Update progress dots
    this.createProgressDots();

    // Position card and handle highlighting
    this.positionTutorialCard(step.position);
    
    if (step.highlight) {
      this.highlightElements(step.highlight);
    } else {
      this.hideSpotlight();
    }

    // Handle interactive demos
    this.setupInteractiveDemo(step);
  }

  positionTutorialCard(position) {
    const card = document.getElementById('tutorialCard');
    const cardRect = card.getBoundingClientRect();
    
    // Reset positioning
    card.style.top = '';
    card.style.bottom = '';
    card.style.left = '';
    card.style.right = '';
    card.style.transform = '';

    switch (position) {
      case 'center':
        card.style.top = '50%';
        card.style.left = '50%';
        card.style.transform = 'translate(-50%, -50%)';
        break;
      case 'top-left':
        card.style.top = '20px';
        card.style.left = '20px';
        break;
      case 'top-right':
        card.style.top = '20px';
        card.style.right = '20px';
        break;
      case 'bottom-left':
        card.style.bottom = '20px';
        card.style.left = '20px';
        break;
      case 'bottom-right':
        card.style.bottom = '20px';
        card.style.right = '20px';
        break;
    }
  }

  highlightElements(selector) {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;

    const spotlight = document.getElementById('tutorialSpotlight');
    const firstElement = elements[0];
    const rect = firstElement.getBoundingClientRect();

    spotlight.style.display = 'block';
    spotlight.style.left = (rect.left - 10) + 'px';
    spotlight.style.top = (rect.top - 10) + 'px';
    spotlight.style.width = (rect.width + 20) + 'px';
    spotlight.style.height = (rect.height + 20) + 'px';
  }

  hideSpotlight() {
    document.getElementById('tutorialSpotlight').style.display = 'none';
  }

  setupInteractiveDemo(step) {
    const demoContainer = document.getElementById('tutorialDemo');
    const demoContent = document.getElementById('tutorialDemoContent');

    if (!step.action) {
      demoContainer.style.display = 'none';
      return;
    }

    demoContainer.style.display = 'block';

    switch (step.action) {
      case 'aim':
        demoContent.innerHTML = `
          <div style="color: #3498db; margin-bottom: 10px;">Try It:</div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <div style="font-size: 12px;">Hold SHIFT + Drag</div>
            <div style="font-size: 20px;">🖱️</div>
            <div style="font-size: 12px;">to aim</div>
          </div>
        `;
        break;
      case 'power':
        demoContent.innerHTML = `
          <div style="color: #e74c3c; margin-bottom: 10px;">Power Meter:</div>
          <div style="background: #34495e; height: 8px; border-radius: 4px; position: relative;">
            <div style="background: linear-gradient(90deg, #27ae60, #f39c12, #e74c3c); height: 100%; width: 70%; border-radius: 4px; animation: pulse 1s infinite;"></div>
          </div>
          <div style="font-size: 11px; margin-top: 5px;">Longer drag = More power</div>
        `;
        break;
      case 'camera':
        demoContent.innerHTML = `
          <div style="display: flex; justify-content: space-around; font-size: 11px;">
            <div>🖱️ Left: Orbit</div>
            <div>🖱️ Right: Pan</div>
            <div>🖱️ Scroll: Zoom</div>
          </div>
        `;
        break;
    }
  }

  // Method to trigger tutorial from game events
  showContextualHint(hintType) {
    const hints = {
      'first-shot': "Remember to hold SHIFT while dragging to aim your shot!",
      'high-power': "Try using less power for better accuracy.",
      'multiple-strokes': "Don't worry! Practice makes perfect. Try to read the green before shooting.",
      'hole-complete': "Great job! Ready for the next challenge?"
    };

    if (hints[hintType]) {
      this.showQuickHint(hints[hintType]);
    }
  }

  showQuickHint(message) {
    // Create temporary hint bubble
    const hint = document.createElement('div');
    hint.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: linear-gradient(45deg, #3498db, #2980b9);
      color: white;
      padding: 10px 15px;
      border-radius: 20px;
      font-size: 12px;
      z-index: 100;
      max-width: 200px;
      animation: slideInUp 0.3s ease;
      box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
    `;
    hint.textContent = message;
    
    document.body.appendChild(hint);
    
    setTimeout(() => {
      hint.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => hint.remove(), 300);
    }, 3000);
  }
}