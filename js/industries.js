// Industry cards content swap animation with accordion-like behavior
document.addEventListener('DOMContentLoaded', function() {
    // Select all industry cards
    const cards = document.querySelectorAll('.industry-card');
    let activeCard = null; // Track the currently active card
    
    // Add click event to each card
    cards.forEach(card => {
        card.addEventListener('click', function() {
            // If clicking the same card that's already active, just toggle it
            if (this === activeCard) {
                this.classList.toggle('active');
                activeCard = this.classList.contains('active') ? this : null;
            } else {
                // Close the currently active card (if any)
                if (activeCard) {
                    activeCard.classList.remove('active');
                }
                
                // Open the clicked card
                this.classList.add('active');
                activeCard = this;
            }
        });
    });
});