/**
 * The Overlook Hotel - Virtual Showroom
 * =====================================
 * This script manages the 360° panorama viewer experience with features like:
 * - Scene loading and transitions
 * - UI interactions and visibility toggles
 * - Auto-cycling through different lighting scenarios
 */

// ===========================
// CONFIGURATION
// ===========================

// Image paths for different lighting scenarios
const images = {
    day: "https://assets.360.petsq.works/Overlook/overlook_day_fixed.jpg",
    evening: "https://assets.360.petsq.works/Overlook/overlook_evening.jpg",
    night: "https://assets.360.petsq.works/Overlook/overlook_night2.jpg",
    off: "https://assets.360.petsq.works/Overlook/overlook_off.jpg"
};

// Auto-cycling configuration
const CYCLE_INTERVAL_MS = 5000; // Time between view changes (5 seconds)
const cycleSequence = ['day', 'evening', 'night', 'off'];

// ===========================
// STATE MANAGEMENT
// ===========================

// Global app state
let viewer;                       // Reference to PhotoSphere viewer instance
let cycleInterval = null;         // Interval reference for auto-cycling
let currentCycleIndex = 3;        // Start with 'off' view (index 3)
let lastTapTime = 0;              // For double-tap detection

// Boolean flags for tracking state
let hasUserInteracted = false;    // Whether user has interacted with the viewer
let isPanoramaLoaded = false;     // Whether panorama has finished loading
let isPanning = false;            // Whether auto-rotation is active
let isUIHidden = false;           // Whether UI elements are hidden
let hasShownUIHelpMessage = false; // Whether UI help message has been shown

// ===========================
// INITIALIZATION
// ===========================

// Initialize the viewer when the page loads
window.onload = function() {
    // Show loading indicator
    showLoader();
    
    // Initialize the 360° viewer
    viewer = new PhotoSphereViewer.Viewer({
        container: document.querySelector('#viewer'),
        panorama: images.off,
        navbar: false,                // Hide default navbar
        touchmoveTwoFingers: false,   // Allow single-finger navigation
        loadingTxt: '',               // Use custom loader instead
        loadingImg: null,
        defaultLong: 0,
        defaultLat: 0,
        mousemove: true,              // Critical for Safari compatibility
        moveSpeed: 1,
        moveInertia: true,            // Smooth panning
        mousewheel: true,             // Enable zoom with mousewheel
        defaultZoomLvl: 10            // Initial zoom level (lower = more zoomed out)
    });
    
    // Set the initial active button
    setActiveButton('off');
    
    // Set up event listeners
    setupEventListeners();
    
    // When the panorama is loaded
    viewer.once('panorama-loaded', () => {
        isPanoramaLoaded = true;
        hideLoader();
        fadeInScene();
    });
    
    // When renderer is ready
    viewer.once('ready', () => {
        // Ensure viewer has a black background
        viewer.renderer.canvasContainer.style.backgroundColor = "#000";
    });
};

// Set up all event listeners
function setupEventListeners() {
    // Panorama click for auto-rotation
    viewer.container.addEventListener("click", function(e) {
        // Ignore clicks on UI elements
        if (e.target.tagName === 'BUTTON' || e.target.closest('button') || 
            e.target.closest('.overlay')) {
            return;
        }
        togglePanning();
    });
    
    // Touch/click events for UI toggling
    document.addEventListener('touchstart', handleDoubleTap);
    document.addEventListener('click', handleDoubleTap);
    
    // Keyboard shortcut
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isUIHidden) {
            toggleUIVisibility();
        }
    });
    
    // Fix for iOS sticky hover states
    document.addEventListener('touchend', function() {
        resetIOSHoverStates();
    }, false);
}

// ===========================
// UI MANAGEMENT
// ===========================

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

// Fade in the scene once loaded
function fadeInScene() {
    document.querySelector('.viewer-container').style.opacity = '1';
    document.querySelector('.overlay').style.opacity = '1';
    document.getElementById('fade-overlay').style.opacity = '0';
}

