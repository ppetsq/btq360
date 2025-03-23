/**
 * Initialize package tabs functionality
 */
function initPackageTabs() {
    const tabs = document.querySelectorAll('.package-tab');
    if (!tabs.length) return;
    
    // Add click event to each tab
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Get the tab type
            const tabType = this.getAttribute('data-tab');
            
            // For a real implementation, you would filter packages here
            // For this demo, we'll just show an alert with future functionality
            console.log(`Filtering packages for: ${tabType}`);
            
            // Optional visual feedback
            const packages = document.querySelectorAll('.package');
            packages.forEach(pkg => {
                pkg.style.opacity = '0.7';
                pkg.style.transform = 'scale(0.98)';
                
                setTimeout(() => {
                    pkg.style.opacity = '1';
                    pkg.style.transform = 'scale(1)';
                }, 300);
            });
        });
    });
}

/**
 * Initialize case study panoramas
 */
function initCaseStudyPanoramas() {
    // Setup case study panoramas with appropriate images
    if (document.getElementById('case-hotel-panorama')) {
        setupPanorama('case-hotel-panorama', 'https://assets.360.petsq.works/Overlook/overlook_evening.jpg');
    }
    
    if (document.getElementById('case-factory-panorama')) {
        setupPanorama('case-factory-panorama', 'https://assets.360.petsq.works/spring-rolls/factory.jpg');
    }
}

// Update document ready function to include new initializations
document.addEventListener('DOMContentLoaded', function() {
    // Existing initializations
    setupPanorama('panorama-container', 'https://assets.360.petsq.works/union/union-eve.jpg');
    setupPanorama('experience-panorama-container', 'https://assets.360.petsq.works/lapland/lapland-eve.jpg');
    setupPanorama('founder-panorama-container', 'https://assets.360.petsq.works/lahti/lahti-eve.jpg');
    
    // New initializations
    initPackageTabs();
    initCaseStudyPanoramas();
    
    // Initialize animations
    initAnimations();
    
    // Initialize header scroll effects
    initHeaderScroll();
    
    // Initialize countdown
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Initialize hover effects
    initHoverEffects();
    
    // Run initial animation check for elements above the fold
    setTimeout(handleScrollAnimation, 100);
    
    // Apply animations to hero section immediately without scroll
    setTimeout(function() {
        document.querySelectorAll('.hero-content > *').forEach((element) => {
            element.classList.add('visible');
        });
    }, 300);
});