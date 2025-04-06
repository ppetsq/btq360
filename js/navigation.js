document.addEventListener('DOMContentLoaded', function() {
    // Find the header right section
    const headerRight = document.querySelector('.header-right');
    
    // Create hamburger menu
    function createHamburgerMenu() {
        if (headerRight && !headerRight.querySelector('.hamburger-menu')) {
            // Remove existing header CTA
            const existingCTA = headerRight.querySelector('.header-cta');
            if (existingCTA) {
                existingCTA.remove();
            }
            
            // Create hamburger menu
            const hamburgerMenu = document.createElement('button');
            hamburgerMenu.classList.add('hamburger-menu');
            hamburgerMenu.innerHTML = `
                <span></span>
                <span></span>
                <span></span>
            `;
            headerRight.appendChild(hamburgerMenu);
        }
    }

    // Create navigation menu
    function createNavigationMenu() {
        // Check if navigation already exists
        if (document.querySelector('.site-navigation')) return;

        const navMenuHTML = `
            <nav class="site-navigation">
                <div class="navigation-overlay"></div>
                <div class="navigation-content">
                    <ul class="nav-menu">
                        <li><a href="#home" class="nav-link">home</a></li>
                        <li><a href="#use-cases" class="nav-link">use cases</a></li>
                        <li><a href="#references" class="nav-link">references</a></li>
                        <li><a href="#process" class="nav-link">process</a></li>
                        <li><a href="#packages" class="nav-link">pricing</a></li>
                        <li><a href="#faq" class="nav-link">faq</a></li>
                        <li><a href="#contact" class="nav-link">contact</a></li>
                    </ul>
                    <div class="nav-cta-section">
                        <div class="nav-special-offer">
                            <span>30% off until 30th april</span>
                        </div>
                    </div>
                </div>
            </nav>
        `;
        
        document.body.insertAdjacentHTML('beforeend', navMenuHTML);
    }

    // Smooth scroll to section
    function smoothScrollToSection(targetId) {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
    }

    // Initialize navigation functionality
    function initNavigation() {
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        const navMenu = document.querySelector('.site-navigation');
        const navOverlay = document.querySelector('.navigation-overlay');
        const navLinks = document.querySelectorAll('.nav-link');

        // Toggle navigation
        function toggleNavigation(e) {
            e.preventDefault();
            
            // Toggle menu open/closed
            navMenu.classList.toggle('open');
            hamburgerMenu.classList.toggle('open');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }

        // Handle link clicks
        function handleLinkClick(e) {
            e.preventDefault();
            
            // Get the href attribute
            const targetId = e.target.getAttribute('href');
            
            // Close navigation menu
            toggleNavigation(e);
            
            // Scroll to section after a short delay to allow menu to close
            setTimeout(() => {
                smoothScrollToSection(targetId);
            }, 300);
        }

        // Add event listeners
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', toggleNavigation);
        }
        
        if (navOverlay) {
            navOverlay.addEventListener('click', toggleNavigation);
        }

        // Close navigation when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', handleLinkClick);
        });
    }

    // Run initialization
    createHamburgerMenu();
    createNavigationMenu();
    initNavigation();
});