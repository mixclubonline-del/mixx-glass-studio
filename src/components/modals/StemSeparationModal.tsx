import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StemSeparationModalProps {
  onClose: () => void;
  onSeparate: (selectedStems: string[]) => void;
  initialSelection?: string[];
}

const AVAILABLE_STEMS = [
  'Vocals',
  'Lead Vocals',
  'Backing Vocals',
  'Drums',
  'Bass',
  'Guitar',
  'Piano',
  'Synths',
  'Strings',
  'Other Instruments',
  'Sound FX',
];

const DEFAULT_SELECTION = ['Vocals', 'Drums', 'Bass', 'Other Instruments'];

const StemSeparationModal: React.FC<StemSeparationModalProps> = ({ onClose, onSeparate, initialSelection }) => {
  const [selectedStems, setSelectedStems] = useState<Set<string>>(new Set(initialSelection ?? DEFAULT_SELECTION));

  useEffect(() => {
    setSelectedStems(new Set(initialSelection ?? DEFAULT_SELECTION));
  }, [initialSelection]);

  const handleToggleStem = (stem: string) => {
    setSelectedStems((prev) => {
      const next = new Set(prev);
      if (next.has(stem)) {
        next.delete(stem);
      } else {
        next.add(stem);
      }
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedStems.size === 0) {
      alert('Please select at least one stem to separate.');
      return;
    }
    onSeparate(Array.from(selectedStems));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative flex max-h-[80vh] w-[480px] flex-col rounded-2xl border border-indigo-500/50 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 shadow-2xl shadow-indigo-500/20"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-2 text-center text-xl font-bold tracking-[0.4em] text-gray-200">
          STEM SEPARATION
        </h2>
        <p className="mb-6 text-center text-sm text-gray-400">
          Select the stems you want Hybrid Transformer Demucs to extract.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 pr-2">
            {AVAILABLE_STEMS.map((stem) => (
              <label
                key={stem}
                className="flex cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-white/10"
              >
                <input
                  type="checkbox"
                  checked={selectedStems.has(stem)}
                  onChange={() => handleToggleStem(stem)}
                  className="h-5 w-5 rounded border-gray-100/30 bg-black/30 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                />
                <span className="text-gray-300">{stem}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex justify-end space-x-4 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-700/50 px-4 py-2 transition-colors hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-6 py-2 font-bold text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-colors hover:bg-indigo-500"
            >
              Separate ({selectedStems.size})
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default StemSeparationModal;
