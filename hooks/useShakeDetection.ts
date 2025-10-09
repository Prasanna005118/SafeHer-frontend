import { useEffect } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { Platform } from 'react-native';

// 💥 UPDATED THRESHOLD: Only trigger a detection when acceleration exceeds 15 G's.
const SHAKE_THRESHOLD = 30.0; 
const SHAKE_TIMEOUT = 1000; // Debounce time in ms

let lastShakeTime = 0;

/**
 * Hook to detect phone shake gesture
 * @param onShake - Callback function to execute when shake is detected
 */
export const useShakeDetection = (onShake: () => void) => {
  useEffect(() => {
    // Don't set up shake detection on web
    if (Platform.OS === 'web') {
      return;
    }

    let subscription: any;

    const setupShakeDetection = async () => {
      try {
        // Check if device motion is available
        const isAvailable = await DeviceMotion.isAvailableAsync();
        
        if (!isAvailable) {
          console.log('⚠️ Device motion not available on this device');
          return;
        }

        // Set update interval (100ms = 10 times per second)
        DeviceMotion.setUpdateInterval(100);

        // Subscribe to device motion
        subscription = DeviceMotion.addListener((motionData) => {
          // Use accelerationIncludingGravity for more stable magnitude calculation,
          // but fall back to acceleration if necessary.
          const accelerationData = motionData.accelerationIncludingGravity || motionData.acceleration;
          
          if (!accelerationData) return;

          // Calculate total acceleration magnitude
          const totalAcceleration = Math.sqrt(
            Math.pow(accelerationData.x || 0, 2) +
            Math.pow(accelerationData.y || 0, 2) +
            Math.pow(accelerationData.z || 0, 2)
          );

          // Check if shake threshold exceeded
          if (totalAcceleration > SHAKE_THRESHOLD) {
            const now = Date.now();
            
            // Debounce: only trigger if enough time has passed since last shake
            if (now - lastShakeTime > SHAKE_TIMEOUT) {
              console.log('📳 Shake detected! Acceleration:', totalAcceleration.toFixed(2));
              lastShakeTime = now;
              onShake();
            }
          }
        });

        console.log('✅ Shake detection enabled');
      } catch (error) {
        console.error('❌ Error setting up shake detection:', error);
      }
    };

    setupShakeDetection();

    // Cleanup
    return () => {
      if (subscription) {
        subscription.remove();
        console.log('🛑 Shake detection disabled');
      }
    };
  }, [onShake]);
};