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
    // Change these values to adjust your zoom limits
    
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
        container.addEventListener('wheel', onDocumentWheel, { passive: false });
        
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
// Touch start event handler
function onDocumentTouchStart(event) {
    if (event.touches.length === 1) {
        event.preventDefault();
        
        mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
        mouseYOnMouseDown = event.touches[0].pageY - windowHalfY;
        
        targetRotationXOnMouseDown = targetRotationX;
        targetRotationYOnMouseDown = targetRotationY;
        
        // Change this line:
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        // Change this line:
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
    
// Mouse wheel event handler for zooming
function onDocumentWheel(event) {
    // Check if we're at min/max zoom before preventing default
    if ((event.deltaY > 0 && camera.fov < MAX_FOV) || 
        (event.deltaY < 0 && camera.fov > MIN_FOV)) {
        event.preventDefault();
        
        const delta = event.deltaY > 0 ? 1 : -1;
        
        // Adjust field of view (zoom)
        camera.fov += delta * 1.5;
        
        // Apply zoom limits
        camera.fov = Math.max(MIN_FOV, Math.min(MAX_FOV, camera.fov));
        camera.updateProjectionMatrix();
    }
    // If we're at zoom limits, don't prevent default so page scroll works
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
                // You don't need to add anything else here - the CSS animation will apply automatically
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
            
            // Removed the setTimeout that was automatically hiding the hint
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
 * Mobile-specific fixes for the interactive panorama
 * Add this code at the end of your interactive-panorama.js file
 */

// Add explicit touch event handling for buttons
document.addEventListener('DOMContentLoaded', function() {
    // Fix for mobile button touch events
    const fixMobileButtonInteraction = function() {
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const autoRotateBtn = document.getElementById('auto-rotate-btn');
        
        // Helper function to add touch events to a button
        const addTouchEvents = function(button, callback) {
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
        };
        
        // Add touch events to each button
        if (zoomInBtn) {
            addTouchEvents(zoomInBtn, function() {
                // Get the camera and adjust FOV
                const container = document.getElementById('interactive-panorama-container');
                if (container && container._camera) {
                    const camera = container._camera;
                    // Access through the stored reference
                    camera.fov = Math.max(50, camera.fov - 3);
                    camera.updateProjectionMatrix();
                } else {
                    // Fallback: trigger a click event which the original handler will catch
                    zoomInBtn.click();
                }
            });
        }
        
        if (zoomOutBtn) {
            addTouchEvents(zoomOutBtn, function() {
                const container = document.getElementById('interactive-panorama-container');
                if (container && container._camera) {
                    const camera = container._camera;
                    camera.fov = Math.min(90, camera.fov + 3);
                    camera.updateProjectionMatrix();
                } else {
                    zoomOutBtn.click();
                }
            });
        }
        
        if (autoRotateBtn) {
            addTouchEvents(autoRotateBtn, function() {
                // Just trigger the click event, as the toggle logic is more complex
                autoRotateBtn.click();
            });
        }
    };
    
    // Execute the fix after a small delay to ensure the panorama is initialized
    setTimeout(fixMobileButtonInteraction, 1000);
});

// Add CSS styles for better mobile interaction
document.addEventListener('DOMContentLoaded', function() {
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
        .panorama-control-button:active {
            transform: scale(0.95) !important;
            background-color: rgba(255, 223, 77, 0.4) !important;
            border-color: rgba(255, 223, 77, 0.8) !important;
        }
        
        /* Make sure controls are above other elements */
        .panorama-controls {
            z-index: 100 !important;
            pointer-events: auto !important;
        }
        
        /* Ensure buttons receive events */
        .panorama-control-button {
            pointer-events: auto !important;
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
});

// Modify the initInteractivePanorama function to store a reference to the camera
// Add this code near the end of your init() function in initInteractivePanorama
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the panorama to initialize, then patch it
    setTimeout(function() {
        const container = document.getElementById('interactive-panorama-container');
        // Store references to important objects on the container element for access from touch handlers
        if (container && container.querySelector('canvas') && window.THREE) {
            const rendererDomElement = container.querySelector('canvas');
            if (rendererDomElement && rendererDomElement.parentNode && rendererDomElement.parentNode._threeRenderer) {
                // Try to get the camera from the THREE.js renderer
                const renderer = rendererDomElement.parentNode._threeRenderer;
                if (renderer && renderer.camera) {
                    container._camera = renderer.camera;
                    console.log('Camera reference stored for mobile interactions');
                }
            }
        }
    }, 2000); // Wait 2 seconds for everything to initialize
});

/**
 * Fix for mobile button active state
 * Add this code at the end of your interactive-panorama.js file
 */
document.addEventListener('DOMContentLoaded', function() {
    // Fix for button active state on mobile
    const fixButtonActiveState = function() {
        const buttons = [
            document.getElementById('zoom-in-btn'),
            document.getElementById('zoom-out-btn'),
            document.getElementById('auto-rotate-btn')
        ];
        
        // Add touchend event to remove active state
        buttons.forEach(button => {
            if (!button) return;
            
            // For touch devices
            button.addEventListener('touchstart', function(e) {
                // Add active class or style
                this.classList.add('active-btn');
                // Prevent default to avoid double triggers
                e.preventDefault();
            }, { passive: false });
            
            button.addEventListener('touchend', function() {
                // Remove active class with a slight delay to ensure visual feedback
                setTimeout(() => {
                    this.classList.remove('active-btn');
                }, 100);
            });
            
            // For mouse devices (just to be thorough)
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
        });
    };
    
    // Add a small style element for the active state
    const style = document.createElement('style');
    style.textContent = `
        .panorama-control-button.active-btn {
            background-color: rgba(255, 223, 77, 0.4) !important;
            transform: scale(0.95);
            transition: all 0.1s ease;
        }
        
        /* Fix for iOS */
        .panorama-control-button {
            -webkit-tap-highlight-color: transparent;
        }
    `;
    document.head.appendChild(style);
    
    // Apply the fix
    setTimeout(fixButtonActiveState, 1000);
});