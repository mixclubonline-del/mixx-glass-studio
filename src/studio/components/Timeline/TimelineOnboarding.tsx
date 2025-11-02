/**
 * Timeline Onboarding - First-time user guide overlay
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
  position: 'center' | 'top' | 'left' | 'right';
  highlight?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Welcome to Advanced Timeline',
    description: 'A professional DAW-quality timeline with advanced editing features. Let\'s take a quick tour!',
    position: 'center',
  },
  {
    title: 'Editing Tools',
    description: 'Switch between Select, Range, Split, Trim, and Fade tools using number keys 1-5. Each tool is optimized for specific tasks.',
    position: 'top',
    highlight: 'toolbar',
  },
  {
    title: 'Copy, Paste & Duplicate',
    description: 'Use Cmd+C/V/D for clipboard operations. Alt+Drag to quickly duplicate regions while maintaining timing.',
    position: 'center',
  },
  {
    title: 'Ripple Editing',
    description: 'Enable ripple mode to automatically shift subsequent regions when editing. Great for rearranging sections!',
    position: 'top',
    highlight: 'ripple-indicator',
  },
  {
    title: 'Slip Editing',
    description: 'Cmd+Drag on region content to slip audio within fixed boundaries. Perfect for timing adjustments!',
    position: 'center',
  },
  {
    title: 'Automation Lanes',
    description: 'Click the automation button on any track to draw parameter automation directly on the timeline.',
    position: 'left',
    highlight: 'track-controls',
  },
  {
    title: 'Track Groups & Templates',
    description: 'Create track groups with VCA control, and save templates for quick session setup.',
    position: 'left',
    highlight: 'production-sidebar',
  },
  {
    title: 'You\'re Ready!',
    description: 'Press ? anytime to see all keyboard shortcuts. Check the documentation for detailed feature guides.',
    position: 'center',
  },
];

export const TimelineOnboarding: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('timeline-onboarding-completed');
    if (!hasSeenOnboarding) {
      // Delay opening to let the UI load
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem('timeline-onboarding-completed', 'true');
  };

  const handleComplete = () => {
    setIsOpen(false);
    localStorage.setItem('timeline-onboarding-completed', 'true');
    setCompletedSteps(new Set(onboardingSteps.map((_, i) => i)));
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const step = onboardingSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{step.title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-base pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {currentStep + 1} of {onboardingSteps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Step navigation dots */}
        <div className="flex items-center justify-center gap-2 py-4">
          {onboardingSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => handleStepClick(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentStep && 'w-6 bg-primary',
                index !== currentStep && completedSteps.has(index) && 'bg-primary/50',
                index !== currentStep && !completedSteps.has(index) && 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleSkip}>
            Skip Tour
          </Button>
          <Button onClick={handleNext}>
            {currentStep < onboardingSteps.length - 1 ? (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Get Started <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
