
import React from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { Knob } from '../shared/Knob';
import { Waveform } from '../shared/Waveform';
import { MixxDelaySettings, PluginComponentProps } from '../../types';
import { PrimeBrainStub } from '../../lib/PrimeBrainStub';

const Echo: React.FC<{ index: number, delay: number, feedback: number, throwIntuition: number, mix: number, onThrow: () => void }> = ({ index, delay, feedback, throwIntuition, mix, onThrow }) => {
    const [isThrown, setIsThrown] = React.useState(false);
    
    React.useEffect(() => {
        const checkThrow = () => {
            if (Math.random() < throwIntuition / 100 * 0.1) {
                setIsThrown(true);
                onThrow();
                setTimeout(() => setIsThrown(false), delay);
            }
        };
        const interval = setInterval(checkThrow, 2000);
        return () => clearInterval(interval);
    }, [throwIntuition, delay, onThrow]);

    const opacity = Math.pow(feedback / 100, index) * (mix / 100);
    if (opacity < 0.01) return null;
    
    const animationName = isThrown ? 'delay-throw-burst' : 'delay-fade-in';
    const animationDuration = isThrown ? delay * 0.8 : delay;

    const color = `hsl(${300 - index * 20}, 100%, ${80 - index * 5}%)`;

    return (
        <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
                animation: `${animationName} ${animationDuration}ms ${index * delay}ms forwards`,
                '--echo-opacity': opacity,
            } as React.CSSProperties}
        >
            <Waveform
                id={`delay-echo-${index}`}
                color={color}
                path="M 0 50 C 50 10, 80 90, 150 50 S 250 80, 300 50 S 420 10, 500 50"
            />
        </div>
    );
};

export const MixxDelay: React.FC<PluginComponentProps<MixxDelaySettings>> = ({
  isDragging, isResizing, name, description, pluginState, setPluginState, isLearning, onMidiLearn
}) => {
    const { time, feedback, throwIntuition, mix, output } = pluginState;
    const [isFlashing, setIsFlashing] = React.useState(false);

    const handleThrow = React.useCallback(() => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 200);
    }, []);

    const handleValueChange = (param: keyof MixxDelaySettings, value: number) => {
        setPluginState({ [param]: value });
        PrimeBrainStub.sendEvent('parameter_change', { plugin: 'mixx-delay', parameter: param, value });
    };

    return (
        <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
            <style>{`
                @keyframes delay-fade-in {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: var(--echo-opacity); transform: scale(1); }
                }
                @keyframes delay-throw-burst {
                    0% { opacity: 0; transform: scale(0.5); filter: brightness(1) blur(5px); }
                    30% { opacity: var(--echo-opacity); transform: scale(1.2); filter: brightness(2) blur(0); }
                    100% { opacity: 0; transform: scale(1); filter: brightness(1) blur(2px); }
                }
            `}</style>
            <div className="w-full h-full flex flex-col items-center justify-between gap-8 p-4">
                <div className="w-full h-32 relative flex items-center justify-center overflow-hidden">
                    <div className={`absolute inset-0 w-full h-full transition-all duration-100 ${isFlashing ? 'animate-[knob-value-flash_0.2s_ease-out]' : ''}`} style={{ opacity: mix / 100 }}>
                        <Waveform animated id="delay-main" color="#f472b6" path="M 0 50 C 50 10, 80 90, 150 50 S 250 80, 300 50 S 420 10, 500 50" />
                    </div>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Echo key={i} index={i + 1} delay={time} feedback={feedback} throwIntuition={throwIntuition} mix={mix} onThrow={handleThrow} />
                    ))}
                </div>

                <div className="flex w-full justify-around items-center">
                    <Knob label="Time" value={time} setValue={(v) => handleValueChange('time', v)} min={1} max={2000} step={1} paramName="time" isLearning={isLearning('time')} onMidiLearn={onMidiLearn} />
                    <Knob label="Feedback" value={feedback} setValue={(v) => handleValueChange('feedback', v)} paramName="feedback" isLearning={isLearning('feedback')} onMidiLearn={onMidiLearn} />
                    <Knob label="Throw" value={throwIntuition} setValue={(v) => handleValueChange('throwIntuition', v)} paramName="throwIntuition" isLearning={isLearning('throwIntuition')} onMidiLearn={onMidiLearn} />
                    <Knob label="Mix" value={mix} setValue={(v) => handleValueChange('mix', v)} paramName="mix" isLearning={isLearning('mix')} onMidiLearn={onMidiLearn} />
                    <Knob label="Output" value={output} setValue={(v) => handleValueChange('output', v)} paramName="output" isLearning={isLearning('output')} onMidiLearn={onMidiLearn} />
                </div>
            </div>
        </PluginContainer>
    );
};
