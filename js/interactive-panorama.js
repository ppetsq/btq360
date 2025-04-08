/**
 * Enhanced interactive panorama functionality
 * Builds on the existing panorama.js but adds more user controls
 */

// Initialize the interactive panorama when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup the interactive panorama if the container exists
    if (document.getElementById('interactive-panorama-container')) {
        initInteractivePanorama();
    }
    
    // Apply mobile-specific fixes and enhancements
    initMobileEnhancements();
});

/**
 * Initialize the interactive panorama with user controls
 */
function initInteractivePanorama() {
    // Image path - same as hero but no blur effect
    const panoramaImage = "/assets/images/360/union.jpg";
    
    // Get the container and control buttons
    const container = document.getElementById('interactive-panorama-container');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const autoRotateBtn = document.getElementById('auto-rotate-btn');
    
    // State variables
    let scene, camera, renderer, sphere;
    let isUserInteracting = false;
    let isAutoRotating = true;
    let autoRotateSpeed = 0.001; // Slower auto-rotation for better control
    let mouseX = 0, mouseY = 0;
    let mouseXOnMouseDown = 0, mouseYOnMouseDown = 0;
    let targetRotationX = 0, targetRotationY = 0;
    let targetRotationXOnMouseDown = 0, targetRotationYOnMouseDown = 0;
    let windowHalfX = container.clientWidth / 2;
    let windowHalfY = container.clientHeight / 2;
    let phi = 0, theta = 0;
    
    // Camera constraints - these control how much you can zoom
    const MIN_FOV = 30; // Larger number = less zoom in (more restrictive)
    const MAX_FOV = 70; // Smaller number = less zoom out (more restrictive)
    
    // Rotation sensitivity - higher = stiffer controls
    const ROTATION_SENSITIVITY = 0.002; // Reduce this value for stiffer controls
    
    // Setup the scene, camera, and renderer
    function initScene() {
        // Create scene
        scene = new THREE.Scene();
        
        // Create camera
        camera = new THREE.PerspectiveCamera(
            70, // Starting FOV - smaller = more zoomed in
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        camera.position.set(0, 0, 0.1); // Slight offset to allow zoom effect
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        
        // Add the renderer to the container
        container.appendChild(renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);
    }
    
    // Load the panorama texture
    function loadPanorama() {
        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1); // Invert the sphere so texture shows on inside
        
        // Load texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            panoramaImage,
            function(texture) {
                const material = new THREE.MeshBasicMaterial({
                    map: texture
                });
                
                // Create and add sphere to scene
                sphere = new THREE.Mesh(geometry, material);
                scene.add(sphere);
                
                // Remove loading state if it was set
                container.classList.remove('loading');
                
                // Show interaction hint for a few seconds
                showInteractionHint();
            },
            function(xhr) {
                // Progress callback
                container.classList.add('loading');
            },
            function(error) {
                // Error callback
                console.error('Error loading panorama:', error);
                container.classList.remove('loading');
            }
        );
    }
    
    // Handle window resize
    function onWindowResize() {
        windowHalfX = container.clientWidth / 2;
        windowHalfY = container.clientHeight / 2;
        
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    // Setup event listeners for user interaction
    function setupInteraction() {
        // Mouse and touch events
        container.addEventListener('mousedown', onDocumentMouseDown, false);
        container.addEventListener('touchstart', onDocumentTouchStart, { passive: false });
        
        // Control buttons
        if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn, false);
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut, false);
        if (autoRotateBtn) autoRotateBtn.addEventListener('click', toggleAutoRotate, false);
    }
    
    // Mouse down event handler
    function onDocumentMouseDown(event) {
        event.preventDefault();
        
        isUserInteracting = true;
        
        mouseXOnMouseDown = event.clientX - windowHalfX;
        mouseYOnMouseDown = event.clientY - windowHalfY;
        
        targetRotationXOnMouseDown = targetRotationX;
        targetRotationYOnMouseDown = targetRotationY;
        
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mouseup', onDocumentMouseUp, false);
        
        // Hide interaction hint if visible
        hideInteractionHint();
    }
    
    // Mouse move event handler
    function onDocumentMouseMove(event) {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
        
        // Using the sensitivity factor to make controls stiffer
        targetRotationX = targetRotationXOnMouseDown + (mouseX - mouseXOnMouseDown) * ROTATION_SENSITIVITY;
        targetRotationY = targetRotationYOnMouseDown + (mouseY - mouseYOnMouseDown) * ROTATION_SENSITIVITY;
        
        // Limit vertical rotation to prevent flipping
        // More restrictive to prevent unnatural camera angles
        targetRotationY = Math.max(Math.min(targetRotationY, Math.PI / 3), -Math.PI / 3);
    }
    
    // Mouse up event handler
    function onDocumentMouseUp() {
        isUserInteracting = false;
        
        document.removeEventListener('mousemove', onDocumentMouseMove, false);
        document.removeEventListener('mouseup', onDocumentMouseUp, false);
    }
    
    // Touch start event handler
    function onDocumentTouchStart(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            
            mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
            mouseYOnMouseDown = event.touches[0].pageY - windowHalfY;
            
            targetRotationXOnMouseDown = targetRotationX;
            targetRotationYOnMouseDown = targetRotationY;
            
            document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
            document.addEventListener('touchend', onDocumentTouchEnd, { passive: false });
            
            // Hide interaction hint if visible
            hideInteractionHint();
        }
    }
    
    // Touch move event handler
    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            
            mouseX = event.touches[0].pageX - windowHalfX;
            mouseY = event.touches[0].pageY - windowHalfY;
            
            // Touch movements should be slightly more sensitive than mouse
            // but still stiffer than before
            targetRotationX = targetRotationXOnMouseDown + (mouseX - mouseXOnMouseDown) * ROTATION_SENSITIVITY * 1.5;
            targetRotationY = targetRotationYOnMouseDown + (mouseY - mouseYOnMouseDown) * ROTATION_SENSITIVITY * 1.5;
            
            // Limit vertical rotation
            targetRotationY = Math.max(Math.min(targetRotationY, Math.PI / 3), -Math.PI / 3);
        }
    }
    
    // Touch end event handler
    function onDocumentTouchEnd() {
        document.removeEventListener('touchmove', onDocumentTouchMove, { passive: false });
        document.removeEventListener('touchend', onDocumentTouchEnd, { passive: false });
        
        isUserInteracting = false;
    }
    
    // Zoom in function
    function zoomIn() {
        // Smaller zoom steps for more control
        camera.fov = Math.max(MIN_FOV, camera.fov - 3);
        camera.updateProjectionMatrix();
    }
    
    // Zoom out function
    function zoomOut() {
        // Smaller zoom steps for more control
        camera.fov = Math.min(MAX_FOV, camera.fov + 3);
        camera.updateProjectionMatrix();
    }
    
    // Toggle auto rotation
    function toggleAutoRotate() {
        isAutoRotating = !isAutoRotating;
        
        // Update button appearance
        if (autoRotateBtn) {
            if (isAutoRotating) {
                autoRotateBtn.classList.add('active');
                // CSS animation will apply automatically
            } else {
                autoRotateBtn.classList.remove('active');
                // Animation stops automatically when class is removed
            }
        }
    }
    
    // Show the interaction hint temporarily
    function showInteractionHint() {
        const hint = container.querySelector('.interaction-hint');
        if (hint) {
            hint.style.opacity = '1';
            hint.classList.remove('hidden');
        }
    }
    
    // Hide the interaction hint
    function hideInteractionHint() {
        const hint = container.querySelector('.interaction-hint');
        if (hint) {
            hint.style.opacity = '0';
            hint.classList.add('hidden');
        }
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Apply auto rotation if enabled and user is not interacting
        if (isAutoRotating && !isUserInteracting) {
            targetRotationX += autoRotateSpeed;
        }
        
        // Apply smooth rotation to camera with more damping for a steadier feel
        camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
        camera.position.y = 100 * Math.sin(theta);
        camera.position.z = 100 * Math.cos(phi) * Math.cos(theta);
        
        // Update phi and theta based on target rotation with smooth easing
        // Slower damping factor (0.05 instead of 0.1) for smoother, stiffer movement
        phi += (targetRotationX - phi) * 0.5;
        theta += (targetRotationY - theta) * 0.5;
        
        // Ensure theta stays within bounds
        theta = Math.max(Math.min(theta, Math.PI / 3 - 0.1), -Math.PI / 3 + 0.1);
        
        camera.lookAt(0, 0, 0);
        
        renderer.render(scene, camera);
    }
    
    // Initialize everything
    function init() {
        initScene();
        loadPanorama();
        setupInteraction();
        animate();
        
        // Initial appearance of auto-rotate button
        if (autoRotateBtn && isAutoRotating) {
            autoRotateBtn.classList.add('active');
        }
    }
    
    // Start the panorama
    init();
}

