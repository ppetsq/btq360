/**
 * Panorama functionality for boutique360
 * Handles the 360° panorama views with simple auto-panning
 */

/**
 * Setup a 360° panorama in the specified container
 * @param {string} containerId - ID of the container element
 * @param {string} imageUrl - URL of the panorama image
 */
function setupPanorama(containerId, imageUrl) {
    const panoramaContainer = document.getElementById(containerId);
    if (!panoramaContainer) return;
    
    // Create scene, camera and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / panoramaContainer.clientHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        preserveDrawingBuffer: true // Prevents flashing on resize
    });
    renderer.setSize(window.innerWidth, panoramaContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    panoramaContainer.appendChild(renderer.domElement);
    
    // Create sphere geometry for the panorama
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    
    // Load panorama texture
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
        imageUrl, 
        function(texture) {
            // Apply a slight blur to the texture for aesthetic effect
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            const material = new THREE.MeshBasicMaterial({ 
                map: texture
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);
            
            // Start animation immediately
            animate();
        },
        null,
        function(err) {
            console.error('Error loading panorama texture:', err);
        }
    );
    
    // Auto-panning animation
    let panPosition = 0;
    let autoRotateSpeed = 0.0003; // Slow, smooth rotation
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Simple auto rotation only
        panPosition += autoRotateSpeed;
        camera.rotation.y = panPosition;
        
        renderer.render(scene, camera);
    }
    
    // Handle window resize for smooth transitions
    function handleResize() {
        const width = window.innerWidth;
        const height = panoramaContainer.clientHeight;
        
        // Update camera
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        // Update renderer
        renderer.setSize(width, height);
    }
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Initial resize call
    handleResize();
}

// Export the function
window.setupPanorama = setupPanorama;