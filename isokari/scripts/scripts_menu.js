// ===== MENU/INTRO CONTROLLER - WITH PARALLAX & INFO BUTTON =====
// Enhanced version with subtle parallax effects and info panel

ISOKARI.MenuController = class {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.videoMesh = null;
        this.video = null;
        this.isUserInteracting = false;
        this.autoRotateEnabled = true;
        
        // Interaction variables with initial positions
        this.lon = -80; // Start facing slightly left
        this.lat = 70;   // Start looking slightly up
        this.onPointerDownLon = 0;
        this.onPointerDownLat = 0;
        this.onPointerDownMouseX = 0;
        this.onPointerDownMouseY = 0;
        
        // Zoom variables with initial zoom
        this.currentZoom = 105; // Slightly closer than default
        this.minZoom = 50;
        this.maxZoom = 120;
        this.zoomSensitivity = 2;
        
        // Touch variables
        this.touchDistance = 0;
        this.prevTouchDistance = 0;
        
        // Animation settings
        this.autoRotateSpeed = 0.0005;
        this.dragSensitivity = 0.15;
        
        // Animation frame ID
        this.animationId = null;
        
        // Parallax variables
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.parallaxEnabled = true;
        
        // Info panel state
        this.infoPanelVisible = false;
    }

    async initialize(app = null) {
        this.app = app; // Store reference for progress updates
        
        try {
            const container = document.getElementById('intro-viewer');
            if (!container) {
                throw new Error('Intro viewer container not found');
            }
    
            if (this.app) this.app.updateLoadingProgress(20, 'intro');
            
            await this.createScene(container);
            
            if (this.app) this.app.updateLoadingProgress(40, 'intro');
            
            await this.loadVideo();
            
            if (this.app) this.app.updateLoadingProgress(80, 'intro');
            
            this.setupControls(container);
            this.setupParallaxEffects();
            this.setupInfoButton();
            this.startAnimation();
    
            // Complete
            if (this.app) this.app.updateLoadingProgress(100, 'intro');
    
            // Store in global state
            ISOKARI.State.scenes.intro = this.scene;
            ISOKARI.State.cameras.intro = this.camera;
            ISOKARI.State.renderers.intro = this.renderer;
    
            console.log('Menu controller initialized');
        } catch (error) {
            console.error('Error initializing menu controller:', error);
            this.createFallbackBackground();
        }
    }

    async createScene(container) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            this.currentZoom,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false 
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        container.appendChild(this.renderer.domElement);
    }

    async loadVideo() {
        return new Promise((resolve, reject) => {
            this.video = document.createElement('video');
            this.video.src = 'https://assets.360.petsq.works/isokari/menu_long.mp4';
            this.video.crossOrigin = 'anonymous';
            this.video.loop = true;
            this.video.muted = true;
            this.video.playsInline = true;
            this.video.preload = 'auto';
    
            // Simple progress simulation for video
            let progressStep = 40;
            const progressInterval = setInterval(() => {
                if (this.app && progressStep < 75) {
                    this.app.updateLoadingProgress(progressStep, 'intro');
                    progressStep += 5;
                }
            }, 200);
    
            this.video.addEventListener('loadeddata', () => {
                clearInterval(progressInterval);
                if (this.app) this.app.updateLoadingProgress(75, 'intro');
                
                console.log('📹 Video loaded successfully');
                this.createVideoMesh();
                resolve();
            });
    
            this.video.addEventListener('error', (e) => {
                clearInterval(progressInterval);
                console.error('Video loading error:', e);
                
                // Only check if scene exists (allow fallback on re-initialization)
                if (this.scene) {
                    this.createFallbackBackground();
                } else {
                    console.log('No scene available for fallback');
                }
                
                resolve(); // Always resolve to continue initialization
            });
    
            this.video.addEventListener('canplay', () => {
                // Only check if video exists, not section
                if (this.video) {
                    this.video.play().catch(e => {
                        console.warn('Video autoplay prevented:', e);
                        if (this.scene) {
                            this.createPlayButton();
                        }
                    });
                }
            });
    
            this.video.load();
        });
    }

    createVideoMesh() {
        // Only check if scene exists (not section check)
        if (!this.scene) {
            console.log('📹 No scene available for video mesh');
            return;
        }
        
        const videoTexture = new THREE.VideoTexture(this.video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBFormat;
        videoTexture.flipY = true;
    
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
    
        const material = new THREE.MeshBasicMaterial({ 
            map: videoTexture,
            side: THREE.FrontSide
        });
    
        this.videoMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.videoMesh);
    }

    createFallbackBackground() {
        // Only check if scene exists (not section check)
        if (!this.scene) {
            console.log('No scene available for fallback background');
            return;
        }
        
        console.log('Creating fallback gradient background');
        
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a5490');
        gradient.addColorStop(0.3, '#2d7db8');
        gradient.addColorStop(0.6, '#4a9eff');
        gradient.addColorStop(1, '#87ceeb');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 1000; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 3,
                Math.random() * 3
            );
        }
    
        const texture = new THREE.CanvasTexture(canvas);
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
        
        const material = new THREE.MeshBasicMaterial({ map: texture });
        this.videoMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.videoMesh);
    }

    createPlayButton() {
        const playButton = document.createElement('button');
        playButton.innerHTML = '▶️ Start Experience';
        playButton.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            cursor: pointer;
            z-index: 1001;
            margin-top: 200px;
            font-family: inherit;
        `;

        playButton.addEventListener('click', () => {
            this.video.play();
            playButton.remove();
        });

        document.getElementById('intro-section').appendChild(playButton);
    }

    // ===== INFO BUTTON SETUP =====
    setupInfoButton() {
        // Create info button
        const infoButton = document.createElement('button');
        infoButton.className = 'info-button';
        infoButton.id = 'info-button';
        infoButton.title = 'About Isokari 360°';
        infoButton.innerHTML = '<img src="assets/info.png" alt="Info" class="info-icon">';
        
        // Create info panel that appears above button
        const infoPanel = document.createElement('div');
        infoPanel.className = 'info-panel';
        infoPanel.id = 'info-panel';
        infoPanel.innerHTML = `
            <div class="info-panel-title">About Isokari 360°</div>
            <div class="info-panel-content">
                This interactive experience is provided by <a href="https://btq360.com" target="_blank" class="info-inline-link">boutique360</a>. Learn more about Isokari at <a href="https://www.isokari.fi/" target="_blank" class="info-inline-link">isokari.fi</a>.
            </div>
        `;
        
        // Add to DOM
        const introSection = document.getElementById('intro-section');
        introSection.appendChild(infoButton);
        introSection.appendChild(infoPanel);
        
        // Add event listeners
        infoButton.addEventListener('click', () => {
            this.toggleInfoPanel();
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.info-button') && !e.target.closest('.info-panel')) {
                this.hideInfoPanel();
            }
        });
        
        console.log('Info button and expandable panel created');
    }

    toggleInfoPanel() {
        if (this.infoPanelVisible) {
            this.hideInfoPanel();
        } else {
            this.showInfoPanel();
        }
    }

    showInfoPanel() {
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
            infoPanel.classList.add('visible');
            this.infoPanelVisible = true;
        }
    }

    hideInfoPanel() {
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
            infoPanel.classList.remove('visible');
            this.infoPanelVisible = false;
        }
    }

    // ===== PARALLAX EFFECTS SETUP =====
    setupParallaxEffects() {
        const menuOverlay = document.querySelector('.menu-overlay');
        if (!menuOverlay) return;

        // Only enable parallax on non-mobile devices for performance
        if (window.innerWidth <= 768) {
            this.parallaxEnabled = false;
            return;
        }

        // Mouse move event for parallax
        document.addEventListener('mousemove', (e) => {
            if (!this.parallaxEnabled) return;

            // Normalize mouse position to -1 to 1 range
            this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
        });

        console.log('Parallax effects initialized');
    }

    updateParallaxEffect() {
        if (!this.parallaxEnabled) return;

        const menuOverlay = document.querySelector('.menu-overlay');
        if (!menuOverlay) return;

        // Smooth interpolation for fluid movement
        this.targetX += (this.mouseX - this.targetX) * 0.05;
        this.targetY += (this.mouseY - this.targetY) * 0.05;

        // Apply subtle parallax transform
        const maxOffset = 8; // Maximum offset in pixels
        const offsetX = this.targetX * maxOffset;
        const offsetY = this.targetY * maxOffset;

        // Apply transform with subtle scaling effect
        const scale = 1 + (Math.abs(this.targetX) + Math.abs(this.targetY)) * 0.01;
        
        // Create the transform string - keep the original centering and add parallax
        const transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        menuOverlay.style.transform = transform;
    }

    setupControls(container) {
        // Attach mouse events to document for smooth dragging
        document.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
        document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
        document.addEventListener('mouseup', () => this.onMouseUp(), false);
        
        // Keep wheel event on container for zoom
        container.addEventListener('wheel', (e) => this.onMouseWheel(e), { passive: false });

        // Touch events stay on container
        container.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        container.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        container.addEventListener('touchend', () => this.onTouchEnd(), false);
        
        // Keyboard controls for spacebar pause
        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    }

    onKeyDown(event) {
        // Only handle spacebar in intro section
        if (ISOKARI.State.currentSection !== 'intro') return;
        
        // Only handle spacebar without modifiers
        const hasModifiers = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
        
        if (!hasModifiers && event.code === 'Space') {
            event.preventDefault();
            this.toggleAutoRotate();
            console.log('Menu auto-rotation toggled via spacebar');
        }
    }

    toggleAutoRotate() {
        this.autoRotateEnabled = !this.autoRotateEnabled;
        console.log(`Menu auto-rotation: ${this.autoRotateEnabled ? 'enabled' : 'disabled'}`);
    }

    onMouseDown(event) {
        // Only start interaction if clicking on the viewer, not UI elements
        if (!event.target.closest('#intro-viewer')) {
            return;
        }

        event.preventDefault();
        this.isUserInteracting = true;

        this.onPointerDownMouseX = event.clientX;
        this.onPointerDownMouseY = event.clientY;
        this.onPointerDownLon = this.lon;
        this.onPointerDownLat = this.lat;
    }

    onMouseMove(event) {
        if (!this.isUserInteracting) return;

        const deltaX = (this.onPointerDownMouseX - event.clientX) * this.dragSensitivity;
        const deltaY = (event.clientY - this.onPointerDownMouseY) * this.dragSensitivity;

        this.lon = deltaX + this.onPointerDownLon;
        this.lat = Math.max(-85, Math.min(85, deltaY + this.onPointerDownLat));
    }

    onMouseUp() {
        this.isUserInteracting = false;
    }

    onMouseWheel(event) {
        event.preventDefault();

        const delta = event.deltaY || event.detail || event.wheelDelta;

        if (delta > 0) {
            this.currentZoom = Math.min(this.maxZoom, this.currentZoom + this.zoomSensitivity);
        } else {
            this.currentZoom = Math.max(this.minZoom, this.currentZoom - this.zoomSensitivity);
        }

        this.camera.fov = this.currentZoom;
        this.camera.updateProjectionMatrix();
    }

    onTouchStart(event) {
        event.preventDefault();

        if (event.touches.length === 1) {
            this.isUserInteracting = true;
            this.onPointerDownMouseX = event.touches[0].pageX;
            this.onPointerDownMouseY = event.touches[0].pageY;
            this.onPointerDownLon = this.lon;
            this.onPointerDownLat = this.lat;
        } else if (event.touches.length === 2) {
            const dx = event.touches[0].pageX - event.touches[1].pageX;
            const dy = event.touches[0].pageY - event.touches[1].pageY;
            this.prevTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }

    onTouchMove(event) {
        if (event.touches.length === 1 && this.isUserInteracting) {
            event.preventDefault();

            const deltaX = (this.onPointerDownMouseX - event.touches[0].pageX) * this.dragSensitivity;
            const deltaY = (event.touches[0].pageY - this.onPointerDownMouseY) * this.dragSensitivity;

            this.lon = deltaX + this.onPointerDownLon;
            this.lat = Math.max(-85, Math.min(85, deltaY + this.onPointerDownLat));

        } else if (event.touches.length === 2) {
            const dx = event.touches[0].pageX - event.touches[1].pageX;
            const dy = event.touches[0].pageY - event.touches[1].pageY;
            this.touchDistance = Math.sqrt(dx * dx + dy * dy);

            if (this.prevTouchDistance > 0) {
                const zoomFactor = this.touchDistance / this.prevTouchDistance;
                this.currentZoom = this.currentZoom / zoomFactor;
                this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.currentZoom));

                this.camera.fov = this.currentZoom;
                this.camera.updateProjectionMatrix();
            }
            this.prevTouchDistance = this.touchDistance;
        }
    }

    onTouchEnd() {
        this.isUserInteracting = false;
        this.touchDistance = 0;
        this.prevTouchDistance = 0;
    }

    updateCameraPosition() {
        const phi = THREE.MathUtils.degToRad(90 - this.lat);
        const theta = THREE.MathUtils.degToRad(this.lon);

        this.camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
        this.camera.position.y = 100 * Math.cos(phi);
        this.camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);

        this.camera.lookAt(0, 0, 0);
    }

    startAnimation() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);

            if (ISOKARI.State.currentSection !== 'intro') {
                return;
            }

            if (!this.isUserInteracting && this.autoRotateEnabled) {
                this.lon += this.autoRotateSpeed * 60;
            }

            // Update parallax effect
            this.updateParallaxEffect();

            this.updateCameraPosition();

            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };

        animate();
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    dispose() {
        this.stopAnimation();
        
        // Set disposal flag to prevent async operations
        this.isDisposed = true;
        
        // Clean up document event listeners
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);
        
        // Clean up info button
        const infoButton = document.getElementById('info-button');
        const infoPanel = document.getElementById('info-panel');
        if (infoButton) infoButton.remove();
        if (infoPanel) infoPanel.remove();
        
        // CRITICAL: Clean up video properly
        if (this.video) {
            this.video.pause();
            this.video.removeAttribute('src');
            this.video.load(); // Force cleanup
            this.video = null;
        }
    
        if (this.videoMesh) {
            ISOKARI.Utils.disposeThreeObject(this.videoMesh);
            this.scene?.remove(this.videoMesh);
            this.videoMesh = null;
        }
    
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
            this.renderer = null;
        }
    
        this.scene = null;
        this.camera = null;
        
        console.log('Menu controller disposed');
    }

    setAutoRotate(enabled) {
        this.autoRotateEnabled = enabled;
    }

    resetView() {
        this.lon = -30; // Start facing slightly left
        this.lat = 5;   // Start looking slightly up
        this.currentZoom = 80; // Slightly closer view
        this.camera.fov = this.currentZoom;
        this.camera.updateProjectionMatrix();
    }
};

console.log('Menu Controller with Parallax and Info Button Loaded');