// Set the active button based on current view
function setActiveButton(mode) {
    document.querySelectorAll('.controls button:not(#btn-cycle)').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-${mode}`).classList.add('active');
}

// Toggle the description visibility
function toggleDescription() {
    const description = document.getElementById("description");

    if (description.style.opacity === "1" || description.style.opacity === "") {
        hideDescription();
    } else {
        showDescription();
    }
    
    // Reset any stuck hover states on iOS
    resetIOSHoverStates();
}

// Hide the description
function hideDescription() {
    const description = document.getElementById("description");
    description.style.opacity = "0";
    setTimeout(() => {
        description.style.visibility = "hidden";
    }, 500);
}

// Show the description
function showDescription() {
    const description = document.getElementById("description");
    description.style.visibility = "visible";
    setTimeout(() => {
        description.style.opacity = "1";
    }, 10);
}

// Navigate back to previous page
function goBack() {
    window.history.back();
}

// Toggle visibility of all UI elements
function toggleUIVisibility() {
    const uiElements = [
        '.overlay',       // Title, description, etc.
        '.controls',      // Lighting buttons
        '.nav-container'  // Back button and coordinates
    ];

    // Toggle UI visibility for all elements
    uiElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.toggle('ui-hidden');
        }
    });

    // Update UI state
    isUIHidden = !isUIHidden;

    // Show help message only the first time UI is hidden
    if (isUIHidden && !hasShownUIHelpMessage) {
        showUIHelpNotification();
        hasShownUIHelpMessage = true;
    } else {
        // Remove notification if it exists when UI is shown
        removeUIHelpNotification();
    }
}

// Show notification about how to bring UI back
function showUIHelpNotification() {
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'ui-hide-notification';
    notificationContainer.innerHTML = 'Double-tap to bring controls back';
    document.body.appendChild(notificationContainer);

    // Auto-remove notification after 3 seconds
    setTimeout(removeUIHelpNotification, 3000);
}

// Remove UI help notification if it exists
function removeUIHelpNotification() {
    const existingNotification = document.getElementById('ui-hide-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
}

// Handle double-tap for UI toggling
function handleDoubleTap(event) {
    // Skip if tapping on interactive elements
    const isInteractiveElement = 
        event.target.closest('button') || 
        event.target.closest('.overlay') || 
        event.target.closest('.nav-container');

    if (isInteractiveElement) {
        return;
    }

    // Check if it's a double tap (within 300ms)
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;

    if (tapLength < 300 && tapLength > 0) {
        toggleUIVisibility();
    }

    lastTapTime = currentTime;
}

// Fix for iOS sticky hover states by creating/removing a dummy element
function resetIOSHoverStates() {
    const el = document.createElement('div');
    el.setAttribute('style', 'position: fixed; top: 0; height: 0; width: 0;');
    document.body.appendChild(el);
    document.body.removeChild(el);
}

// ===========================
// PANORAMA CONTROLS
// ===========================

// Toggle auto-rotation (panning)
function togglePanning() {
    // First interaction always starts panning
    if (!hasUserInteracted) {
        hasUserInteracted = true;
        viewer.startAutorotate(0.1);
        isPanning = true;
        return;
    }

    // Toggle panning state
    if (isPanning) {
        viewer.stopAutorotate();
        isPanning = false;
    } else {
        viewer.startAutorotate(0.1);
        isPanning = true;
    }
}

// Flag to track if we've hidden the description on the first view change
let hasHiddenDescriptionOnFirstViewChange = false;

// Change to a specific panorama view
function changeView(mode) {
    // Ensure first interaction triggers autorotate
    if (!hasUserInteracted) {
        hasUserInteracted = true;
        viewer.startAutorotate(0.1);
        isPanning = true;
    }

    // Store current panning state before changing view
    const wasPanning = isPanning;
    
    // Change panorama and update UI
    viewer.setPanorama(images[mode]);
    setActiveButton(mode);
    
    // Update the cycle index to match the current view
    currentCycleIndex = cycleSequence.indexOf(mode);
    
    // Hide description on first view change
    if (!hasHiddenDescriptionOnFirstViewChange) {
        hideDescription();
        hasHiddenDescriptionOnFirstViewChange = true;
    }
    
    // Restore previous panning state
    if (wasPanning) {
        viewer.startAutorotate(0.1);
    } else {
        viewer.stopAutorotate();
    }
    
    // Ensure isPanning reflects the correct state
    isPanning = wasPanning;
}

// ===========================
// AUTO-CYCLING FUNCTIONALITY
// ===========================

// Toggle automatic cycling through views
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
        
        // Hide description on first view change
        if (!hasHiddenDescriptionOnFirstViewChange) {
            hideDescription();
            hasHiddenDescriptionOnFirstViewChange = true;
        }
        
        // Move to the next view immediately
        cycleThroughViews();
        
        // Set up interval for automatic cycling
        cycleInterval = setInterval(cycleThroughViews, CYCLE_INTERVAL_MS);
    }
}

// Cycle to the next view in sequence
function cycleThroughViews() {
    // Store current panning state
    const wasPanning = isPanning;
    
    // Move to the next index in the sequence
    currentCycleIndex = (currentCycleIndex + 1) % cycleSequence.length;
    
    // Get the next view and apply it
    const nextView = cycleSequence[currentCycleIndex];
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