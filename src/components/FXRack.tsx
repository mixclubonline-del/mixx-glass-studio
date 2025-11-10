import React, { ReactNode, useRef, ReactElement } from 'react';
import { FXWindowProps } from './FXWindow'; 
import { FxWindowId } from '../App';

interface FXRackProps {
    children: ReactNode;
    fxBypassState: Record<FxWindowId, boolean>;
    onToggleBypass: (fxId: FxWindowId) => void;
    onOpenPluginSettings: (fxId: FxWindowId) => void; // Added
}

const FXRack: React.FC<FXRackProps> = ({ children, fxBypassState, onToggleBypass, onOpenPluginSettings }) => {
    const rackRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={rackRef} className="absolute inset-0 w-full h-full pointer-events-none z-20">
            {React.Children.map(children, child => {
                if (React.isValidElement<FXWindowProps>(child)) {
                    const childProps = child.props;
                    return React.cloneElement(child, { 
                        constraintsRef: rackRef,
                        style: { ...childProps.style, pointerEvents: 'auto' }, // Ensure clickability
                        isBypassed: fxBypassState[childProps.id],
                        onToggleBypass: (fxId) => onToggleBypass(fxId), // Pass through fxId
                        onOpenPluginSettings: (fxId) => onOpenPluginSettings(fxId), // Pass through fxId
                    });
                }
                return child;
            })}
        </div>
    );
};

export default FXRack;