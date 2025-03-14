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