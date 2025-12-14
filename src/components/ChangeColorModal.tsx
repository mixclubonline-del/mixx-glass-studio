import React, { useState } from 'react';
import { TrackData } from '../App';
import { MixxGlassDialog, MixxGlassDialogContent, MixxGlassDialogFooter } from './mixxglass';
import { MixxGlassButton } from './mixxglass';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../design-system';

interface ChangeColorModalProps {
  currentColor: TrackData['trackColor'];
  onClose: () => void;
  onChangeColor: (newColor: TrackData['trackColor']) => void;
}

const colors: TrackData['trackColor'][] = ['cyan', 'magenta', 'blue', 'green', 'purple', 'crimson'];

const colorMap: Record<TrackData['trackColor'], string> = {
  cyan: 'rgba(6, 182, 212, 1)',
  magenta: 'rgba(217, 70, 239, 1)',
  blue: 'rgba(59, 130, 246, 1)',
  green: 'rgba(34, 197, 94, 1)',
  purple: 'rgba(139, 92, 246, 1)',
  crimson: 'rgba(244, 63, 94, 1)',
};

const ChangeColorModal: React.FC<ChangeColorModalProps> = ({ currentColor, onClose, onChangeColor }) => {
  const [open, setOpen] = useState(true);
  const [selectedColor, setSelectedColor] = useState(currentColor);

  const handleSubmit = () => {
    onChangeColor(selectedColor);
    setOpen(false);
    onClose();
  };

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <MixxGlassDialog
      open={open}
      onOpenChange={handleClose}
      title="CHANGE TRACK COLOR"
      size="sm"
    >
      <MixxGlassDialogContent>
        <div style={composeStyles(
          layout.grid.container(3),
          spacing.gap(4),
          spacing.mb(6),
          {
            justifyItems: 'center',
          }
        )}>
          {colors.map((color) => (
            <div
              key={color}
              onClick={() => setSelectedColor(color)}
              style={composeStyles(
                effects.border.radius.full,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  width: '40px',
                  height: '40px',
                  background: colorMap[color],
                  cursor: 'pointer',
                  transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                  border: selectedColor === color ? '2px solid white' : 'none',
                  boxShadow: selectedColor === color 
                    ? '0 0 0 2px rgba(31, 41, 55, 1), 0 0 0 4px white'
                    : 'none',
                }
              )}
              onMouseEnter={(e) => {
                if (selectedColor !== color) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedColor !== color) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            />
          ))}
        </div>
      </MixxGlassDialogContent>
      <MixxGlassDialogFooter>
        <MixxGlassButton variant="secondary" onClick={handleClose}>
          Cancel
        </MixxGlassButton>
        <MixxGlassButton variant="primary" onClick={handleSubmit}>
          Set Color
        </MixxGlassButton>
      </MixxGlassDialogFooter>
    </MixxGlassDialog>
  );
};

export default ChangeColorModal;