/**
 * Main JavaScript file for boutique360
 * Initializes all components when the DOM is loaded
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize panoramas
    setupPanorama('panorama-container', 'https://assets.360.petsq.works/union/union-eve.jpg');
    setupPanorama('experience-panorama-container', 'https://assets.360.petsq.works/lapland/lapland-eve.jpg');
    setupPanorama('founder-panorama-container', 'https://assets.360.petsq.works/lahti/lahti-eve.jpg');
    
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
    
    // Initialize IntersectionObserver for more sophisticated animations if supported
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };
        
        const handleIntersect = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Stop observing once it's visible
                }
            });
        };
        
        const observer = new IntersectionObserver(handleIntersect, observerOptions);
        
        // Observe all animatable elements
        const elements = document.querySelectorAll('.fade-in, .scale-in');
        elements.forEach(element => {
            observer.observe(element);
        });
    }
});

/**
 * Initialize hover effects for various elements
 */
function initHoverEffects() {
    // Enhanced hover animations for packages
    const packages = document.querySelectorAll('.package');
    packages.forEach(pkg => {
        pkg.addEventListener('mouseenter', function() {
            // Add subtle pulse animation
            this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease';
            this.style.transform = 'translateY(-5px)';
        });
        
        pkg.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Logo hover effect
    const logos = document.querySelectorAll('.logo');
    logos.forEach(logo => {
        logo.addEventListener('mouseenter', function() {
            const img = this.querySelector('img');
            img.style.transition = 'transform 0.3s ease';
            img.style.transform = 'scale(1.05)';
        });
        
        logo.addEventListener('mouseleave', function() {
            const img = this.querySelector('img');
            img.style.transform = 'scale(1)';
        });
    });
    
    // Add subtle animation to CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button, .header-cta');
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
            this.style.boxShadow = '0 0 15px rgba(255, 223, 77, 0.25)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Enhanced client logo hover effect
    const clientLogos = document.querySelectorAll('.client-logo');
    clientLogos.forEach(logo => {
        logo.addEventListener('mouseenter', function() {
            // Pause the animation when hovering over a logo
            const logoContainer = document.querySelector('.client-logos');
            logoContainer.style.animationPlayState = 'paused';
            
            // Highlight the hovered logo
            this.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            this.style.transform = 'scale(1.1)';
            this.style.opacity = '1';
        });
        
        logo.addEventListener('mouseleave', function() {
            // Resume the animation
            const logoContainer = document.querySelector('.client-logos');
            logoContainer.style.animationPlayState = 'running';
            
            // Reset the logo
            this.style.transform = 'scale(1)';
            this.style.opacity = '0.9';
        });
    });
}

/**
 * Initialize header scroll effects
 */
function initHeaderScroll() {
    // Enhanced Header scroll animation
    function handleHeaderScroll() {
        const header = document.getElementById('site-header');
        const heroLogo = document.querySelector('.hero-logo');
        const scrollPosition = window.scrollY;
        const lastScrollTop = this.lastScrollTop || 0;
        
        // When scrolled past threshold, show header
        if (scrollPosition > 100) {
            // Different animation for scrolling down vs up
            if (scrollPosition > lastScrollTop) {
                // Scrolling down - subtle animation
                header.style.transform = 'translateY(0)';
                header.style.transition = 'opacity 0.4s ease, transform 0.4s ease, background-color 0.4s ease';
            } else {
                // Scrolling up - quicker appearance
                header.style.transform = 'translateY(0)';
                header.style.transition = 'opacity 0.25s ease, transform 0.25s ease, background-color 0.25s ease';
            }
            
            header.style.backgroundColor = 'rgba(5, 5, 5, 0.9)';
            header.style.backdropFilter = 'blur(5px)';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
            header.style.borderBottom = '1px solid rgba(239, 89, 0, 0.1)';
            header.style.opacity = '1';
            header.style.visibility = 'visible';
            
            // Fade out the hero logo as we scroll
            if (heroLogo) {
                heroLogo.style.opacity = Math.max(0, 1 - scrollPosition / 300);
            }
        } else {
            header.style.backgroundColor = 'transparent';
            header.style.backdropFilter = 'none';
            header.style.boxShadow = 'none';
            header.style.borderBottom = 'none';
            header.style.opacity = '0';
            header.style.visibility = 'hidden';
            header.style.transform = 'translateY(-5px)';
            
            // Restore hero logo opacity
            if (heroLogo) {
                heroLogo.style.opacity = 1;
            }
        }
        
        this.lastScrollTop = scrollPosition;
    }
    
    window.addEventListener('scroll', handleHeaderScroll);
    
    // Initialize header state
    handleHeaderScroll();
}