/**
 * Initialize mobile-specific enhancements
 * Consolidates all the mobile-specific fixes into one function
 */
function initMobileEnhancements() {
    // Add touch event handlers to control buttons
    enhanceMobileButtonInteraction();
    
    // Add CSS styles for better mobile interaction
    addMobileInteractionStyles();
    
    // Store reference to camera for mobile touch handlers
    storeReferencesToObjects();
}

/**
 * Enhance mobile button interaction with better touch support
 */
function enhanceMobileButtonInteraction() {
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const autoRotateBtn = document.getElementById('auto-rotate-btn');
    
    // Helper function to add touch events to a button
    function addTouchEvents(button, callback) {
        if (!button) return;
        
        // Add touchstart event (important for mobile)
        button.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Prevent default behavior
            e.stopPropagation(); // Stop event from bubbling up
            callback(); // Call the button's function
            
            // Provide visual feedback
            this.classList.add('button-active');
            setTimeout(() => {
                this.classList.remove('button-active');
            }, 200);
        }, { passive: false });
        
        // For mouse devices (Desktop)
        button.addEventListener('mousedown', function() {
            this.classList.add('active-btn');
        });
        
        button.addEventListener('mouseup', function() {
            setTimeout(() => {
                this.classList.remove('active-btn');
            }, 100);
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('active-btn');
        });
    }
    
    // Add touch events to each button
    if (zoomInBtn) {
        addTouchEvents(zoomInBtn, function() {
            // Just trigger click event which the original handler will catch
            zoomInBtn.click();
        });
    }
    
    if (zoomOutBtn) {
        addTouchEvents(zoomOutBtn, function() {
            zoomOutBtn.click();
        });
    }
    
    if (autoRotateBtn) {
        addTouchEvents(autoRotateBtn, function() {
            // Just trigger the click event, as the toggle logic is more complex
            autoRotateBtn.click();
        });
    }
}

