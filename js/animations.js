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

/**
 * Hero section animation - complete rebuild
 */
document.addEventListener('DOMContentLoaded', function() {
    // Elements with new structure
    const heroSection = document.querySelector('.hero');
    const logoContainer = document.getElementById('hero-logo-container');
    const contentContainer = document.getElementById('hero-content-container');
    const heroButton = document.querySelector('.hero-cta');
    const body = document.body;
    
    // Animation state
    let animationComplete = false;
    let animationInProgress = false;
    
    // Function to reveal the content
    function revealContent() {
        // Don't do anything if animation is already in progress
        if (animationInProgress || animationComplete) return;
        
        // Set flag to indicate animation is in progress
        animationInProgress = true;
        
        // Temporarily disable scrolling
        body.style.overflow = 'hidden';
        
        // Add class to trigger transitions
        heroSection.classList.add('text-visible');
        
        // Re-enable scrolling after animation completes
        setTimeout(() => {
            body.style.overflow = '';
            animationComplete = true;
            animationInProgress = false;
        }, 800);
    }
    
    // Scroll handler
    const scrollHandler = function(e) {
        // If animation is already complete, allow normal scrolling
        if (animationComplete) return;
        
        // Prevent default scroll
        e.preventDefault();
        
        // Trigger the reveal animation
        revealContent();
        
        // Return to top to ensure hero section stays visible during animation
        window.scrollTo(0, 0);
    };
    
    // Add wheel event listener for more precise scroll control
    window.addEventListener('wheel', scrollHandler, { passive: false });
    
    // Touch events for mobile
    window.addEventListener('touchmove', function(e) {
        if (!animationComplete) {
            e.preventDefault();
            revealContent();
        }
    }, { passive: false });
    
    // Click handler for hero section
    heroSection.addEventListener('click', function(e) {
        // Don't proceed if we clicked the CTA button
        if (e.target.closest('.hero-cta')) return;
        
        if (!animationComplete) {
            e.preventDefault();
            revealContent();
        }
    });
    
    // Set timeout for auto-reveal after 5 seconds
    setTimeout(function() {
        if (!animationComplete) {
            revealContent();
        }
    }, 5000);
    
    // Setup CTA button to scroll to next section
    if (heroButton) {
        heroButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // If animation isn't complete, reveal content first
            if (!animationComplete) {
                revealContent();
                
                // Wait for animation to complete before scrolling
                setTimeout(() => {
                    const nextSection = document.querySelector('.industries');
                    if (nextSection) {
                        nextSection.scrollIntoView({behavior: 'smooth'});
                    }
                }, 800);
            } else {
                // Animation is complete, just scroll
                const nextSection = document.querySelector('.industries');
                if (nextSection) {
                    nextSection.scrollIntoView({behavior: 'smooth'});
                }
            }
        });
    }
});

