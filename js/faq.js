/**
 * FAQ functionality for boutique360
 * Handles the toggle function for the FAQ accordions
 */

/**
 * Toggle FAQ item open/closed state
 * Manages smooth animations for opening and closing
 * @param {HTMLElement} element - The clicked FAQ question element
 */
function toggleFaq(element) {
    const faqItem = element.parentElement;
    const faqAnswer = faqItem.querySelector('.faq-answer');

    // Close all FAQs first
    document.querySelectorAll('.faq-item.active').forEach(item => {
        if (item !== faqItem) {
            const answer = item.querySelector('.faq-answer');
            answer.style.height = '0px';
            item.classList.remove('active');
        }
    });

    // Toggle current FAQ
    if (faqItem.classList.contains('active')) {
        // Close this FAQ
        faqAnswer.style.height = '0px';
        faqItem.classList.remove('active');
    } else {
        // Open this FAQ
        faqItem.classList.add('active');
        const contentHeight = faqAnswer.querySelector('.faq-answer-inner').offsetHeight;
        faqAnswer.style.height = contentHeight + 'px';
    }
}

// Make toggleFaq globally accessible
window.toggleFaq = toggleFaq;