// Industry cards content swap animation
document.addEventListener('DOMContentLoaded', function() {
    // Select all industry cards
    const cards = document.querySelectorAll('.industry-card');
    
    // Add click event to each card
    cards.forEach(card => {
        card.addEventListener('click', function() {
            // Toggle active class
            this.classList.toggle('active');
        });
    });
});