import React, { useEffect, useState } from 'react';
import { useAnimatePresence, AnimatePresence } from '../mixxglass';

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

  const overlayAnimation = useAnimatePresence({
    isVisible: true,
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 300, easing: 'ease-out' }, // Standard CSS easing name
  });

  const modalAnimation = useAnimatePresence({
    isVisible: true,
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 200, easing: 'ease-out' },
  });

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
        onClick={onClose}
        style={overlayAnimation.style}
      >
        <div
          className="relative flex max-h-[80vh] w-[480px] flex-col rounded-2xl border border-indigo-500/50 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 shadow-2xl shadow-indigo-500/20"
          onClick={(event) => event.stopPropagation()}
          style={{
            opacity: modalAnimation.style.opacity,
            transform: `scale(${(modalAnimation.style as any).scale})`,
          }}
        >
        <h2 className="mb-2 text-center text-xl font-bold tracking-[0.4em] text-gray-200">
          STEM SEPARATION
        </h2>
        <p className="mb-6 text-center text-sm text-gray-400">
          Select the stems you want Hybrid Transformer Demucs to extract.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 mb-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
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
          </div>

          <div className="flex justify-end space-x-4 border-t border-white/10 pt-4 mt-auto shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-700/50 px-4 py-2 text-gray-200 transition-colors hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-6 py-2 font-bold text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-colors hover:bg-indigo-500"
            >
              Add Stems ({selectedStems.size})
            </button>
          </div>
        </form>
      </div>
    </div>
    </AnimatePresence>
  );
};

export default StemSeparationModal;
