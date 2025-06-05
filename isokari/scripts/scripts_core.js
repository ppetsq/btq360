// ===== ISOKARI 360° CORE SYSTEM =====
// Global namespace and state management

window.ISOKARI = window.ISOKARI || {};

// ===== GLOBAL STATE =====
ISOKARI.State = {
    currentSection: 'intro',
    isTransitioning: false,
    audioEnabled: false,
    scenes: {
        intro: null,
        island: null,
        pilots: null
    },
    cameras: {
        intro: null,
        island: null,
        pilots: null
    },
    renderers: {
        intro: null,
        island: null,
        pilots: null
    },
    controllers: {
        intro: null,
        island: null,
        pilots: null
    },
    ambientAudio: null,
    initialized: {
        intro: false,
        island: false,
        pilots: false
    }
};

// ===== CORE APPLICATION CLASS =====
ISOKARI.App = class {
    constructor() {
        this.setupEventListeners();
        this.initializeAudio();
        this.checkHashNavigation();
        this.startApplication();

        // Clean up on page unload
        window.addEventListener('beforeunload', () => this.handlePageUnload());
        window.addEventListener('pagehide', () => this.handlePageUnload());
    }

    setupEventListeners() {
        // Menu navigation buttons
        document.getElementById('nav-to-island')?.addEventListener('click', () => {
            this.navigateToSection('island');
        });

        document.getElementById('nav-to-pilots')?.addEventListener('click', () => {
            this.navigateToSection('pilots');
        });

        // Back buttons
        document.getElementById('island-back-button')?.addEventListener('click', () => {
            this.navigateToSection('intro');
        });

        document.getElementById('pilots-back-button')?.addEventListener('click', () => {
            this.navigateToSection('intro');
        });

        // Cross-navigation buttons
        document.getElementById('island-to-pilots')?.addEventListener('click', () => {
            this.navigateToSection('pilots');
        });

        document.getElementById('pilots-to-island')?.addEventListener('click', () => {
            this.navigateToSection('island');
        });

        // Audio toggle
        document.getElementById('audio-toggle')?.addEventListener('click', () => {
            this.toggleAudio();
        });

        // BTQ360 buttons for all sections
        document.getElementById('menu-btq-button')?.addEventListener('click', () => {
            window.open('https://btq360.com', '_blank');
        });

        // Keyboard navigation
        document.addEventListener('keydown', (event) => {
            this.handleKeydown(event);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Prevent context menu on right click (better UX for 360° experiences)
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.viewer-container') || e.target.closest('.intro-viewer')) {
                e.preventDefault();
            }
        });
    }

    initializeAudio() {
        // Initialize ambient audio (replace with your audio file)
        ISOKARI.State.ambientAudio = new Audio('https://assets.360.petsq.works/isokari/birds.mp3');
        ISOKARI.State.ambientAudio.loop = true;
        ISOKARI.State.ambientAudio.volume = 0.3;
        
        // Handle audio load errors gracefully
        ISOKARI.State.ambientAudio.addEventListener('error', () => {
            console.warn('Ambient audio could not be loaded');
        });
    }

    async startApplication() {
        // CRITICAL: Set initial loading state immediately to prevent flash
        this.updateLoadingProgress(0, 'intro');
        
        // Initialize intro section
        await this.initializeSection('intro');
        
        // Hide loading overlay after intro is ready
        setTimeout(() => {
            this.hideLoadingOverlay();
        }, 1500);
    }

    async navigateToSection(targetSection) {
        if (ISOKARI.State.isTransitioning || ISOKARI.State.currentSection === targetSection) {
            return;
        }

        // Update URL hash
        if (targetSection === 'intro') {
            history.pushState(null, null, window.location.pathname);
        } else {
            history.pushState(null, null, `#${targetSection}`);
        }

        ISOKARI.State.isTransitioning = true;
        
        // Update loading text
        this.updateLoadingText(targetSection);
        this.showLoadingOverlay();

        // Hide current section
        const currentSectionEl = document.getElementById(`${ISOKARI.State.currentSection}-section`);
        currentSectionEl?.classList.remove('active');

        // CRITICAL: Dispose of current section to prevent memory leaks
        await this.disposeCurrentSection();

        // Wait for fade out
        await this.wait(300);

        // Initialize target section if needed
        await this.initializeSection(targetSection);

        // Show target section
        const targetSectionEl = document.getElementById(`${targetSection}-section`);
        targetSectionEl?.classList.add('active');

        // Hide loading overlay and show section-specific UI
        setTimeout(() => {
            this.hideLoadingOverlay();
            this.showSectionUI(targetSection);
            ISOKARI.State.isTransitioning = false;
        }, 800);

        ISOKARI.State.currentSection = targetSection;
    }

    // ⭐ NEW METHOD: Dispose current section
    async disposeCurrentSection() {
        const currentSection = ISOKARI.State.currentSection;
        const controller = ISOKARI.State.controllers[currentSection];
        const renderer = ISOKARI.State.renderers[currentSection];
        
        if (controller && typeof controller.dispose === 'function') {
            console.log(`Disposing ${currentSection} section to free memory`);
            
            // Stop any animations first
            if (typeof controller.stopAnimation === 'function') {
                controller.stopAnimation();
            }
            
            // CRITICAL: Force GPU memory cleanup BEFORE disposing controller
            if (renderer) {
                const gl = renderer.getContext();
                const info = renderer.info;
                
                console.log(`GPU Memory before disposal: ${info.memory.textures} textures, ${info.memory.geometries} geometries`);
                
                // Force WebGL context cleanup
                renderer.dispose();
                renderer.forceContextLoss();
                
                // Clear the canvas to release any remaining GPU resources
                const canvas = renderer.domElement;
                if (canvas && canvas.parentNode) {
                    canvas.width = 1;
                    canvas.height = 1;
                    const ctx = canvas.getContext('webgl') || canvas.getContext('webgl2');
                    if (ctx) {
                        ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
                    }
                }
            }
            
            // Dispose of Three.js resources
            controller.dispose();
            
            // Clear ALL references to break circular dependencies
            ISOKARI.State.controllers[currentSection] = null;
            ISOKARI.State.scenes[currentSection] = null;
            ISOKARI.State.cameras[currentSection] = null;
            ISOKARI.State.renderers[currentSection] = null;
            ISOKARI.State.initialized[currentSection] = false;
            
            // CRITICAL: Force garbage collection on mobile devices
            if (window.gc) {
                window.gc();
            } else {
                // Fallback: Create memory pressure to trigger GC
                const memoryPressure = new Array(1000000).fill(0);
                memoryPressure.length = 0;
            }
            
            // Wait a frame for cleanup to complete
            await new Promise(resolve => setTimeout(resolve, 16));
            
            console.log(`${currentSection} section fully disposed`);
        }
    }

    handlePageUnload() {
        // Dispose all sections when page unloads
        ['intro', 'island', 'pilots'].forEach(section => {
            const controller = ISOKARI.State.controllers[section];
            if (controller && typeof controller.dispose === 'function') {
                controller.dispose();
            }
        });
    }

    // ENHANCED LOADING METHODS
    updateLoadingProgress(percent, section = null, showPercentage = true) {
        const loadingText = document.getElementById('loading-text');
        const loadingPercentage = document.getElementById('loading-percentage');
        
        if (!loadingText) return;
        
        const sectionName = section || ISOKARI.State.currentSection;
        const sectionLabels = {
            intro: 'menu',
            island: 'island experience', 
            pilots: 'pilots house'
        };
        
        const label = sectionLabels[sectionName] || sectionName;
        
        // FIX: Always show the structured format to prevent flashing
        loadingText.textContent = `Loading ${label}...`;
        
        if (loadingPercentage && showPercentage && percent < 100) {
            loadingPercentage.textContent = `${percent}%`;
            loadingPercentage.classList.add('visible');
        } else if (loadingPercentage) {
            loadingPercentage.classList.remove('visible');
        }
    }

    // NEW: Show loading for image changes within viewers
    showImageLoading(message = 'Loading image...') {
        const loadingText = document.getElementById('loading-text');
        const loadingPercentage = document.getElementById('loading-percentage');
        
        if (loadingText) {
            loadingText.textContent = message;
        }
        if (loadingPercentage) {
            loadingPercentage.textContent = '';
            loadingPercentage.classList.remove('visible');
        }
        
        this.showLoadingOverlay();
    }

    // NEW: Update progress for image loading within viewers
    updateImageLoadingProgress(percent) {
        const loadingPercentage = document.getElementById('loading-percentage');
        
        if (loadingPercentage && percent < 100) {
            loadingPercentage.textContent = `${percent}%`;
            loadingPercentage.classList.add('visible');
        } else if (loadingPercentage) {
            loadingPercentage.classList.remove('visible');
        }
    }

    // NEW: Hide loading for image changes
    hideImageLoading() {
        const loadingPercentage = document.getElementById('loading-percentage');
        if (loadingPercentage) {
            loadingPercentage.classList.remove('visible');
        }
        this.hideLoadingOverlay();
    }

    // ENHANCED: Section initialization with progress
    async initializeSection(section) {
        if (ISOKARI.State.initialized[section]) {
            return;
        }

        // Show initial loading
        this.updateLoadingProgress(0, section);

        switch(section) {
            case 'intro':
                if (ISOKARI.MenuController) {
                    ISOKARI.State.controllers.intro = new ISOKARI.MenuController();
                    await ISOKARI.State.controllers.intro.initialize(this); // Pass app reference
                }
                break;
            case 'island':
                if (ISOKARI.IslandController) {
                    ISOKARI.State.controllers.island = new ISOKARI.IslandController();
                    await ISOKARI.State.controllers.island.initialize(this); // Pass app reference
                }
                break;
            case 'pilots':
                if (ISOKARI.PilotsController) {
                    ISOKARI.State.controllers.pilots = new ISOKARI.PilotsController();
                    await ISOKARI.State.controllers.pilots.initialize(this); // Pass app reference
                }
                break;
        }

        // Complete
        this.updateLoadingProgress(100, section);
        ISOKARI.State.initialized[section] = true;
    }

    // ===== HASH NAVIGATION SUPPORT =====
    checkHashNavigation() {
        const hash = window.location.hash;
        
        if (hash === '#island') {
            // Navigate directly to island experience
            setTimeout(() => {
                this.navigateToSection('island');
            }, 100);
        } else if (hash === '#pilots') {
            // Navigate directly to pilots experience  
            setTimeout(() => {
                this.navigateToSection('pilots');
            }, 100);
        }
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash;
            if (newHash === '#island') {
                this.navigateToSection('island');
            } else if (newHash === '#pilots') {
                this.navigateToSection('pilots');
            } else if (newHash === '' || newHash === '#') {
                this.navigateToSection('intro');
            }
        });
    }

    showSectionUI(section) {
        switch(section) {
            case 'island':
                setTimeout(() => {
                    document.getElementById('island-ui-panel')?.classList.add('visible');
                    document.getElementById('island-map-container')?.classList.add('visible');
                    
                    const islandToggle = document.getElementById('ui-toggle-button');
                    if (islandToggle) {
                        islandToggle.classList.add('panel-open');
                    }
                    
                    const islandBtq = document.getElementById('btq-button');
                    if (islandBtq) {
                        islandBtq.classList.add('hidden');
                    }
                    
                    // CRITICAL: Call the positioning AFTER UI is shown
                    if (ISOKARI.State.controllers.island && ISOKARI.State.controllers.island.handleInitialShow) {
                        setTimeout(() => {
                            ISOKARI.State.controllers.island.handleInitialShow();
                        }, 100);
                    }
                }, 500);
                break;
            case 'pilots':
                setTimeout(() => {
                    document.getElementById('pilots-ui-panel')?.classList.add('visible');
                    document.getElementById('pilots-house-container')?.classList.add('visible');
                    
                    // Properly set toggle button state for desktop (initial load fix)
                    const pilotsToggle = document.getElementById('pilots-ui-toggle-button');
                    if (pilotsToggle) {
                        pilotsToggle.classList.add('panel-open');
                    }
                    
                    // Hide BTQ button when UI is shown (desktop only)
                    const pilotsBtq = document.getElementById('pilots-btq-button');
                    if (pilotsBtq) {
                        pilotsBtq.classList.add('hidden');
                    }
                    
                    // Call the positioning AFTER UI is shown
                    if (ISOKARI.State.controllers.pilots && ISOKARI.State.controllers.pilots.handleInitialShow) {
                        setTimeout(() => {
                            ISOKARI.State.controllers.pilots.handleInitialShow();
                        }, 100);
                    }
                }, 500);
                break;
        }
    }

    updateLoadingText(targetSection) {
        const loadingText = document.getElementById('loading-text');
        const messages = {
            intro: 'Loading menu...',
            island: 'Loading island experience...',
            pilots: 'Loading old pilot house...'
        };
        if (loadingText) {
            loadingText.textContent = messages[targetSection] || 'Loading...';
        }
    }

    showLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        overlay?.classList.remove('hidden');
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        overlay?.classList.add('hidden');
    }

    toggleAudio() {
        ISOKARI.State.audioEnabled = !ISOKARI.State.audioEnabled;
        const audioButton = document.getElementById('audio-toggle');
        const audioIcon = document.getElementById('audio-icon');
        
        if (ISOKARI.State.audioEnabled) {
            audioButton?.classList.remove('muted');
            audioButton?.classList.add('playing');
            if (audioIcon) {
                audioIcon.src = 'assets/audio-on.png';
                audioIcon.classList.remove('muted');
                audioIcon.classList.add('playing');
            }
            audioButton.title = 'Mute Audio';
            
            // Start ambient audio
            if (ISOKARI.State.ambientAudio) {
                ISOKARI.State.ambientAudio.play().catch(e => {
                    console.warn('Audio autoplay prevented:', e);
                });
            }
        } else {
            audioButton?.classList.remove('playing');
            audioButton?.classList.add('muted');
            if (audioIcon) {
                audioIcon.src = 'assets/audio-off.png';
                audioIcon.classList.remove('playing');
                audioIcon.classList.add('muted');
            }
            audioButton.title = 'Unmute Audio';
            
            // Stop ambient audio
            if (ISOKARI.State.ambientAudio) {
                ISOKARI.State.ambientAudio.pause();
            }
        }
    }

    handleKeydown(event) {
        // Only handle keys if no modifier keys are pressed
        const hasModifiers = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
        
        if (!hasModifiers) {
            switch(event.code) {
                case 'Escape':
                    event.preventDefault();
                    this.navigateToSection('intro');
                    break;
                case 'Digit1':
                    event.preventDefault();
                    this.navigateToSection('island');
                    break;
                case 'Digit2':
                    event.preventDefault();
                    this.navigateToSection('pilots');
                    break;
                case 'KeyS':
                    event.preventDefault();
                    // Only switch between viewers, not from menu
                    if (ISOKARI.State.currentSection === 'island' || ISOKARI.State.currentSection === 'pilots') {
                        this.switchBetweenViewers();
                    }
                    break;
                case 'KeyM':
                    event.preventDefault();
                    this.toggleAudio();
                    break;
            }
        }
    }

    handleResize() {
        // Update all active renderers
        Object.entries(ISOKARI.State.renderers).forEach(([section, renderer]) => {
            if (renderer && ISOKARI.State.currentSection === section) {
                renderer.setSize(window.innerWidth, window.innerHeight);
                
                const camera = ISOKARI.State.cameras[section];
                if (camera) {
                    camera.aspect = window.innerWidth / window.innerHeight;
                    camera.updateProjectionMatrix();
                }
            }
        });
    }

    switchBetweenViewers() {
        if (ISOKARI.State.currentSection === 'island') {
            this.navigateToSection('pilots');
            console.log('Switched from Island to Pilots House');
        } else if (ISOKARI.State.currentSection === 'pilots') {
            this.navigateToSection('island');
            console.log('Switched from Pilots House to Island');
        }
        // Do nothing if in intro/menu section
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// ===== UTILITY FUNCTIONS =====
ISOKARI.Utils = {
    // Degrees to radians conversion
    degToRad: (degrees) => degrees * (Math.PI / 180),
    
    // Radians to degrees conversion
    radToDeg: (radians) => radians * (180 / Math.PI),
    
    // Clamp value between min and max
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    
    // Linear interpolation
    lerp: (start, end, factor) => start + (end - start) * factor,
    
    // Create a debounced function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Check if device is mobile
    isMobile: () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Check if device supports touch
    isTouch: () => {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    },
    
    // Dispose Three.js resources properly
    disposeThreeObject: (obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(material => {
                    if (material.map) material.map.dispose();
                    material.dispose();
                });
            } else {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
        }
        if (obj.texture) obj.texture.dispose();
    }
};

// ===== DOUBLE-TAP DETECTION UTILITY =====
ISOKARI.DoubleTapDetector = class {
    constructor(callback, delay = 300) {
        this.callback = callback;
        this.delay = delay;
        this.lastTap = 0;
        this.tapCount = 0;
        this.timeoutId = null;
    }

    handleTap() {
        const now = Date.now();
        this.tapCount++;

        if (this.tapCount === 1) {
            this.timeoutId = setTimeout(() => {
                this.reset();
            }, this.delay);
        } else if (this.tapCount === 2) {
            const timeDiff = now - this.lastTap;
            if (timeDiff < this.delay) {
                clearTimeout(this.timeoutId);
                this.callback();
                this.reset();
            } else {
                this.reset();
                this.tapCount = 1;
                this.timeoutId = setTimeout(() => {
                    this.reset();
                }, this.delay);
            }
        }

        this.lastTap = now;
    }

    reset() {
        this.tapCount = 0;
        this.lastTap = 0;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    destroy() {
        this.reset();
    }
};

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Could implement error reporting here
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Could implement error reporting here
});

// ===== PERFORMANCE MONITORING =====
if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('isokari-core-loaded');
}

console.log('ISOKARI Core System Loaded');