import React from 'react';
import { MixxGlassDialog, MixxGlassDialogFooter } from './mixxglass';
import { MixxGlassButton } from './mixxglass';

interface MasteringModalProps {
  onClose: () => void;
}

const MasteringModal: React.FC<MasteringModalProps> = ({ onClose }) => {
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <MixxGlassDialog
      open={open}
      onOpenChange={handleClose}
      title="MASTERING SUITE"
      description="This will be our AI-powered mastering suite, contextually adapting your mix for optimal deployment."
      size="md"
    >
      <MixxGlassDialogFooter>
        <MixxGlassButton variant="secondary" onClick={handleClose}>
          Close
        </MixxGlassButton>
      </MixxGlassDialogFooter>
    </MixxGlassDialog>
  );
};

export default MasteringModal;