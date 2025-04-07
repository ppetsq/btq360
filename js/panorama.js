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
    
    // Special handling for founder section - use more zoom (lower FOV value)
    const fov = containerId === 'founder-panorama-container' ? 35 : 75;
    const camera = new THREE.PerspectiveCamera(fov, 16/9, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        preserveDrawingBuffer: true // Prevents flashing on resize
    });
    renderer.setSize(panoramaContainer.clientWidth, panoramaContainer.clientHeight);
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
            // Check if this is the founder section to apply more blur
            if (containerId === 'founder-panorama-container') {
                // Apply more blur to the texture for the founder section
                texture.minFilter = THREE.LinearFilter;
                    // Add better texture settings for performance
                    texture.generateMipmaps = false; // Reduces memory usage
                    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Improves quality at angles
                texture.magFilter = THREE.LinearFilter;
                
                // Create a blur effect using THREE.ShaderMaterial
                const blurMaterial = new THREE.MeshBasicMaterial({ 
                    map: texture,
                    // Increase opacity of the material to create a soft blur effect
                    opacity: 0.6,
                    transparent: true
                });
                
                const sphere = new THREE.Mesh(geometry, blurMaterial);
                scene.add(sphere);
            } else {
                // Regular panorama with standard settings
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                
                const material = new THREE.MeshBasicMaterial({ 
                    map: texture
                });
                
                const sphere = new THREE.Mesh(geometry, material);
                scene.add(sphere);
            }
            
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
        const width = panoramaContainer.clientWidth;
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