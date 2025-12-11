import React, { useState } from 'react';
import { MixxGlassDialog, MixxGlassDialogContent, MixxGlassDialogFooter } from './mixxglass';
import { MixxGlassButton, MixxGlassInput } from './mixxglass';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../design-system';

interface RenameTrackModalProps {
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

const RenameTrackModal: React.FC<RenameTrackModalProps> = ({ currentName, onClose, onRename }) => {
  const [open, setOpen] = useState(true);
  const [newName, setNewName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onRename(newName.trim());
      setOpen(false);
      onClose();
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <MixxGlassDialog
      open={open}
      onOpenChange={handleClose}
      title="RENAME TRACK"
      size="sm"
    >
      <MixxGlassDialogContent>
        <form onSubmit={handleSubmit} style={composeStyles(
          layout.flex.container('col'),
          spacing.gap(4)
        )}>
          <MixxGlassInput
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onFocus={(e) => e.target.select()}
            placeholder="Enter track name"
          />
        </form>
      </MixxGlassDialogContent>
      <MixxGlassDialogFooter>
        <MixxGlassButton variant="secondary" onClick={handleClose}>
          Cancel
        </MixxGlassButton>
        <MixxGlassButton variant="primary" onClick={handleSubmit}>
          Rename
        </MixxGlassButton>
      </MixxGlassDialogFooter>
    </MixxGlassDialog>
  );
};

export default RenameTrackModal;