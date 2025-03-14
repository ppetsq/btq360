/**
 * Countdown timer functionality for boutique360
 * Handles the countdown to the end of the special offer
 */

/**
 * Update the countdown timer
 * Calculates time remaining until the deadline and animates the display
 */
function updateCountdown() {
    const endDate = new Date("March 31, 2025 23:59:59").getTime();
    const now = new Date().getTime();
    const timeLeft = endDate - now;
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    // Get current values
    const currentDays = document.getElementById("countdown-days").innerHTML;
    const currentHours = document.getElementById("countdown-hours").innerHTML;
    const currentMinutes = document.getElementById("countdown-minutes").innerHTML;
    const currentSeconds = document.getElementById("countdown-seconds").innerHTML;
    
    // Format new values
    const newDays = days < 10 ? "0" + days : days;
    const newHours = hours < 10 ? "0" + hours : hours;
    const newMinutes = minutes < 10 ? "0" + minutes : minutes;
    const newSeconds = seconds < 10 ? "0" + seconds : seconds;
    
    // Update with animation if values changed
    if (currentDays !== newDays.toString()) {
        animateCountdownNumber("countdown-days", newDays);
    }
    if (currentHours !== newHours.toString()) {
        animateCountdownNumber("countdown-hours", newHours);
    }
    if (currentMinutes !== newMinutes.toString()) {
        animateCountdownNumber("countdown-minutes", newMinutes);
    }
    if (currentSeconds !== newSeconds.toString()) {
        animateCountdownNumber("countdown-seconds", newSeconds);
    }
}

/**
 * Animate a countdown number change
 * @param {string} id - ID of the element to animate
 * @param {string} newValue - New value to display
 */
function animateCountdownNumber(id, newValue) {
    const element = document.getElementById(id);
    element.innerHTML = newValue;
    
    setTimeout(() => {
        element.style.transform = "scale(1)";
    }, 200);
}