/**
 * FAQ functionality for boutique360
 * Handles the toggle function for the FAQ accordions
 */

/**
 * Toggle FAQ item open/closed state
 * Manages smooth animations for opening and closing using max-height
 * @param {HTMLElement} element - The clicked FAQ question element
 */
function toggleFaq(element) {
    const faqItem = element.parentElement;
    const faqAnswer = faqItem.querySelector('.faq-answer');
    const isActive = faqItem.classList.contains('active'); // Check if current item is active

    // Close all FAQs first (if one is already open)
    document.querySelectorAll('.faq-item.active').forEach(item => {
        // Only close items that are not the one being clicked
        if (item !== faqItem) {
            const answer = item.querySelector('.faq-answer');
            // Remove inline max-height style to let CSS handle closing
            answer.style.maxHeight = null;
            item.classList.remove('active');
        }
    });

    // Toggle current FAQ
    if (isActive) {
        // Close this FAQ: Remove inline style, CSS class takes over
        faqAnswer.style.maxHeight = null;
        faqItem.classList.remove('active');
    } else {
        // Open this FAQ
        faqItem.classList.add('active');
        // Set max-height to the content's scroll height
        // Use scrollHeight of the inner element for accuracy including padding
        const contentHeight = faqAnswer.querySelector('.faq-answer-inner').scrollHeight;
        faqAnswer.style.maxHeight = contentHeight + 'px';
    }
}

// Make toggleFaq globally accessible
window.toggleFaq = toggleFaq;