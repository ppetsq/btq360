/**
 * The Overlook Hotel - Virtual Showroom
 * Main JavaScript for 360° panorama viewer
 */

// Image paths
const images = {
    day: "https://assets.360.petsq.works/Overlook/overlook_day_fixed.jpg",
    evening: "https://assets.360.petsq.works/Overlook/overlook_evening.jpg",
    night: "https://assets.360.petsq.works/Overlook/overlook_night2.jpg",
    off: "https://assets.360.petsq.works/Overlook/overlook_off.jpg"
};

// Global variables
let viewer;
let hasUserInteracted = false;
let isPanoramaLoaded = false;
let isPanning = false;

// Variables for auto-cycling
let cycleInterval = null;
const CYCLE_INTERVAL_MS = 5000; // 5 seconds
const cycleSequence = ['day', 'evening', 'night', 'off'];
let currentCycleIndex = 3; // Start at index 3 (off) so next is day (index 0)

// Show custom loader
function showLoader() {
    document.getElementById('custom-loader').style.opacity = '1';
}

// Hide custom loader
function hideLoader() {
    document.getElementById('custom-loader').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('custom-loader').style.display = 'none';
    }, 500);
}

// Fade in the scene
function fadeInScene() {
    document.querySelector('.viewer-container').style.opacity = '1';
    document.querySelector('.overlay').style.opacity = '1';
    document.getElementById('fade-overlay').style.opacity = '0';
}

// Initialize the viewer when the page loads
window.onload = function() {
    // Show loader first
    showLoader();
    
    // Initialize the viewer with original settings
    viewer = new PhotoSphereViewer.Viewer({
        container: document.querySelector('#viewer'),
        panorama: images.off,
        navbar: false,
        touchmoveTwoFingers: false,
        loadingTxt: '',
        loadingImg: null,
        defaultLong: 0,
        defaultLat: 0,
        mousemove: true,     // Enable mouse drag - critical for Safari!
        moveSpeed: 1,        // Default move speed
        moveInertia: true,   // Enable move inertia for smooth panning
        mousewheel: true,    // Enable mouse wheel for zooming
        defaultZoomLvl: 10   // Add this line - lower values = more zoomed out
    });
    
    // Set the active button
    setActiveButton('off');
    
    // When the panorama is loaded
    viewer.once('panorama-loaded', () => {
        isPanoramaLoaded = true;
        hideLoader();
        fadeInScene();
    });
    
    // When renderer is ready
    viewer.once('ready', () => {
        // You can also set zoom here if you prefer
        // viewer.zoom(50); // Lower values = more zoomed out
    });
    
    // Make sure viewer has a black background
    viewer.renderer.canvasContainer.style.backgroundColor = "#000";
    
    // Handle click for auto-rotation
    viewer.container.addEventListener("click", function(e) {
        // Ignore clicks on buttons or UI elements
        if (e.target.tagName === 'BUTTON' || e.target.closest('button') || 
            e.target.closest('.overlay')) {
            return;
        }
        
        togglePanning();
    });
};

// Toggle panning state
function togglePanning() {
    // Start panning on first click
    if (!hasUserInteracted) {
        hasUserInteracted = true;
        viewer.startAutorotate(0.1);
        isPanning = true;
    } else {
        // Toggle panning on subsequent clicks
        if (isPanning) {
            viewer.stopAutorotate();
        } else {
            viewer.startAutorotate(0.1);
        }
        isPanning = !isPanning;
    }
}

// Change the panorama view
function changeView(mode) {
    // Store current panning state before changing view
    const wasPanning = isPanning;
    
    viewer.setPanorama(images[mode]);
    setActiveButton(mode);
    
    // Update the cycle index to match the current view
    currentCycleIndex = cycleSequence.indexOf(mode);
    
    hasUserInteracted = true;
    
    // Only restart autorotate if it was previously active
    if (wasPanning) {
        viewer.startAutorotate(0.1);
    } else {
        viewer.stopAutorotate();
    }
    
    // Ensure isPanning reflects the current state
    isPanning = wasPanning;
}

// Set the active button
function setActiveButton(mode) {
    document.querySelectorAll('.controls button:not(#btn-cycle)').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');
}

// Toggle the description visibility
function toggleDescription() {
    const description = document.getElementById("description");

    if (description.style.opacity === "1" || description.style.opacity === "") {
        description.style.opacity = "0";
        setTimeout(() => {
            description.style.visibility = "hidden";
        }, 500);
    } else {
        description.style.visibility = "visible";
        setTimeout(() => {
            description.style.opacity = "1";
        }, 10);
    }
}

// Navigate back
function goBack() {
    window.history.back();
}

// Toggle auto-cycling
function toggleCycle() {
    const cycleButton = document.getElementById('btn-cycle');
    
    if (cycleInterval) {
        // Stop cycling
        clearInterval(cycleInterval);
        cycleInterval = null;
        cycleButton.classList.remove('active');
    } else {
        // Start cycling
        cycleButton.classList.add('active');
        
        // Move to the next view immediately
        cycleThroughViews();
        
        // Set up interval for automatic cycling
        cycleInterval = setInterval(cycleThroughViews, CYCLE_INTERVAL_MS);
    }
}

// Function to cycle through the views
function cycleThroughViews() {
    // Store current panning state
    const wasPanning = isPanning;
    
    // Move to the next index in the sequence
    currentCycleIndex = (currentCycleIndex + 1) % cycleSequence.length;
    
    // Change the view
    const nextView = cycleSequence[currentCycleIndex];
    
    // Change view but preserve panning state
    viewer.setPanorama(images[nextView]);
    setActiveButton(nextView);
    
    // Restore previous panning state
    if (wasPanning) {
        viewer.startAutorotate(0.1);
    } else {
        viewer.stopAutorotate();
    }
    
    isPanning = wasPanning;
}