/**
 * Form handler script - prevents redirect to Formspree
 */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('email-form');
    const thankYou = document.getElementById('thank-you');
    
    // If hash is present, show thank you message (for browsers that might still redirect)
    if (window.location.hash === '#thank-you') {
        if (form && thankYou) {
            form.style.display = 'none';
            thankYou.style.display = 'block';
        }
    }
    
    // Handle form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission
            
            // Get form data
            const formData = new FormData(form);
            
            // Create AJAX request to Formspree
            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    // Success - show thank you message
                    form.style.display = 'none';
                    thankYou.style.display = 'block';
                    
                    // Reset form
                    form.reset();
                } else {
                    // Error - show alert
                    alert('Something went wrong. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Something went wrong. Please try again.');
            });
        });
    }
});