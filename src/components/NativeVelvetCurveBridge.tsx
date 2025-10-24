import { useEffect } from 'react';

interface NativeVelvetCurveBridgeProps {
  onStateChange?: (isActive: boolean) => void;
}

const NativeVelvetCurveBridge: React.FC<NativeVelvetCurveBridgeProps> = ({ onStateChange }) => {
  // const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Initialize native audio engine
    const initializeNativeAudio = async () => {
      try {
        console.log('🎵 Initializing Native Velvet Curve Engine...');
        // setIsActive(true);
        onStateChange?.(true);
      } catch (error) {
        console.error('❌ Failed to initialize Native Velvet Curve Engine:', error);
        // setIsActive(false);
        onStateChange?.(false);
      }
    };

    initializeNativeAudio();

    return () => {
      console.log('🎵 Native Velvet Curve Engine disposed');
      // setIsActive(false);
      onStateChange?.(false);
    };
  }, [onStateChange]);

  return null; // This is a bridge component, no UI
};

export default NativeVelvetCurveBridge;
