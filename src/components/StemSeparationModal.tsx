import React, { useState } from 'react';
import { MixxGlassDialog, MixxGlassDialogContent, MixxGlassDialogFooter } from './mixxglass';
import { MixxGlassButton } from './mixxglass';

interface StemSeparationModalProps {
  onClose: () => void;
  onSeparate: (selectedStems: string[]) => void;
}

const availableStems = [
    'Vocals', 'Lead Vocals', 'Backing Vocals',
    'Drums', 'Bass', 'Guitar', 'Piano', 'Synths', 'Strings',
    'Other Instruments', 'Sound FX',
];

const StemSeparationModal: React.FC<StemSeparationModalProps> = ({ onClose, onSeparate }) => {
  const [open, setOpen] = useState(true);
  const [selectedStems, setSelectedStems] = useState<Set<string>>(new Set(['Vocals', 'Drums', 'Bass', 'Other Instruments']));

  const handleToggleStem = (stem: string) => {
    setSelectedStems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stem)) {
        newSet.delete(stem);
      } else {
        newSet.add(stem);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStems.size === 0) {
      alert('Please select at least one stem to separate.');
      return;
    }
    onSeparate(Array.from(selectedStems));
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
      title="DYNAMIC STEM SEPARATION"
      description="Select the stems you wish to extract from the source audio."
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
        <MixxGlassDialogContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pr-4 overflow-y-auto max-h-[50vh]">
            {availableStems.map(stem => (
              <label key={stem} className="flex items-center space-x-3 p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStems.has(stem)}
                  onChange={() => handleToggleStem(stem)}
                  className="w-5 h-5 rounded bg-black/30 border-gray-100/30 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                />
                <span className="text-gray-300">{stem}</span>
              </label>
            ))}
          </div>
        </MixxGlassDialogContent>
        <MixxGlassDialogFooter>
          <MixxGlassButton type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </MixxGlassButton>
          <MixxGlassButton 
            type="submit"
            variant="primary" 
            alsChannel="momentum"
            alsValue={selectedStems.size / availableStems.length}
          >
            Separate ({selectedStems.size}) Stems
          </MixxGlassButton>
        </MixxGlassDialogFooter>
      </form>
    </MixxGlassDialog>
  );
};

export default StemSeparationModal;