// ===== ISLAND CONTROLLER WITH IMMEDIATE MAP POSITIONING =====
// Handles mirror ball 360° experience with immediate map positioning (no delays)

ISOKARI.IslandController = class {
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
        this.isMobile = window.innerWidth <= 1024;

        // Interaction variables with island starting position
        this.lon = -105;   // Start facing northeast toward the dramatic cliffs
        this.lat = 20;  // Start looking slightly down at the cliffs
        this.onPointerDownLon = 0;
        this.onPointerDownLat = 0;
        this.onPointerDownMouseX = 0;
        this.onPointerDownMouseY = 0;
        this.isDragging = false;
        this.didZoom = false;

        // Zoom variables with island starting zoom
        this.currentZoom = 110; // Medium-close view of the cliffs
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

        // Array of image URLs
        this.imageUrls = [
            'https://assets.360.petsq.works/isokari/island_01.jpg',
            'https://assets.360.petsq.works/isokari/island_02.jpg',
            'https://assets.360.petsq.works/isokari/island_03.jpg',
            'https://assets.360.petsq.works/isokari/island_04.jpg',
            'https://assets.360.petsq.works/isokari/island_05.jpg',
            'https://assets.360.petsq.works/isokari/island_06.jpg',
            'https://assets.360.petsq.works/isokari/island_07.jpg',
            'https://assets.360.petsq.works/isokari/island_08.jpg',
            'https://assets.360.petsq.works/isokari/island_09.jpg',
            'https://assets.360.petsq.works/isokari/island_10.jpg',
            'https://assets.360.petsq.works/isokari/island_11.jpg',
            'https://assets.360.petsq.works/isokari/island_12.jpg'
        ];
        this.currentImageIndex = 0;

        // Double-tap detector for UI reveal
        this.doubleTapDetector = new ISOKARI.DoubleTapDetector(() => {
            if (!this.uiPanelVisible) {
                console.log('🏝️ Double-tap detected - showing UI');
                this.showUIPanel();
            }
        });

        // Content data for each image location
        this.imageContent = [
            {
                // Image 01
                title: "Summer Shepherds",
                description: "Each summer, sheep are brought to Isokari as part of a traditional method for managing the landscape. Volunteers stay in the old pilot house and help care for the animals, supporting the island’s biodiversity by keeping open habitats from becoming overgrown.",
                specs: {
                    date: "12/05/2025",
                    time: "17:56", 
                    coordinates: "60.7153°N, 21.0128°E"
                }
            },
            {
                // Image 02
                title: "The Supply Road",
                description: "This path has served as Isokari’s main route between the harbor and lighthouse since the 1830s, worn smooth by generations of lighthouse keepers hauling supplies. Though the lighthouse is now automated, the route remains part of the island’s working infrastructure.",
                specs: {
                    date: "11/05/2025",
                    time: "14:06", 
                    coordinates: "60.7180°N, 21.0174°E"
                }
            },
            {
                // Image 03
                title: "Between Fresh and Salt",
                description: "These small lakes were once part of the Baltic Sea. As the land here rises a few millimetres each year, they’ve gradually been cut off from the ocean. The result is a rare environment, where species from both fresh and salt water coexist.",
                specs: {
                    date: "11/05/2025",
                    time: "13:04", 
                    coordinates: "60.7178°N, 21.0082°E"
                }
            },
            {
                // Image 04
                title: "The Lighthouse",
                description: "Built in 1833, Isokari Lighthouse is the tallest in the Gulf of Bothnia. Its light reaches 49.4 metres above sea level, with nearly 200 steps leading to the top. During World War II, it was prepared for demolition, but the order was luckily never carried out.",
                specs: {
                    date: "12/05/2025",
                    time: "18:16", 
                    coordinates: "60.7180°N, 21.0110°E"
                }
            },
            {
                // Image 05
                title: "Ancient Stone Walls",
                description: "These cliffs are made of bedrock over a billion years old, among the oldest found in Finland. Their smooth, rounded shapes were carved by glaciers that melted around 12,000 years ago. Despite being mostly bare rock, Isokari supports more than 380 plant species in its cracks and crevices.",
                specs: {
                    date: "11/05/2025",
                    time: "13:39", 
                    coordinates: "60.7183°N, 21.0058°E"
                }
            },
            {
                // Image 06
                title: "High Ground",
                description: "This elevated point stands next to the former residence of maritime pilots, once used to monitor ship traffic in the surrounding waters. Today, the same building houses summer volunteers who help manage the island’s grazing sheep.",
                specs: {
                    date: "16/05/2025",
                    time: "11:01", 
                    coordinates: "60.7204°N, 21.0236°E"
                }
            },
            {
                // Image 07
                title: "Coastal Defence",
                description: "This artillery gun dates back to the Cold War, when Finland took quiet measures to protect its coastline. Though no longer in use, it remains part of the island’s history and its wider role in the Baltic region.",
                specs: {
                    date: "11/05/2025",
                    time: "14:14", 
                    coordinates: "60.7180°N, 21.0213°E"
                }
            },
            {
                // Image 08
                title: "Harbour",
                description: "The harbour is the island’s main point of arrival, used by ferries and private boats. Nearby, the modern pilot station is still in active use, guiding ships to and from Uusikaupunki.",
                specs: {
                    date: "16/05/2025",
                    time: "12:56", 
                    coordinates: "60.7212°N, 21.0266°E"
                }
            },
            {
                // Image 09  
                title: "Wave-Worn Coastline", 
                description: "These southern shores face the full power of waves rolling in across the Baltic Sea. Over thousands of years, the constant pounding has polished the ancient rocks into smooth, rounded shapes. Each storm continues this endless process of slowly reshaping the coastline.",
                specs: {
                    date: "12/05/2025",
                    time: "20:27", 
                    coordinates: "60.7165°N, 21.0094°E"
                }
            },
            {
                // Image 10
                title: "The Secret Lake",
                description: "Hidden in the middle of the island, this lake is slowly becoming wilder as reeds and plants spread. Once much more open, it is now being quietly reclaimed by nature. This makes it a perfect resting spot for migrating birds and birdwatchers. ",
                specs: {
                    date: "12/05/2025",
                    time: "20:49", 
                    coordinates: "60.7193°N, 21.0163°E"
                }
            },
            {
                // Image 11
                title: "Island Community",
                description: "This cluster of old buildings near the base of the lighthouse once formed the heart of a fishing and sea pilot community. Today, they support summer life on the island with guest rooms, a restaurant, sauna, and staff quarters.",
                specs: {
                    date: "12/05/2025",
                    time: "18:23", 
                    coordinates: "60.7182°N, 21.0126°E"
                }
            },
            {
                // Image 12
                title: "Evening Watch",
                description: "As the moon rises and the lighthouse begins its nightly watch, the island settles into stillness. Surrounded by open sea and sky, this view reflects the solitude lighthouse keepers have known here for nearly 200 years.",
                specs: {
                    date: "12/05/2025",
                    time: "23:07", 
                    coordinates: "60.7204°N, 21.0251°E"
                }
            }
        ];
    }

    // Get current content based on image index
    getCurrentContent() {
        return this.imageContent[this.currentImageIndex] || {
            title: "Isokari Cliffs",
            description: "Experience the dramatic limestone cliffs of Isokari island through immersive 360° perspectives.",
            specs: {
                date: "Aug 15, 2024", 
                time: "14:32 UTC",
                latitude: "60.2451°N",
                longitude: "22.0823°E"
            }
        };
    }

    // Update UI content when image changes
    updateUIContent() {
        const content = this.getCurrentContent();
        
        // Update title
        const titleEl = document.querySelector('#island-ui-panel .panel-title');
        if (titleEl) {
            titleEl.textContent = content.title;
        }
        
        // Update description  
        const descEl = document.querySelector('#island-ui-panel .panel-description');
        if (descEl) {
            descEl.textContent = content.description;
        }
        
        // Update specs
        const dateEl = document.querySelector('#island-ui-panel .detail-item:nth-child(1) .detail-value');
        const timeEl = document.querySelector('#island-ui-panel .detail-item:nth-child(2) .detail-value');
        const coordEl = document.querySelector('#island-ui-panel .detail-item:nth-child(3) .detail-value');
        
        if (dateEl) dateEl.textContent = content.specs.date;
        if (timeEl) timeEl.textContent = content.specs.time;
        if (coordEl) coordEl.textContent = content.specs.coordinates;
    }

    async initialize(app = null) {
        this.app = app; // Store reference for progress updates
        
        try {
            const container = document.getElementById('island-viewer');
            if (!container) {
                throw new Error('Island viewer container not found');
            }
    
            this.createScene(container);
            
            // Show progress while loading first image
            if (this.app) this.app.updateLoadingProgress(25, 'island');
            
            await this.loadEnvironmentTexture(this.imageUrls[this.currentImageIndex]);
            
            if (this.app) this.app.updateLoadingProgress(75, 'island');
            
            this.setupEventListeners();
            this.setupMobileUI();
            this.createStandaloneNavButtons(); // Create standalone nav buttons
            this.startAnimation();
            
            if (this.autoRotateEnabled) {
                const icon = document.getElementById('auto-rotate-icon');
                this.startIconRotation(icon);
            }
    
            this.setupMapDots();
    
            // Complete
            if (this.app) this.app.updateLoadingProgress(100, 'island');
    
            // Store in global state
            ISOKARI.State.scenes.island = this.scene;
            ISOKARI.State.cameras.island = this.camera;
            ISOKARI.State.renderers.island = this.renderer;

            // Initialize UI content
            this.updateUIContent();
    
            console.log('Island controller initialized');
        } catch (error) {
            console.error('Error initializing island controller:', error);
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
    
                    this.updateMapDots();
                    resolve();
                },
                (progress) => {
                    if (progress.total > 0) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        
                        if (showLoading && loadingState === 'shown' && this.app) {
                            this.app.updateImageLoadingProgress(percent);
                        } else if (this.app && !ISOKARI.State.initialized.island) {
                            this.app.updateLoadingProgress(25 + Math.round(percent * 0.5), 'island');
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
        navContainer.id = 'island-standalone-nav';

        // Create previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'standalone-nav-button';
        prevButton.id = 'island-standalone-prev';
        prevButton.title = 'Previous View';
        prevButton.innerHTML = '<img src="assets/back.png" alt="Previous" class="standalone-nav-icon">';

        // Create next button
        const nextButton = document.createElement('button');
        nextButton.className = 'standalone-nav-button';
        nextButton.id = 'island-standalone-next';
        nextButton.title = 'Next View';
        nextButton.innerHTML = '<img src="assets/next.png" alt="Next" class="standalone-nav-icon">';

        // Add buttons to container
        navContainer.appendChild(prevButton);
        navContainer.appendChild(nextButton);

        // Add to DOM
        document.getElementById('island-section').appendChild(navContainer);

        // Add event listeners
        prevButton.addEventListener('click', () => this.goToPrevious());
        nextButton.addEventListener('click', () => this.goToNext());

        console.log('Standalone navigation buttons created');
    }

    setupMobileUI() {
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 1024;
            
            if (wasMobile !== this.isMobile) {
                this.updateMapDots();
                this.resetMapPositioning();
            }
            
            if (this.isMobile && this.uiPanelVisible) {
                this.positionMapRelativeToUI();
            }
        });
    }

    resetMapPositioning() {
        const mapContainer = document.getElementById('island-map-container');
        if (!mapContainer) return;
        
        mapContainer.style.removeProperty('bottom');
        mapContainer.style.removeProperty('opacity');
        mapContainer.style.removeProperty('visibility');
        mapContainer.classList.remove('positioned');
        
        console.log(`RESET MAP POSITIONING - Now ${this.isMobile ? 'MOBILE' : 'DESKTOP'} mode`);
        
        if (this.isMobile && this.uiPanelVisible) {
            this.positionMapRelativeToUI();
        }
    }

    positionMapRelativeToUI() {
        if (!this.isMobile) {
            this.resetMapPositioning();
            return;
        }
        
        const uiPanel = document.getElementById('island-ui-panel');
        const mapContainer = document.getElementById('island-map-container');
        
        if (uiPanel && mapContainer && uiPanel.classList.contains('visible')) {
            const uiHeight = uiPanel.getBoundingClientRect().height;
            const mapHeight = window.innerWidth <= 480 ? 195 : 234;
            const bottomOffset = uiHeight - (mapHeight / 2) + 20;
            
            mapContainer.style.setProperty('bottom', `${bottomOffset}px`, 'important');
            mapContainer.classList.add('positioned');
            mapContainer.style.setProperty('opacity', '1', 'important');
            mapContainer.style.setProperty('visibility', 'visible', 'important');
            
            console.log(`MOBILE MAP POSITIONING: bottom ${bottomOffset}px`);
        }
    }

    handleInitialShow() {
        console.log('HandleInitialShow called - mobile:', this.isMobile);
        if (this.isMobile) {
            this.positionMapRelativeToUI();
        }
    }

    setupEventListeners() {
        const container = document.getElementById('island-viewer');
    
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
    
        const autoRotateToggle = document.getElementById('auto-rotate-toggle');
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');
        const uiToggleButton = document.getElementById('ui-toggle-button');
        const btqButton = document.getElementById('btq-button');
    
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
        if (!event.target.closest('#island-viewer')) {
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

        if (!event.target.closest('#island-viewer')) {
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
        const button = document.getElementById('auto-rotate-toggle');
        const icon = document.getElementById('auto-rotate-icon');

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
        const panel = document.getElementById('island-ui-panel');
        const toggleButton = document.getElementById('ui-toggle-button');
        const btqButton = document.getElementById('btq-button');
        const mapContainer = document.getElementById('island-map-container');
        const standaloneNav = document.getElementById('island-standalone-nav');
    
        panel?.classList.add('visible');
        toggleButton?.classList.add('panel-open');
        mapContainer?.classList.add('visible');
        mapContainer?.classList.remove('positioned');
        
        // Hide standalone navigation buttons immediately when UI starts showing
        standaloneNav?.classList.remove('visible');
        
        if (!this.isMobile) {
            btqButton?.classList.add('hidden');
        }
        
        if (this.isMobile) {
            this.positionMapRelativeToUI();
        }
    }

    hideUIPanel() {
        this.uiPanelVisible = false;
        const panel = document.getElementById('island-ui-panel');
        const toggleButton = document.getElementById('ui-toggle-button');
        const btqButton = document.getElementById('btq-button');
        const mapContainer = document.getElementById('island-map-container');
        const standaloneNav = document.getElementById('island-standalone-nav');
    
        panel?.classList.remove('visible');
        toggleButton?.classList.remove('panel-open');
        mapContainer?.classList.remove('visible');
        mapContainer?.classList.remove('positioned');
        btqButton?.classList.remove('hidden');
        
        // Show standalone navigation buttons with small delay for clean transition
        setTimeout(() => {
            standaloneNav?.classList.add('visible');
        }, 150); // Short delay for clean transition
        
        if (this.isMobile && mapContainer) {
            mapContainer.style.setProperty('opacity', '0', 'important');
            mapContainer.style.setProperty('visibility', 'hidden', 'important');
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
                console.log('Loading image:', this.currentImageIndex);
                // Show delayed loading overlay for image switches
                await this.loadEnvironmentTexture(this.imageUrls[this.currentImageIndex], true);
                console.log('Successfully loaded image:', this.currentImageIndex);
            } catch (error) {
                // If loading fails, revert to previous image
                console.warn('Failed to load image, reverting to previous');
                this.currentImageIndex = oldIndex;
            }
        }
    }

    openBTQ360() {
        window.open('https://btq360.com', '_blank');
    }

    startAnimation() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);

            if (ISOKARI.State.currentSection !== 'island') {
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

    setupMapDots() {
        const dots = document.querySelectorAll('#island-map-container .dot');
        console.log('Setting up map dots:', dots.length);
        
        dots.forEach((dot, index) => {
            const newDot = dot.cloneNode(true);
            dot.parentNode.replaceChild(newDot, dot);
            
            if (!this.isMobile) {
                newDot.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Map dot clicked:', index);
                    this.jumpToImage(index);
                });
            }
        });
        
        this.updateMapDots();
    }
    
    updateMapDots() {
        const dots = document.querySelectorAll('#island-map-container .dot');
        
        dots.forEach((dot, index) => {
            if (index === this.currentImageIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Update UI content when image changes
        this.updateUIContent();
    }

    onKeyDown(event) {
        if (ISOKARI.State.currentSection !== 'island') return;
    
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
        
        console.log(`📐 Camera tilted to ${this.lat.toFixed(1)}°`);
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
        const container = document.getElementById('island-viewer');
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
        const standaloneNav = document.getElementById('island-standalone-nav');
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
    
        // Clear all arrays to break references
        this.imageUrls = [];
        this.imageContent = [];
        
        console.log('Island controller fully disposed with GPU memory cleanup');
    }

    async jumpToImage(index) {
        if (!this.isMobile && index >= 0 && index < this.imageUrls.length && index !== this.currentImageIndex) {
            console.log('Jumping to image via map:', index);
            await this.navigateToImage(index);
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
        this.lon = 45;   // Start facing northeast toward the dramatic cliffs
        this.lat = -10;  // Start looking slightly down at the cliffs
        this.currentZoom = 85; // Medium-close view of the cliffs
        this.camera.fov = this.currentZoom;
        this.camera.updateProjectionMatrix();
    }
};

console.log('Island Controller with Immediate Map Positioning Loaded');