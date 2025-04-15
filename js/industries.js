/**
 * Industry cards content swap animation with accordion-like behavior
 * Enhanced to provide smoother transitions between states
 */
document.addEventListener('DOMContentLoaded', function() {
    // Select all industry cards
    const cards = document.querySelectorAll('.industry-card');
    let activeCard = null; // Track the currently active card
    
    // Add click event to each card
    cards.forEach(card => {
        card.addEventListener('click', function() {
            // If clicking the same card that's already active, just toggle it
            if (this === activeCard) {
                // Use a brief timeout to ensure styles apply in the right sequence
                this.classList.toggle('active');
                
                // Update the activeCard reference based on new state
                if (!this.classList.contains('active')) {
                    activeCard = null;
                }
            } else {
                // Close the currently active card (if any)
                if (activeCard) {
                    activeCard.classList.remove('active');
                }
                
                // Use a brief delay to ensure the closing animation completes
                // before starting the opening animation
                setTimeout(() => {
                    // Open the clicked card
                    this.classList.add('active');
                    activeCard = this;
                }, 10); // A very short delay that won't be noticeable
            }
        });
    });
});