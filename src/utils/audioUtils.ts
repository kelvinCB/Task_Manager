/**
 * Utility to play a short notification sound using AudioContext.
 * Extract from TaskTimer.tsx for reuse across the application.
 */
export const playNotificationSound = (frequency: number = 1200, duration: number = 2.0, volume: number = 0.4) => {
    try {
        // Create an audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create an oscillator to generate a tone
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Configure the oscillator
        oscillator.type = 'sine'; // Sine wave type (smooth)
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Frequency in Hz

        // Configure volume and duration
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime); // Default volume 0.4
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration); // Fade out

        // Connect the nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Play the sound
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.error('Error playing sound:', error);
    }
};
