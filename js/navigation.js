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

    function createNavigationMenu() {
        if (document.querySelector('.site-navigation')) return;
    
        const isDutch = window.location.pathname.includes('/nl');
        
        const navTexts = isDutch
            ? {
                home: 'home',
                useCases: 'toepassingen',
                references: 'klanten',
                process: 'proces',
                pricing: 'prijzen',
                faq: 'faq',
                contact: 'contact',
                offer: '30% korting tot 30 april'
            }
            : {
                home: 'home',
                useCases: 'use cases',
                references: 'references',
                process: 'process',
                pricing: 'pricing',
                faq: 'faq',
                contact: 'contact',
                offer: '30% off until 30th april'
            };
    
        const navMenuHTML = `
            <nav class="site-navigation">
                <div class="navigation-overlay"></div>
                <div class="navigation-content">
                    <ul class="nav-menu">
                        <li><a href="#home" class="nav-link">${navTexts.home}</a></li>
                        <li><a href="#use-cases" class="nav-link">${navTexts.useCases}</a></li>
                        <li><a href="#references" class="nav-link">${navTexts.references}</a></li>
                        <li><a href="#process" class="nav-link">${navTexts.process}</a></li>
                        <li><a href="#packages" class="nav-link">${navTexts.pricing}</a></li>
                        <li><a href="#faq" class="nav-link">${navTexts.faq}</a></li>
                        <li><a href="#contact" class="nav-link">${navTexts.contact}</a></li>
                    </ul>
                    <div class="nav-cta-section">
                        <div class="nav-special-offer">
                            <span>${navTexts.offer}</span>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    
        document.body.insertAdjacentHTML('beforeend', navMenuHTML);
    }

    // Initialize navigation functionality
    function initNavigation() {
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        const navMenu = document.querySelector('.site-navigation');
        const navLinks = document.querySelectorAll('.nav-link');

        // Toggle navigation menu open/closed
        function toggleMenu() {
            navMenu.classList.toggle('open');
            hamburgerMenu.classList.toggle('open');
            
            if (navMenu.classList.contains('open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
        
        // Close the navigation menu
        function closeMenu() {
            navMenu.classList.remove('open');
            hamburgerMenu.classList.remove('open');
            document.body.style.overflow = '';
        }

        // Handle hamburger menu click
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', toggleMenu);
        }

        // Handle navigation overlay click
        const navOverlay = document.querySelector('.navigation-overlay');
        if (navOverlay) {
            navOverlay.addEventListener('click', closeMenu);
        }

        // Handle navigation link clicks
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Close the menu when a link is clicked
                closeMenu();
                
                // Let the browser handle the hash navigation naturally
                // The key change: NOT preventing default behavior for hash links
            });
        });
    }

    // Run initialization
    createHamburgerMenu();
    createNavigationMenu();
    initNavigation();
});