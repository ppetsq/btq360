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
    // Image paths for different lighting scenarios
    const images = {
        day: "https://assets.360.petsq.works/Overlook/overlook_day_fixed.jpg",
        evening: "https://assets.360.petsq.works/Overlook/overlook_evening.jpg",
        night: "https://assets.360.petsq.works/Overlook/overlook_night2.jpg",
        off: "https://assets.360.petsq.works/Overlook/overlook_off.jpg"
    };
    
    // Get the container and control buttons
    const container = document.getElementById('interactive-panorama-container');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const autoRotateBtn = document.getElementById('auto-rotate-btn');
    const roomOptions = document.querySelectorAll('.room-option');
    
    // State variables
    let scene, camera, renderer, sphere;
    let isUserInteracting = false;
    let isAutoRotating = true;
    let autoRotateSpeed = 0.0005; // Slower than the hero section for better control
    let mouseX = 0, mouseY = 0;
    let mouseXOnMouseDown = 0, mouseYOnMouseDown = 0;
    let targetRotationX = 0, targetRotationY = 0;
    let targetRotationXOnMouseDown = 0, targetRotationYOnMouseDown = 0;
    let windowHalfX = container.clientWidth / 2;
    let windowHalfY = container.clientHeight / 2;
    let phi = 0, theta = 0;
    let currentImage = 'day'; // Default image
    
    // Setup the scene, camera, and renderer
    function initScene() {
        // Create scene
        scene = new THREE.Scene();
        
        // Create camera
        camera = new THREE.PerspectiveCamera(
            75, 
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
    function loadPanorama(imagePath) {
        // If sphere already exists, remove it
        if (sphere) {
            scene.remove(sphere);
            sphere.geometry.dispose();
            sphere.material.dispose();
        }
        
        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1); // Invert the sphere so texture shows on inside
        
        // Load texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            imagePath,
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
        container.addEventListener('touchstart', onDocumentTouchStart, false);
        container.addEventListener('wheel', onDocumentWheel, { passive: false });
        
        // Control buttons
        if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn, false);
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut, false);
        if (autoRotateBtn) autoRotateBtn.addEventListener('click', toggleAutoRotate, false);
        
        // Room switcher
        roomOptions.forEach(option => {
            option.addEventListener('click', function() {
                const imageType = this.getAttribute('data-image');
                if (imageType && images[imageType]) {
                    currentImage = imageType;
                    loadPanorama(images[imageType]);
                    
                    // Update active state
                    roomOptions.forEach(opt => opt.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });
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
        
        targetRotationX = targetRotationXOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
        targetRotationY = targetRotationYOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.02;
        
        // Limit vertical rotation to prevent flipping
        targetRotationY = Math.max(Math.min(targetRotationY, Math.PI / 2), -Math.PI / 2);
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
            
            document.addEventListener('touchmove', onDocumentTouchMove, false);
            document.addEventListener('touchend', onDocumentTouchEnd, false);
            
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
            
            targetRotationX = targetRotationXOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05;
            targetRotationY = targetRotationYOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.05;
            
            // Limit vertical rotation
            targetRotationY = Math.max(Math.min(targetRotationY, Math.PI / 2), -Math.PI / 2);
        }
    }
    
    // Touch end event handler
    function onDocumentTouchEnd() {
        document.removeEventListener('touchmove', onDocumentTouchMove, false);
        document.removeEventListener('touchend', onDocumentTouchEnd, false);
        
        isUserInteracting = false;
    }
    
    // Mouse wheel event handler for zooming
    function onDocumentWheel(event) {
        event.preventDefault();
        
        const delta = event.deltaY > 0 ? 1 : -1;
        
        // Adjust field of view (zoom)
        camera.fov += delta * 2;
        camera.fov = Math.max(30, Math.min(90, camera.fov)); // Limit FOV between 30 and 90
        camera.updateProjectionMatrix();
    }
    
    // Zoom in function
    function zoomIn() {
        camera.fov = Math.max(30, camera.fov - 5);
        camera.updateProjectionMatrix();
    }
    
    // Zoom out function
    function zoomOut() {
        camera.fov = Math.min(90, camera.fov + 5);
        camera.updateProjectionMatrix();
    }
    
    // Toggle auto rotation
    function toggleAutoRotate() {
        isAutoRotating = !isAutoRotating;
        
        // Update button appearance
        if (autoRotateBtn) {
            if (isAutoRotating) {
                autoRotateBtn.classList.add('active');
            } else {
                autoRotateBtn.classList.remove('active');
            }
        }
    }
    
    // Show the interaction hint temporarily
    function showInteractionHint() {
        const hint = container.querySelector('.interaction-hint');
        if (hint) {
            hint.style.opacity = '1';
            
            // Hide after 3 seconds
            setTimeout(() => {
                hideInteractionHint();
            }, 3000);
        }
    }
    
    // Hide the interaction hint
    function hideInteractionHint() {
        const hint = container.querySelector('.interaction-hint');
        if (hint) {
            hint.style.opacity = '0';
        }
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Apply auto rotation if enabled and user is not interacting
        if (isAutoRotating && !isUserInteracting) {
            targetRotationX += autoRotateSpeed;
        }
        
        // Apply smooth rotation to camera
        camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
        camera.position.y = 100 * Math.sin(theta);
        camera.position.z = 100 * Math.cos(phi) * Math.cos(theta);
        
        // Update phi and theta based on target rotation with smooth easing
        phi += (targetRotationX - phi) * 0.1;
        theta += (targetRotationY - theta) * 0.1;
        
        // Ensure theta stays within bounds
        theta = Math.max(Math.min(theta, Math.PI / 2 - 0.1), -Math.PI / 2 + 0.1);
        
        camera.lookAt(0, 0, 0);
        
        renderer.render(scene, camera);
    }
    
    // Initialize everything
    function init() {
        initScene();
        loadPanorama(images[currentImage]);
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