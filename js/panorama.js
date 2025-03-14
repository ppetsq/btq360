/**
 * Panorama functionality for boutique360
 * Handles the 360° panorama views with hotspots
 */

// Hotspot definitions with spherical coordinates
const hotspotsData = {
    'panorama-container': [
        {
            phi: Math.PI / 4,
            theta: Math.PI / 6,
            title: "Mood Lighting",
            description: "Carefully crafted evening lighting setting enhances ambiance."
        },
        {
            phi: Math.PI * 1.5,
            theta: Math.PI / 8,
            title: "Bed & Linens",
            description: "Premium king-size bed with 400-thread-count cotton sheets."
        },
        {
            phi: Math.PI * 0.8,
            theta: -Math.PI / 8,
            title: "Window View",
            description: "Views of the canal showcase Amsterdam's historic architecture."
        }
    ],
    'experience-panorama-container': [
        {
            phi: Math.PI * 0.3,
            theta: Math.PI / 10,
            title: "Lounge Area",
            description: "Modern workspace with high-speed WiFi and panoramic views."
        },
        {
            phi: Math.PI * 1.7,
            theta: Math.PI / 12,
            title: "Night Ambiance",
            description: "Evening lighting designed for relaxation after a busy day."
        }
    ]
};

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
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, panoramaContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    panoramaContainer.appendChild(renderer.domElement);
    
    // Create sphere geometry for the panorama
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    
    // Function to convert spherical coordinates to Vector3
    function sphericalToCartesian(phi, theta, radius) {
        return new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(theta),
            radius * Math.cos(phi) * Math.cos(theta)
        );
    }
    
    // Add CSS for hotspot pulsing animation if not already added
    if (!document.getElementById('hotspot-styles')) {
        const style = document.createElement('style');
        style.id = 'hotspot-styles';
        style.textContent = `
            @keyframes hotspot-pulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(255, 223, 77, 0.7);
                }
                70% {
                    box-shadow: 0 0 0 10px rgba(255, 223, 77, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(255, 223, 77, 0);
                }
            }
            
            .panorama-hotspot {
                position: absolute;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background-color: rgba(255, 223, 77, 0.7);
                border: 2px solid white;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                transform: translate(-50%, -50%);
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 16px;
                color: #0f0f0f;
                font-weight: bold;
                animation: hotspot-pulse 2s infinite;
                z-index: 20;
                pointer-events: auto;
                transition: all 0.3s ease;
            }
            
            .panorama-hotspot:hover {
                transform: translate(-50%, -50%) scale(1.1);
                background-color: rgba(255, 223, 77, 0.9);
            }
            
            .panorama-tooltip {
                position: absolute;
                background-color: rgba(15, 15, 15, 0.95);
                border-radius: 6px;
                padding: 15px;
                width: 260px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 223, 77, 0.5);
                opacity: 0;
                pointer-events: none;
                z-index: 100;
                transition: opacity 0.3s ease, transform 0.3s ease;
                top: 35px;
                left: 50%;
                transform: translateX(-50%);
            }
            
            .panorama-tooltip.visible {
                opacity: 1;
                pointer-events: auto;
            }
            
            .panorama-tooltip h4 {
                color: #FFDF4D;
                margin: 0 0 8px 0;
                font-size: 16px;
                font-weight: 600;
                font-family: 'Inter', sans-serif;
            }
            
            .panorama-tooltip p {
                color: #FFFFFF;
                margin: 0;
                font-size: 14px;
                line-height: 1.5;
                font-family: 'Inter', sans-serif;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Load panorama texture
    const textureLoader = new THREE.TextureLoader();
    
    let updateHotspotsPositions = null;
    
    textureLoader.load(
        imageUrl, 
        function(texture) {
            const material = new THREE.MeshBasicMaterial({ 
                map: texture
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);
            
            // Add hotspots after panorama is loaded
            if (hotspotsData[containerId] && hotspotsData[containerId].length > 0) {
                // Create hotspot container
                const hotspotContainer = document.createElement('div');
                hotspotContainer.className = 'hotspot-container';
                hotspotContainer.style.position = 'absolute';
                hotspotContainer.style.top = '0';
                hotspotContainer.style.left = '0';
                hotspotContainer.style.width = '100%';
                hotspotContainer.style.height = '100%';
                hotspotContainer.style.pointerEvents = 'none';
                hotspotContainer.style.zIndex = '10';
                panoramaContainer.appendChild(hotspotContainer);
                
                // Store references to created hotspots
                const hotspotElements = [];
                
                // Clear any existing hotspots (in case of reinitialization)
                const existingHotspots = panoramaContainer.querySelectorAll('.panorama-hotspot');
                existingHotspots.forEach(el => el.remove());
                
                // Create new hotspots
                hotspotsData[containerId].forEach((hotspotData, index) => {
                    const position = sphericalToCartesian(
                        hotspotData.phi, 
                        hotspotData.theta, 
                        480
                    );
                    
                    // Create hotspot element
                    const hotspot = document.createElement('div');
                    hotspot.className = 'panorama-hotspot';
                    hotspot.innerHTML = '<span style="transform: translateY(-1px)">+</span>';
                    hotspotContainer.appendChild(hotspot);
                    
                    // Create tooltip
                    const tooltip = document.createElement('div');
                    tooltip.className = 'panorama-tooltip';
                    
                    const title = document.createElement('h4');
                    title.innerText = hotspotData.title;
                    tooltip.appendChild(title);
                    
                    const description = document.createElement('p');
                    description.innerText = hotspotData.description;
                    tooltip.appendChild(description);
                    
                    hotspot.appendChild(tooltip);
                    
                    // Event listener for hotspot click
                    hotspot.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Close all tooltips
                        document.querySelectorAll('.panorama-tooltip').forEach(tip => {
                            tip.classList.remove('visible');
                        });
                        
                        // Toggle this tooltip
                        tooltip.classList.toggle('visible');
                    });
                    
                    // Store reference
                    hotspotElements.push({
                        element: hotspot,
                        tooltip: tooltip,
                        position: position
                    });
                });
                
                // Click on panorama to close tooltips
                panoramaContainer.addEventListener('click', function(e) {
                    if (!e.target.closest('.panorama-hotspot')) {
                        document.querySelectorAll('.panorama-tooltip').forEach(tip => {
                            tip.classList.remove('visible');
                        });
                    }
                });
                
                // Function to update hotspot positions
                updateHotspotsPositions = function() {
                    hotspotElements.forEach(hotspotObj => {
                        const { element, position } = hotspotObj;
                        
                        // Create a temp vector for calculations
                        const tempPosition = position.clone();
                        
                        // Get camera looking direction
                        const cameraDirection = new THREE.Vector3(0, 0, -1);
                        cameraDirection.applyQuaternion(camera.quaternion);
                        
                        // Calculate dot product to determine if hotspot is in front of camera
                        const dot = position.clone().normalize().dot(cameraDirection);
                        const isBehind = dot <= 0;
                        
                        // Project the position to screen space
                        tempPosition.project(camera);
                        
                        // Convert from normalized device coordinates to screen coordinates
                        const x = (tempPosition.x * 0.5 + 0.5) * panoramaContainer.clientWidth;
                        const y = (-tempPosition.y * 0.5 + 0.5) * panoramaContainer.clientHeight;
                        
                        // Hide if behind camera or outside viewport with a margin
                        const margin = 50; // pixels
                        if (isBehind || 
                            x < -margin || 
                            x > panoramaContainer.clientWidth + margin || 
                            y < -margin || 
                            y > panoramaContainer.clientHeight + margin) {
                            element.style.display = 'none';
                        } else {
                            // Position and show the hotspot
                            element.style.display = 'flex';
                            element.style.left = `${x}px`;
                            element.style.top = `${y}px`;
                        }
                    });
                };
            }
            
            // Start animation
            animate();
        },
        null,
        function(err) {
            console.error('Error loading panorama texture:', err);
        }
    );
    
    // Interactive panning variables
    let isUserInteracting = false;
    let mouseX = 0, mouseY = 0;
    let mouseXOnMouseDown = 0, mouseYOnMouseDown = 0;
    let targetRotationX = 0, targetRotationY = 0;
    let targetRotationXOnMouseDown = 0, targetRotationYOnMouseDown = 0;
    
    // Add interactivity
    renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    renderer.domElement.addEventListener('touchstart', onDocumentTouchStart, false);
    
    function onDocumentMouseDown(event) {
        event.preventDefault();
        
        isUserInteracting = true;
        
        mouseXOnMouseDown = event.clientX;
        mouseYOnMouseDown = event.clientY;
        
        targetRotationXOnMouseDown = targetRotationX;
        targetRotationYOnMouseDown = targetRotationY;
        
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mouseup', onDocumentMouseUp, false);
    }
    
    function onDocumentMouseMove(event) {
        mouseX = event.clientX;
        mouseY = event.clientY;
        
        targetRotationX = targetRotationXOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
        targetRotationY = targetRotationYOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.02;
        
        // Limit vertical rotation to prevent flipping
        targetRotationY = Math.max(Math.min(targetRotationY, Math.PI / 2), -Math.PI / 2);
    }
    
    function onDocumentMouseUp() {
        isUserInteracting = false;
        
        document.removeEventListener('mousemove', onDocumentMouseMove, false);
        document.removeEventListener('mouseup', onDocumentMouseUp, false);
    }
    
    function onDocumentTouchStart(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            
            mouseXOnMouseDown = event.touches[0].pageX;
            mouseYOnMouseDown = event.touches[0].pageY;
            
            targetRotationXOnMouseDown = targetRotationX;
            targetRotationYOnMouseDown = targetRotationY;
            
            document.addEventListener('touchmove', onDocumentTouchMove, false);
            document.addEventListener('touchend', onDocumentTouchEnd, false);
        }
    }
    
    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            
            mouseX = event.touches[0].pageX;
            mouseY = event.touches[0].pageY;
            
            targetRotationX = targetRotationXOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05;
            targetRotationY = targetRotationYOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.05;
            
            // Limit vertical rotation
            targetRotationY = Math.max(Math.min(targetRotationY, Math.PI / 2), -Math.PI / 2);
        }
    }
    
    function onDocumentTouchEnd() {
        document.removeEventListener('touchmove', onDocumentTouchMove, false);
        document.removeEventListener('touchend', onDocumentTouchEnd, false);
    }
    
    // Auto-panning animation with smooth interpolation
    let panPosition = 0;
    let autoRotateSpeed = 0.0003; // Lower for smoother rotation
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Apply auto rotation only when user is not interacting
        if (!isUserInteracting) {
            panPosition += autoRotateSpeed;
            camera.rotation.y = panPosition;
        } else {
            // Apply smooth rotation based on user interaction
            camera.rotation.y += (targetRotationX - camera.rotation.y) * 0.05;
            camera.rotation.x += (targetRotationY - camera.rotation.x) * 0.05;
        }
        
        // Update hotspot positions if available
        if (updateHotspotsPositions) {
            updateHotspotsPositions();
        }
        
        renderer.render(scene, camera);
    }
    
    // Handle window resize with better performance
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            const width = window.innerWidth;
            const height = panoramaContainer.clientHeight;
            
            // Update camera
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            
            // Update renderer
            renderer.setSize(width, height);
        }, 250);
    }
    
    window.addEventListener('resize', handleResize);
    // Initial resize call to ensure proper setup
    handleResize();
}

// Export the functions
window.setupPanorama = setupPanorama;