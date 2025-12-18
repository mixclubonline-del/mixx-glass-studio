import React, { useState } from 'react';
import { TrackData } from '../App';
import { MixxGlassDialog, MixxGlassDialogContent, MixxGlassDialogFooter } from './mixxglass';
import { MixxGlassButton, MixxGlassInput } from './mixxglass';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../design-system';

type NewTrackData = Pick<TrackData, 'trackName' | 'trackColor' | 'waveformType' | 'group'>;

interface AddTrackModalProps {
  onClose: () => void;
  onAddTrack: (trackData: NewTrackData) => void;
}

const AddTrackModal: React.FC<AddTrackModalProps> = ({ onClose, onAddTrack }) => {
  const [open, setOpen] = useState(true);
  const [trackName, setTrackName] = useState('');
  const [trackColor, setTrackColor] = useState<TrackData['trackColor']>('cyan');
  const [waveformType, setWaveformType] = useState<TrackData['waveformType']>('varied');
  const [group, setGroup] = useState<TrackData['group']>('Vocals');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackName.trim()) {
      alert('Track name cannot be empty.');
      return;
    }
    onAddTrack({
      trackName: trackName.trim().toUpperCase(),
      trackColor,
      waveformType,
      group,
    });
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
      title="ADD NEW TRACK"
      size="md"
    >
      <form onSubmit={handleSubmit} style={composeStyles(
        layout.flex.container('col'),
        spacing.gap(4)
      )}>
        <MixxGlassDialogContent>
          <div style={spacing.gap(4)}>
            <div>
              <label htmlFor="trackName" style={composeStyles(
                typography.weight('medium'),
                spacing.mb(1),
                {
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'rgba(156, 163, 175, 1)',
                }
              )}>
                Track Name
              </label>
              <MixxGlassInput
                type="text"
                id="trackName"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder="e.g., LEAD VOCALS"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="trackColor" style={composeStyles(
                typography.weight('medium'),
                spacing.mb(1),
                {
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'rgba(156, 163, 175, 1)',
                }
              )}>
                Color
              </label>
              <select
                id="trackColor"
                value={trackColor}
                onChange={(e) => setTrackColor(e.target.value as TrackData['trackColor'])}
                style={composeStyles(
                  layout.width.full,
                  spacing.p(2),
                  effects.border.radius.md,
                  transitions.transition.standard('all', 200, 'ease-out'),
                  {
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    outline: 'none',
                  }
                )}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 1)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="cyan">Cyan</option>
                <option value="magenta">Magenta</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
                <option value="crimson">Crimson</option>
              </select>
            </div>
            <div>
              <label htmlFor="waveformType" style={composeStyles(
                typography.weight('medium'),
                spacing.mb(1),
                {
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'rgba(156, 163, 175, 1)',
                }
              )}>
                Waveform Style
              </label>
              <select
                id="waveformType"
                value={waveformType}
                onChange={(e) => setWaveformType(e.target.value as TrackData['waveformType'])}
                style={composeStyles(
                  layout.width.full,
                  spacing.p(2),
                  effects.border.radius.md,
                  transitions.transition.standard('all', 200, 'ease-out'),
                  {
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    outline: 'none',
                  }
                )}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 1)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="varied">Varied</option>
                <option value="dense">Dense</option>
                <option value="sparse">Sparse</option>
                <option value="bass">Bass</option>
              </select>
            </div>
            <div>
              <label htmlFor="group" style={composeStyles(
                typography.weight('medium'),
                spacing.mb(1),
                {
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'rgba(156, 163, 175, 1)',
                }
              )}>
                Group
              </label>
              <select
                id="group"
                value={group}
                onChange={(e) => setGroup(e.target.value as TrackData['group'])}
                style={composeStyles(
                  layout.width.full,
                  spacing.p(2),
                  effects.border.radius.md,
                  transitions.transition.standard('all', 200, 'ease-out'),
                  {
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    outline: 'none',
                  }
                )}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 1)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="Vocals">Vocals</option>
                <option value="Harmony">Harmony</option>
                <option value="Adlibs">Adlibs</option>
                <option value="Bass">Bass</option>
                <option value="Drums">Drums</option>
                <option value="Instruments">Instruments</option>
              </select>
            </div>
          </div>
        </MixxGlassDialogContent>
        <MixxGlassDialogFooter>
          <MixxGlassButton type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </MixxGlassButton>
          <MixxGlassButton type="submit" variant="primary">
            Add Track
          </MixxGlassButton>
        </MixxGlassDialogFooter>
      </form>
    </MixxGlassDialog>
  );
};

export default AddTrackModal;