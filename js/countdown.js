/**
 * Countdown timer functionality for boutique360
 * Handles the countdown to the end of the special offer
 */

/**
 * Update the countdown timer
 * Calculates time remaining until the deadline and updates the display
 */
function updateCountdown() {
    const endDate = new Date("April 30, 2025 23:59:59").getTime();
    const now = new Date().getTime();
    const timeLeft = endDate - now;
    
    // Calculate time components
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    // Format values with leading zeros
    const formattedDays = days < 10 ? "0" + days : days;
    const formattedHours = hours < 10 ? "0" + hours : hours;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    
    // Update the DOM elements
    updateCountdownElement("countdown-days", formattedDays);
    updateCountdownElement("countdown-hours", formattedHours);
    updateCountdownElement("countdown-minutes", formattedMinutes);
    updateCountdownElement("countdown-seconds", formattedSeconds);
}

/**
 * Update a countdown element with animation effects
 * @param {string} id - ID of the element to update
 * @param {string} newValue - New value to display
 */
function updateCountdownElement(id, newValue) {
    const element = document.getElementById(id);
    if (!element) return;
    
    // Only update if the value has changed
    if (element.innerHTML !== newValue) {
        // Add animation class
        element.classList.add('countdown-update');
        
        // Update the value
        element.innerHTML = newValue;
        
        // Remove animation class after transition completes
        setTimeout(() => {
            element.classList.remove('countdown-update');
        }, 300);
    }
}