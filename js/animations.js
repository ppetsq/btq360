/**
 * Animations functionality for boutique360
 * Handles scroll-based animations and visual effects
 */

/**
 * Initialize animations
 */
function initAnimations() {
    // Add scroll event listener for animations with throttling for performance
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(function() {
                handleScrollAnimation();
                scrollTimeout = null;
            }, 10);
        }
    });
}

/**
 * Handle scroll-based animations
 * Reveals elements as they enter the viewport
 */
function handleScrollAnimation() {
    const animatedElements = document.querySelectorAll('.fade-in:not(.visible), .scale-in:not(.visible)');
    
    animatedElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const triggerPoint = window.innerHeight * 0.85; // Trigger when element is 85% up the viewport
        
        if (elementTop < triggerPoint) {
            element.classList.add('visible');
        }
    });
}

// Final polished hero section with smooth animations and scroll-to-next functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const hero = document.querySelector('.hero');
    const logoContainer = document.getElementById('hero-logo-container');
    const contentContainer = document.getElementById('hero-content-container');
    const heroCta = document.querySelector('.hero-cta');
    const heroBackground = document.querySelector('.hero-background');
    const industriesSection = document.querySelector('.industries'); // Next section after hero
    
    if (hero && logoContainer && contentContainer) {
        let transitionTriggered = false;
        let scrollingEnabled = false;
        let autoTransitionTimer;
        
        // Function to show content instead of logo
        function showContent(enableScrolling = false) {
            if (!transitionTriggered) {
                transitionTriggered = true;
                hero.classList.add('text-visible');
                clearTimeout(autoTransitionTimer);
                
                // Enable scrolling if requested (for click or timeout)
                scrollingEnabled = enableScrolling;
            }
        }
        
        // 2. Click to transition - enables scrolling immediately
        hero.addEventListener('click', function() {
            showContent(true); // Enable scrolling right away
        });
        
        // 3. First scroll attempt - prevent actual scrolling
        function handleFirstScroll(e) {
            if (!transitionTriggered) {
                // Prevent actual scrolling for the first wheel/touch event
                e.preventDefault();
                // Show content but don't enable scrolling yet
                showContent(false);
                
                // After transition completes, enable scrolling
                setTimeout(function() {
                    scrollingEnabled = true;
                }, 800); // Match transition duration
            }
        }
        
        // Add wheel event with passive: false to allow preventDefault
        window.addEventListener('wheel', handleFirstScroll, { passive: false });
        
        // For touch devices
        window.addEventListener('touchmove', handleFirstScroll, { passive: false });
        
        // 4. Set up scroll blocking for all scroll events
        window.addEventListener('wheel', function(e) {
            // If transition happened but scrolling not yet enabled, prevent scroll
            if (transitionTriggered && !scrollingEnabled) {
                e.preventDefault();
            }
        }, { passive: false });
        
        window.addEventListener('touchmove', function(e) {
            // If transition happened but scrolling not yet enabled, prevent scroll
            if (transitionTriggered && !scrollingEnabled) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // 5. Keyboard navigation
        window.addEventListener('keydown', function(e) {
            if ((e.key === ' ' || e.key === 'Enter') && !transitionTriggered) {
                showContent(true); // Enable scrolling right away
            }
        });
        
        // 6. CTA button click - scroll to next section
        if (heroCta && industriesSection) {
            heroCta.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Prevent triggering the hero click event
                
                // Enable scrolling
                scrollingEnabled = true;
                
                // Show content if not already visible
                if (!transitionTriggered) {
                    showContent(true);
                }
                
                // Scroll to the next section
                setTimeout(function() {
                    industriesSection.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            });
        }
    }
});