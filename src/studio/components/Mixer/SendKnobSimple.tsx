/**
 * Send Knob Simple - Compact send amount control
 */

import React from 'react';
import { IceFireKnob } from '../Controls/IceFireKnob';

interface SendKnobSimpleProps {
  busName: string;
  busColor: string;
  amount: number; // 0-1
  onAmountChange: (amount: number) => void;
}

export const SendKnobSimple: React.FC<SendKnobSimpleProps> = ({
  busName,
  busColor,
  amount,
  onAmountChange,
}) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <IceFireKnob
        value={amount}
        onChange={onAmountChange}
        size={32}
        label=""
        valueLabel={`${Math.round(amount * 100)}`}
        min={0}
        max={100}
      />
      <div 
        className="text-[9px] font-medium truncate max-w-full text-center"
        style={{ color: busColor }}
        title={busName}
      >
        {busName}
      </div>
    </div>
  );
};
