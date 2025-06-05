// ===== PILOTS HOUSE CONTROLLER WITH STARTING POSITION =====
// Handles indoor 360° mirror ball experience with defined starting camera position

ISOKARI.PilotsController = class {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mirrorBallMesh = null;
        this.currentEnvTexture = null;
        this.isUserInteracting = false;
        this.autoRotateEnabled = true;
        this.uiPanelVisible = true;
        this.iconRotationAngle = 0;
        this.animationId = null;
        this.iconAnimationId = null;
        this.isMobile = window.innerWidth <= 1024; // Match island breakpoint

        // Interaction variables with pilots house starting position
        this.lon = 280;  // Start facing toward interior details
        this.lat = 40;    // Start at eye level
        this.onPointerDownLon = 0;
        this.onPointerDownLat = 0;
        this.onPointerDownMouseX = 0;
        this.onPointerDownMouseY = 0;
        this.isDragging = false;
        this.didZoom = false;

        // Zoom variables with pilots house starting zoom
        this.currentZoom = 80; // Comfortable interior view
        this.minZoom = 50;
        this.maxZoom = 120;
        this.zoomSensitivity = 2;

        // Touch zoom variables
        this.touchDistance = 0;
        this.prevTouchDistance = 0;

        // Settings
        this.autoRotateSpeed = 0.025;
        this.dragSensitivity = 0.25;

        // Constants for latitude clamping
        this.MAX_LAT_DEG = 84.5;
        this.UP_VECTOR_SMOOTHING_THRESHOLD = 75;

        // Pilots house images
        this.imageUrls = [
            'https://assets.360.petsq.works/isokari/ph_02.jpg',
            'https://assets.360.petsq.works/isokari/ph_03.jpg',
            'https://assets.360.petsq.works/isokari/ph_04.jpg',
            'https://assets.360.petsq.works/isokari/ph_05.jpg',
            'https://assets.360.petsq.works/isokari/ph_01.jpg'
        ];

        // Double-tap detector for UI reveal
        this.doubleTapDetector = new ISOKARI.DoubleTapDetector(() => {
            if (!this.uiPanelVisible) {
                console.log('Double-tap detected - showing UI');
                this.showUIPanel();
            }
        });

        this.currentImageIndex = 0;
    }

    async initialize(app = null) {
        this.app = app; // Store reference for progress updates
        
        try {
            const container = document.getElementById('pilots-viewer');
            if (!container) {
                throw new Error('Pilots viewer container not found');
            }

            this.createScene(container);
            
            // Show progress while loading first image
            if (this.app) this.app.updateLoadingProgress(25, 'pilots');
            
            await this.loadEnvironmentTexture(this.imageUrls[this.currentImageIndex]);
            
            if (this.app) this.app.updateLoadingProgress(75, 'pilots');
            
            this.createStandaloneNavButtons(); // Create standalone nav buttons
            this.setupEventListeners();
            this.setupMobileUI();
            this.startAnimation();
            
            if (this.autoRotateEnabled) {
                const icon = document.getElementById('pilots-auto-rotate-icon');
                this.startIconRotation(icon);
            }

            // Complete
            if (this.app) this.app.updateLoadingProgress(100, 'pilots');

            // Store in global state
            ISOKARI.State.scenes.pilots = this.scene;
            ISOKARI.State.cameras.pilots = this.camera;
            ISOKARI.State.renderers.pilots = this.renderer;

            console.log('Pilots House controller initialized');
        } catch (error) {
            console.error('Error initializing pilots house controller:', error);
        }
    }

    createScene(container) {
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
        this.renderer.toneMappingExposure = 1.2;
        container.appendChild(this.renderer.domElement);
    }

    async loadEnvironmentTexture(url, showLoading = false) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.crossOrigin = 'anonymous';

            let loadingState = null;
            let timeoutId = null;

            // Enhanced loading for image switches
            if (showLoading && this.app) {
                timeoutId = setTimeout(() => {
                    this.app.showImageLoading('Loading new view...');
                    loadingState = 'shown';
                }, 1000); // 1 second delay
            }

            loader.load(
                url,
                (texture) => {
                    // Cancel delayed loading if image loads quickly
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    
                    // Hide loading if it was shown
                    if (loadingState === 'shown' && this.app) {
                        this.app.hideImageLoading();
                    }

                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.flipY = false;

                    if (this.currentEnvTexture) {
                        this.currentEnvTexture.dispose();
                    }
                    this.currentEnvTexture = texture;

                    if (!this.mirrorBallMesh) {
                        this.createMirrorBallMesh();
                        this.scene.add(this.mirrorBallMesh);
                    } else {
                        this.mirrorBallMesh.material.envMap = this.currentEnvTexture;
                        this.mirrorBallMesh.material.needsUpdate = true;
                    }

                    resolve();
                },
                (progress) => {
                    if (progress.total > 0) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        
                        if (showLoading && loadingState === 'shown' && this.app) {
                            this.app.updateImageLoadingProgress(percent);
                        } else if (this.app && !ISOKARI.State.initialized.pilots) {
                            this.app.updateLoadingProgress(25 + Math.round(percent * 0.5), 'pilots');
                        }
                    }
                },
                (error) => {
                    console.error('Error loading texture:', error);
                    
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    
                    if (loadingState === 'shown' && this.app) {
                        this.app.hideImageLoading();
                    }
                    
                    reject(error);
                }
            );
        });
    }

    createMirrorBallMesh() {
        const geometry = new THREE.SphereGeometry(8, 64, 32);
        geometry.scale(-1, -1, 1);

        const material = new THREE.MeshBasicMaterial({
            envMap: this.currentEnvTexture,
            reflectivity: 1.0,
            side: THREE.BackSide
        });

        this.mirrorBallMesh = new THREE.Mesh(geometry, material);
        this.mirrorBallMesh.position.set(0, 0, -2);
    }

    createStandaloneNavButtons() {
        // Create container for standalone navigation buttons
        const navContainer = document.createElement('div');
        navContainer.className = 'standalone-nav-buttons';
        navContainer.id = 'pilots-standalone-nav';

        // Create previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'standalone-nav-button';
        prevButton.id = 'pilots-standalone-prev';
        prevButton.title = 'Previous View';
        prevButton.innerHTML = '<img src="assets/back.png" alt="Previous" class="standalone-nav-icon">';

        // Create next button
        const nextButton = document.createElement('button');
        nextButton.className = 'standalone-nav-button';
        nextButton.id = 'pilots-standalone-next';
        nextButton.title = 'Next View';
        nextButton.innerHTML = '<img src="assets/next.png" alt="Next" class="standalone-nav-icon">';

        // Add buttons to container
        navContainer.appendChild(prevButton);
        navContainer.appendChild(nextButton);

        // Add to DOM
        document.getElementById('pilots-section').appendChild(navContainer);

        // Add event listeners
        prevButton.addEventListener('click', () => this.goToPrevious());
        nextButton.addEventListener('click', () => this.goToNext());

        console.log('Standalone navigation buttons created');
    }

    setupMobileUI() {
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 1024; // Match island breakpoint
            
            if (wasMobile !== this.isMobile) {
                this.resetHousePositioning();
            }
            
            if (this.isMobile && this.uiPanelVisible) {
                this.positionHouseRelativeToUI();
            }
        });
    }

    resetHousePositioning() {
        const houseContainer = document.getElementById('pilots-house-container');
        if (!houseContainer) return;
        
        houseContainer.style.removeProperty('bottom');
        houseContainer.style.removeProperty('opacity');
        houseContainer.style.removeProperty('visibility');
        houseContainer.classList.remove('positioned');
        
        console.log(`RESET HOUSE POSITIONING - Now ${this.isMobile ? 'MOBILE' : 'DESKTOP'} mode`);
        
        if (this.isMobile && this.uiPanelVisible) {
            this.positionHouseRelativeToUI();
        }
    }

    positionHouseRelativeToUI() {
        if (!this.isMobile) {
            this.resetHousePositioning();
            return;
        }
        
        const uiPanel = document.getElementById('pilots-ui-panel');
        const houseContainer = document.getElementById('pilots-house-container');
        
        if (uiPanel && houseContainer && uiPanel.classList.contains('visible')) {
            const uiHeight = uiPanel.getBoundingClientRect().height;
            const houseHeight = 120; // Mobile house height
            const bottomOffset = uiHeight - (houseHeight / 2) + 20;
            
            houseContainer.style.setProperty('bottom', `${bottomOffset}px`, 'important');
            houseContainer.classList.add('positioned');
            houseContainer.style.setProperty('opacity', '1', 'important');
            houseContainer.style.setProperty('visibility', 'visible', 'important');
            
            console.log(`MOBILE HOUSE POSITIONING: bottom ${bottomOffset}px`);
        }
    }

    setupEventListeners() {
        const container = document.getElementById('pilots-viewer');
    
        // Mouse events - attach to document for smooth dragging like menu
        document.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
        document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
        document.addEventListener('mouseup', (e) => this.onMouseUp(e), false);
        
        // Keep wheel and touch events on container
        container.addEventListener('wheel', (e) => this.onMouseWheel(e), { passive: false });
        container.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        container.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        container.addEventListener('touchend', (e) => this.onTouchEnd(e), false);
        // Double-click support for desktop
        container.addEventListener('dblclick', (e) => {
            e.preventDefault();
            if (!this.uiPanelVisible) {
                console.log('Double-click detected - showing UI');
                this.showUIPanel();
            }
        }, false);
    
        const autoRotateToggle = document.getElementById('pilots-auto-rotate-toggle');
        const prevButton = document.getElementById('pilots-prev-button');
        const nextButton = document.getElementById('pilots-next-button');
        const uiToggleButton = document.getElementById('pilots-ui-toggle-button');
        const btqButton = document.getElementById('pilots-btq-button');
    
        if (autoRotateToggle) autoRotateToggle.addEventListener('click', () => this.toggleAutoRotate());
        if (prevButton) prevButton.addEventListener('click', () => this.goToPrevious());
        if (nextButton) nextButton.addEventListener('click', () => this.goToNext());
        if (uiToggleButton) uiToggleButton.addEventListener('click', () => this.toggleUIPanel());
        if (btqButton) btqButton.addEventListener('click', () => this.openBTQ360());
    
        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    }

    hideUIPanelImmediately() {
        if (this.uiPanelVisible) {
            this.hideUIPanel();
        }
    }

    onMouseDown(event) {
        if (!event.target.closest('#pilots-viewer')) {
            return;
        }

        event.preventDefault();
        this.isUserInteracting = true;
        this.isDragging = false;
        this.didZoom = false;

        this.onPointerDownMouseX = event.clientX;
        this.onPointerDownMouseY = event.clientY;
        this.onPointerDownLon = this.lon;
        this.onPointerDownLat = this.lat;

        this.hideUIPanelImmediately();
    }

    onMouseMove(event) {
        if (this.isUserInteracting) {
            const deltaX = (this.onPointerDownMouseX - event.clientX) * this.dragSensitivity;
            const deltaY = (event.clientY - this.onPointerDownMouseY) * this.dragSensitivity;
            
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                this.isDragging = true;
            }

            this.lon = deltaX + this.onPointerDownLon;
            const newLat = deltaY + this.onPointerDownLat;
            this.lat = Math.max(-this.MAX_LAT_DEG, Math.min(this.MAX_LAT_DEG, newLat));
        }
    }

    onMouseUp(event) {
        this.isUserInteracting = false;
        this.isDragging = false;
        this.didZoom = false;
    }

    onMouseWheel(event) {
        event.preventDefault();

        this.didZoom = true;
        this.hideUIPanelImmediately();

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

        if (!event.target.closest('#pilots-viewer')) {
            return;
        }

        this.isUserInteracting = true;
        this.isDragging = false;
        this.didZoom = false;

        if (event.touches.length === 1) {
            this.onPointerDownMouseX = event.touches[0].pageX;
            this.onPointerDownMouseY = event.touches[0].pageY;
            this.onPointerDownLon = this.lon;
            this.onPointerDownLat = this.lat;
        } else if (event.touches.length === 2) {
            this.didZoom = true;
            const dx = event.touches[0].pageX - event.touches[1].pageX;
            const dy = event.touches[0].pageY - event.touches[1].pageY;
            this.prevTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
        this.hideUIPanelImmediately();
    }

    onTouchMove(event) {
        if (event.touches.length === 1 && this.isUserInteracting) {
            event.preventDefault();

            const deltaX = (this.onPointerDownMouseX - event.touches[0].pageX) * this.dragSensitivity;
            const deltaY = (event.touches[0].pageY - this.onPointerDownMouseY) * this.dragSensitivity;
            
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                this.isDragging = true;
            }

            this.lon = deltaX + this.onPointerDownLon;
            const newLat = deltaY + this.onPointerDownLat;
            this.lat = Math.max(-this.MAX_LAT_DEG, Math.min(this.MAX_LAT_DEG, newLat));

        } else if (event.touches.length === 2) {
            this.didZoom = true;
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

    onTouchEnd(event) {
        // Detect double-tap only if UI is hidden and no interaction occurred
        if (!this.uiPanelVisible && !this.isDragging && !this.didZoom) {
            this.doubleTapDetector.handleTap();
        }
        
        this.isUserInteracting = false;
        this.touchDistance = 0;
        this.prevTouchDistance = 0;
        this.isDragging = false;
        this.didZoom = false;
    }

    toggleAutoRotate() {
        const button = document.getElementById('pilots-auto-rotate-toggle');
        const icon = document.getElementById('pilots-auto-rotate-icon');

        this.autoRotateEnabled = !this.autoRotateEnabled;

        if (this.autoRotateEnabled) {
            button?.classList.add('active');
            this.startIconRotation(icon);
            if (button) button.title = 'Disable Auto-Rotation';
        } else {
            button?.classList.remove('active');
            this.stopIconRotation(icon);
            if (button) button.title = 'Enable Auto-Rotation';
        }
    }

    startIconRotation(icon) {
        if (!icon || this.iconAnimationId) return;
        
        const rotateIcon = () => {
            this.iconRotationAngle += 0.5;
            icon.style.transform = `rotate(${this.iconRotationAngle}deg)`;
            this.iconAnimationId = requestAnimationFrame(rotateIcon);
        };
        
        rotateIcon();
    }

    stopIconRotation(icon) {
        if (this.iconAnimationId) {
            cancelAnimationFrame(this.iconAnimationId);
            this.iconAnimationId = null;
        }
    }

    toggleUIPanel() {
        if (this.uiPanelVisible) {
            this.hideUIPanel();
        } else {
            this.showUIPanel();
        }
    }

    showUIPanel() {
        this.uiPanelVisible = true;
        const panel = document.getElementById('pilots-ui-panel');
        const toggleButton = document.getElementById('pilots-ui-toggle-button');
        const btqButton = document.getElementById('pilots-btq-button');
        const houseContainer = document.getElementById('pilots-house-container');
        const standaloneNav = document.getElementById('pilots-standalone-nav');
    
        panel?.classList.add('visible');
        toggleButton?.classList.add('panel-open');
        houseContainer?.classList.add('visible');
        houseContainer?.classList.remove('positioned');
        
        // Hide standalone navigation buttons immediately when UI starts showing
        standaloneNav?.classList.remove('visible');
        
        if (!this.isMobile) {
            btqButton?.classList.add('hidden');
        }
        
        if (this.isMobile) {
            this.positionHouseRelativeToUI();
        }
    }

    hideUIPanel() {
        this.uiPanelVisible = false;
        const panel = document.getElementById('pilots-ui-panel');
        const toggleButton = document.getElementById('pilots-ui-toggle-button');
        const btqButton = document.getElementById('pilots-btq-button');
        const houseContainer = document.getElementById('pilots-house-container');
        const standaloneNav = document.getElementById('pilots-standalone-nav');
    
        panel?.classList.remove('visible');
        toggleButton?.classList.remove('panel-open');
        houseContainer?.classList.remove('visible');
        houseContainer?.classList.remove('positioned');
        btqButton?.classList.remove('hidden');
        
        // Show standalone navigation buttons with small delay for smooth transition
        setTimeout(() => {
            standaloneNav?.classList.add('visible');
        }, 150); // Short delay for clean transition
        
        if (this.isMobile && houseContainer) {
            houseContainer.style.setProperty('opacity', '0', 'important');
            houseContainer.style.setProperty('visibility', 'hidden', 'important');
        }
    }

    handleInitialShow() {
        console.log('HandleInitialShow called - mobile:', this.isMobile);
        if (this.isMobile) {
            this.positionHouseRelativeToUI();
        }
    }

    async goToPrevious() {
        const prevIndex = (this.currentImageIndex - 1 + this.imageUrls.length) % this.imageUrls.length;
        await this.navigateToImage(prevIndex);
    }
    
    async goToNext() {
        const nextIndex = (this.currentImageIndex + 1) % this.imageUrls.length;
        await this.navigateToImage(nextIndex);
    }

    async navigateToImage(index) {
        if (index >= 0 && index < this.imageUrls.length && index !== this.currentImageIndex) {
            const oldIndex = this.currentImageIndex;
            this.currentImageIndex = index;
            
            try {
                console.log('Loading pilots image:', this.currentImageIndex);
                // Show loading overlay for image switches
                await this.loadEnvironmentTexture(this.imageUrls[this.currentImageIndex], true);
                console.log('Successfully loaded pilots image:', this.currentImageIndex);
            } catch (error) {
                // If loading fails, revert to previous image
                console.warn('Failed to load pilots image, reverting to previous');
                this.currentImageIndex = oldIndex;
                
                // Hide loading overlay on error
                if (this.app) {
                    this.app.hideImageLoading();
                }
            }
        }
    }

    openBTQ360() {
        window.open('https://btq360.com', '_blank');
    }

    startAnimation() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);

            if (ISOKARI.State.currentSection !== 'pilots') {
                return;
            }

            if (!this.isUserInteracting && this.autoRotateEnabled) {
                this.lon += this.autoRotateSpeed;
            }

            if (this.mirrorBallMesh) {
                const phi = THREE.MathUtils.degToRad(90 - this.lat);
                const theta = THREE.MathUtils.degToRad(this.lon);
                
                const distance = 3.5;
                
                this.camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
                this.camera.position.y = distance * Math.cos(phi);
                this.camera.position.z = distance * Math.sin(phi) * Math.sin(theta);
                
                const upBias = Math.abs(this.lat) / this.MAX_LAT_DEG;
                
                if (upBias > this.UP_VECTOR_SMOOTHING_THRESHOLD / this.MAX_LAT_DEG) {
                    const smoothFactor = (upBias - this.UP_VECTOR_SMOOTHING_THRESHOLD / this.MAX_LAT_DEG) / (1 - this.UP_VECTOR_SMOOTHING_THRESHOLD / this.MAX_LAT_DEG);
                    const upX = Math.sin(THREE.MathUtils.degToRad(this.lon)) * smoothFactor * 0.1;
                    const upZ = -Math.cos(THREE.MathUtils.degToRad(this.lon)) * smoothFactor * 0.1;
                    this.camera.up.set(upX, 1 - smoothFactor * 0.1, upZ).normalize();
                } else {
                    this.camera.up.set(0, 1, 0);
                }

                this.camera.lookAt(this.mirrorBallMesh.position);
            }

            this.renderer.render(this.scene, this.camera);
        };

        animate();
    }

    onKeyDown(event) {
        if (ISOKARI.State.currentSection !== 'pilots') return;
    
        const hasModifiers = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
        
        if (!hasModifiers) {
            switch(event.code) {
                case 'ArrowLeft':
                case 'ArrowRight':
                case 'ArrowUp':
                case 'ArrowDown':
                case 'Space':
                case 'KeyR':
                    event.preventDefault();
                    break;
            }
        }
        
        if (!hasModifiers) {
            switch(event.code) {
                case 'ArrowRight':
                    this.goToNext();
                    break;
                    
                case 'ArrowLeft':
                    this.goToPrevious();
                    break;
                    
                case 'ArrowUp':
                    this.tiltCamera(-2);
                    break;
                    
                case 'ArrowDown':
                    this.tiltCamera(2);
                    break;
                    
                case 'Space':
                    this.toggleUIPanel();
                    break;
                    
                case 'KeyR':
                    this.toggleAutoRotate();
                    break;
            }
        }
    }

    tiltCamera(deltaLat) {
        // Apply the tilt with limits - no auto-rotation interruption
        const newLat = this.lat + deltaLat;
        this.lat = Math.max(-this.MAX_LAT_DEG, Math.min(this.MAX_LAT_DEG, newLat));
        
        console.log(`Camera tilted to ${this.lat.toFixed(1)}°`);
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.stopIconRotation();
    }

    dispose() {
        this.stopAnimation();
        
        // Clean up document event listeners
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);
        
        // Clean up container event listeners
        const container = document.getElementById('pilots-viewer');
        if (container) {
            container.removeEventListener('wheel', this.onMouseWheel);
            container.removeEventListener('touchstart', this.onTouchStart);
            container.removeEventListener('touchmove', this.onTouchMove);
            container.removeEventListener('touchend', this.onTouchEnd);
            container.removeEventListener('dblclick', this.onDoubleClick);
        }
    
        // CRITICAL: Dispose textures BEFORE mesh disposal
        if (this.currentEnvTexture) {
            this.currentEnvTexture.dispose();
            this.currentEnvTexture = null;
        }
    
        // Dispose mesh and its materials/geometry
        if (this.mirrorBallMesh) {
            if (this.mirrorBallMesh.material) {
                if (this.mirrorBallMesh.material.envMap) {
                    this.mirrorBallMesh.material.envMap.dispose();
                }
                this.mirrorBallMesh.material.dispose();
            }
            if (this.mirrorBallMesh.geometry) {
                this.mirrorBallMesh.geometry.dispose();
            }
            this.scene?.remove(this.mirrorBallMesh);
            this.mirrorBallMesh = null;
        }
    
        // Clean up standalone navigation buttons
        const standaloneNav = document.getElementById('pilots-standalone-nav');
        if (standaloneNav) {
            standaloneNav.remove();
        }
    
        // CRITICAL: Clean up renderer and force context loss
        if (this.renderer) {
            // Get WebGL context before disposal
            const gl = this.renderer.getContext();
            
            // Dispose renderer
            this.renderer.dispose();
            
            // Force context loss to free GPU memory
            const loseContext = gl.getExtension('WEBGL_lose_context');
            if (loseContext) {
                loseContext.loseContext();
            }
            
            // Remove canvas from DOM
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            
            this.renderer = null;
        }
    
        // Clear scene references
        if (this.scene) {
            this.scene.clear();
            this.scene = null;
        }
        
        this.camera = null;
    
        // Clean up double-tap detector
        if (this.doubleTapDetector) {
            this.doubleTapDetector.destroy();
            this.doubleTapDetector = null;
        }
    
        // Clear arrays to break references
        this.imageUrls = [];
        
        console.log('Pilots controller fully disposed with GPU memory cleanup');
    }

    jumpToImage(index) {
        if (index >= 0 && index < this.imageUrls.length) {
            this.currentImageIndex = index;
            this.loadEnvironmentTexture(this.imageUrls[this.currentImageIndex]);
        }
    }

    setAutoRotate(enabled) {
        this.autoRotateEnabled = enabled;
        this.toggleAutoRotate();
    }

    getCurrentImageIndex() {
        return this.currentImageIndex;
    }

    getTotalImages() {
        return this.imageUrls.length;
    }

    resetView() {
        this.lon = 120;  // Start facing toward interior details
        this.lat = 0;    // Start at eye level
        this.currentZoom = 75; // Comfortable interior view
        this.camera.fov = this.currentZoom;
        this.camera.updateProjectionMatrix();
    }
};

console.log('Pilots House Controller with Immediate House Positioning Loaded');