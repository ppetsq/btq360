// Final solution for industry cards
document.addEventListener('DOMContentLoaded', function() {
    // Select all cards and store them in an array
    const cards = Array.from(document.querySelectorAll('.industry-card'));
    
    // Process each card independently
    cards.forEach(function setupCard(card) {
      // Create a content wrapper for the description
      const description = card.querySelector('p');
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'industry-card-content';
      
      // Remove description from its current location
      if (description && description.parentNode) {
        description.parentNode.removeChild(description);
        
        // Add description to the content wrapper
        contentWrapper.appendChild(description);
        
        // Add content wrapper to the card
        card.appendChild(contentWrapper);
      }
      
      // Create toggle indicator
      const toggleIcon = document.createElement('div');
      toggleIcon.className = 'toggle-indicator';
      toggleIcon.innerHTML = '+';
      card.appendChild(toggleIcon);
      
      // Clear any existing click handlers by cloning and replacing
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);
      
      // Add click handler to the new card
      newCard.addEventListener('click', function cardClickHandler(event) {
        // Toggle only this card
        this.classList.toggle('expanded');
        
        // Set height based on expanded state
        const content = this.querySelector('.industry-card-content');
        if (this.classList.contains('expanded')) {
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          content.style.maxHeight = '0';
        }
        
        // Stop event from affecting other elements
        event.stopPropagation();
      });
    });
  });