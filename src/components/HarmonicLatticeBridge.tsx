import { useEffect } from 'react';

interface HarmonicLatticeBridgeProps {
  onStateChange?: (isActive: boolean) => void;
}

const HarmonicLatticeBridge: React.FC<HarmonicLatticeBridgeProps> = ({ onStateChange }) => {
  useEffect(() => {
    // Initialize Harmonic Lattice system
    const initializeHarmonicLattice = async () => {
      try {
        console.log('🎵 Initializing Harmonic Lattice System...');
        onStateChange?.(true);
      } catch (error) {
        console.error('❌ Failed to initialize Harmonic Lattice System:', error);
        onStateChange?.(false);
      }
    };

    initializeHarmonicLattice();

    return () => {
      console.log('🎵 Harmonic Lattice System disposed');
      onStateChange?.(false);
    };
  }, [onStateChange]);

  return null; // This is a bridge component, no UI
};

export default HarmonicLatticeBridge;
