import React from 'react';
import type { PrimeBrainStatus } from '../types/primeBrainStatus';

interface HeaderProps {
  primeBrainStatus: PrimeBrainStatus;
  hushFeedback: { color: string; intensity: number; isEngaged: boolean };
  isPlaying: boolean;
}

const Header: React.FC<HeaderProps> = () => null;

export default Header;