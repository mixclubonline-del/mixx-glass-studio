import { useEffect } from 'react';

interface HushInputBridgeProps {
  onStateChange?: (isActive: boolean) => void;
}

const HushInputBridge: React.FC<HushInputBridgeProps> = ({ onStateChange }) => {
  useEffect(() => {
    // Initialize Hush Input system
    const initializeHushInput = async () => {
      try {
        console.log('🎵 Initializing Hush Input System...');
        onStateChange?.(true);
      } catch (error) {
        console.error('❌ Failed to initialize Hush Input System:', error);
        onStateChange?.(false);
      }
    };

    initializeHushInput();

    return () => {
      console.log('🎵 Hush Input System disposed');
      onStateChange?.(false);
    };
  }, [onStateChange]);

  return null; // This is a bridge component, no UI
};

export default HushInputBridge;