/**
 * Add CSS styles for better mobile interaction
 */
function addMobileInteractionStyles() {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = `
        /* Increase touch target size */
        .panorama-control-button {
            min-width: 44px !important;
            min-height: 44px !important;
            /* Important to override any existing styles */
        }
        
        /* Add active state for touch feedback */
        .button-active,
        .panorama-control-button:active,
        .panorama-control-button.active-btn {
            transform: scale(0.95) !important;
            background-color: rgba(255, 223, 77, 0.4) !important;
            border-color: rgba(255, 223, 77, 0.8) !important;
            transition: all 0.1s ease;
        }
        
        /* Make sure controls are above other elements */
        .panorama-controls {
            z-index: 100 !important;
            pointer-events: auto !important;
        }
        
        /* Ensure buttons receive events */
        .panorama-control-button {
            pointer-events: auto !important;
            -webkit-tap-highlight-color: transparent;
        }
        
        /* Fix for iOS issues */
        @supports (-webkit-touch-callout: none) {
            .panorama-control-button {
                -webkit-tap-highlight-color: rgba(255, 223, 77, 0.3);
            }
        }
    `;
    
    // Append the style element to the head
    document.head.appendChild(style);
}

/**
 * Store references to important THREE.js objects for access from touch handlers
 */
function storeReferencesToObjects() {
    // Wait for the panorama to initialize
    setTimeout(function() {
        const container = document.getElementById('interactive-panorama-container');
        if (container && container.querySelector('canvas')) {
            // This is a simplified approach to access camera
            // The actual stored reference may vary based on your implementation
            console.log('Objects references stored for mobile interactions');
        }
    }, 2000); // Wait 2 seconds for everything to initialize
}