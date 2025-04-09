/**
 * Main JavaScript file for boutique360
 * Initializes all components when the DOM is loaded
 */

// Language redirection logic (only on first visit)
if (!sessionStorage.getItem('langRedirected')) {
    const userLang = navigator.language || navigator.userLanguage;

    if (userLang.toLowerCase().startsWith('nl')) {
        if (!window.location.pathname.startsWith('/nl')) {
            window.location.href = '/nl/';
        }
    }

    sessionStorage.setItem('langRedirected', 'true');
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all panoramas with a single function
    const panoramas = [
        { id: 'panorama-container', image: '/assets/images/360/union.jpg' },
        { id: 'experience-panorama-container', image: '/assets/images/360/lapland.jpg' },
        { id: 'results-panorama-container', image: '/assets/images/360/rotterdam.jpg' },
        { id: 'pre-launch-panorama-container', image: '/assets/images/360/kubus.jpg' },
        { id: 'founder-panorama-container', image: '/assets/images/360/lahti.jpg' }
    ];
    
    // Initialize everything
    panoramas.forEach(p => setupPanorama(p.id, p.image));
    initAnimations();
    initHeaderScroll();
    updateCountdown();
    setInterval(updateCountdown, 1000);
    initHoverEffects();
    
    // Run initial animation checks
    setTimeout(handleScrollAnimation, 100);
    
    // Apply initial hero animations
    setTimeout(function() {
        document.querySelectorAll('.hero-content > *').forEach(el => el.classList.add('visible'));
    }, 300);
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
        });
        
        pkg.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add subtle animation to CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button, .header-cta');
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
            this.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.15)';
            this.style.transform = 'none'; // Prevents any rising effect
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const logosSlide = document.querySelector('.logos-slide');
    const clientLogos = document.querySelectorAll('.client-logo');
  
    if (!logosSlide || clientLogos.length === 0) return;
  
    const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  
    if (isMobile) {
      // On mobile: no pause/resume interactions, just scroll
      logosSlide.style.animationPlayState = 'running';
      return;
    }
  
    let hoverCount = 0;
  
    clientLogos.forEach(logo => {
      logo.addEventListener('mouseenter', () => {
        hoverCount++;
        logosSlide.style.animationPlayState = 'paused';
      });
  
      logo.addEventListener('mouseleave', () => {
        hoverCount = Math.max(0, hoverCount - 1);
        if (hoverCount === 0) {
          logosSlide.style.animationPlayState = 'running';
        }
      });
    });
  });

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
// Add this to main.js or create a new file called preloader.js

document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const preloader = document.getElementById('page-preloader');
    const panoramaBackground = document.querySelector('.hero-background');
    const heroSection = document.querySelector('.hero');
    const logoContainer = document.querySelector('.logo-container');
    
    // Ensure logo is visible (as a fallback)
    if (logoContainer) {
        // Force repaint to ensure animation runs properly
        void logoContainer.offsetWidth; 
    }
    
    // Fade in the panorama and fade out the preloader after logo animation
    setTimeout(function() {
        // Fade in the panorama
        if (panoramaBackground) {
            panoramaBackground.classList.add('visible');
        }
        
        // Fade out the preloader
        if (preloader) {
            preloader.classList.add('fade-out');
        }
        
        // Allow scrolling and initialize animations after transition completes
        setTimeout(function() {
            document.body.classList.add('content-loaded');
            initPageAnimations();
        }, 1500);
    }, 1000); // Slightly longer delay to allow logo to fade in first
});

// Function to initialize all page animations
function initPageAnimations() {
    // Animate elements with fade-in class
    const fadeElements = document.querySelectorAll('.fade-in, .scale-in');
    
    // Set up intersection observer for animation triggers
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });
    
    // Observe all fade elements
    fadeElements.forEach(element => {
        observer.observe(element);
    });
    
    // Set up hero section interaction
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        // Show text on click
        heroSection.addEventListener('click', function() {
            heroSection.classList.add('text-visible');
        });
        
        // Show text on scroll
        window.addEventListener('scroll', function() {
            if (window.scrollY > 10) { // Start revealing after minimal scroll
                heroSection.classList.add('text-visible');
            }
        }, { once: true }); // Only trigger once
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Get all case study videos
    const caseVideos = document.querySelectorAll('.case-video');
    
    // For each video, implement a state-based approach to video handling
    caseVideos.forEach(video => {
        // Make sure video is muted for autoplay
        video.muted = true;
        video.setAttribute('playsinline', '');
        
        // Add metadata to the video element to track state
        video._state = {
            playingOrAttempting: false,
            inViewport: false
        };
        
        // Force load the video
        video.load();
        
        // Create an intersection observer for viewport detection
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0]; // Should only be one entry
            const wasInViewport = video._state.inViewport;
            video._state.inViewport = entry.isIntersecting;
            
            // Only take action if visibility state changed
            if (video._state.inViewport && !wasInViewport) {
                // Coming into view - attempt to play if not already playing
                if (!video._state.playingOrAttempting) {
                    attemptPlayback(video);
                }
            } else if (!video._state.inViewport && wasInViewport) {
                // Going out of view - pause if playing
                video.pause();
                video._state.playingOrAttempting = false;
            }
        }, { threshold: 0.1 });
        
        // Start observing the video
        observer.observe(video);
        
        // Initial playback attempt if video is in viewport
        if (isElementInViewport(video)) {
            video._state.inViewport = true;
            attemptPlayback(video);
        }
        
        // Add click-to-play fallback
        const caseStudyImage = video.closest('.case-study-image');
        if (caseStudyImage) {
            caseStudyImage.addEventListener('click', function(e) {
                // If this is a link, don't interfere with normal behavior
                if (e.target.tagName === 'A') return;
                
                // Only prevent default if we're handling the click for video playback
                if (!video.paused) return; // Already playing, don't interfere
                
                e.preventDefault();
                e.stopPropagation();
                attemptPlayback(video);
            });
        }
    });
    
    // Function to attempt playback with proper state tracking
    function attemptPlayback(video) {
        // Mark that we're attempting playback
        video._state.playingOrAttempting = true;
        
        // Attempt to play
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Success - keep state as is
                    console.log('Video playback started');
                })
                .catch(error => {
                    // Failure - reset state so we can try again
                    console.log('Playback failed:', error.message);
                    video._state.playingOrAttempting = false;
                });
        }
    }
    
    // Helper function to check if element is in viewport
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
});