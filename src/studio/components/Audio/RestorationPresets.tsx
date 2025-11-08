import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Disc, 
  Mic, 
  Radio, 
  Wind, 
  Zap, 
  Sparkles,
  Volume2,
  Settings,
  Check,
  Download,
  Upload
} from 'lucide-react';

interface RestorationPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'vinyl' | 'tape' | 'noise' | 'digital' | 'voice';
  severity: 'light' | 'medium' | 'heavy';
  settings: {
    deNoise: number;
    deClick: number;
    deHum: number;
    spectralRepair: number;
    smoothing: number;
    threshold: number;
  };
}

interface RestorationPresetsProps {
  onApplyPreset?: (preset: RestorationPreset) => void;
  audioBuffer?: AudioBuffer;
}

const RESTORATION_PRESETS: RestorationPreset[] = [
  // Vinyl Presets
  {
    id: 'vinyl-light-crackle',
    name: 'Light Vinyl Crackle',
    description: 'Removes light surface noise and occasional pops from well-maintained vinyl',
    icon: Disc,
    category: 'vinyl',
    severity: 'light',
    settings: {
      deNoise: 30,
      deClick: 40,
      deHum: 10,
      spectralRepair: 20,
      smoothing: 30,
      threshold: -35,
    }
  },
  {
    id: 'vinyl-medium-crackle',
    name: 'Medium Vinyl Crackle',
    description: 'For moderately worn records with consistent surface noise',
    icon: Disc,
    category: 'vinyl',
    severity: 'medium',
    settings: {
      deNoise: 50,
      deClick: 60,
      deHum: 20,
      spectralRepair: 40,
      smoothing: 50,
      threshold: -30,
    }
  },
  {
    id: 'vinyl-heavy-restoration',
    name: 'Heavy Vinyl Restoration',
    description: 'Aggressive restoration for badly damaged or scratched records',
    icon: Disc,
    category: 'vinyl',
    severity: 'heavy',
    settings: {
      deNoise: 80,
      deClick: 85,
      deHum: 30,
      spectralRepair: 70,
      smoothing: 70,
      threshold: -25,
    }
  },
  
  // Tape Presets
  {
    id: 'tape-hiss-reduction',
    name: 'Tape Hiss Reduction',
    description: 'Removes constant hiss from analog tape recordings',
    icon: Radio,
    category: 'tape',
    severity: 'light',
    settings: {
      deNoise: 60,
      deClick: 10,
      deHum: 20,
      spectralRepair: 30,
      smoothing: 40,
      threshold: -40,
    }
  },
  {
    id: 'tape-wow-flutter',
    name: 'Tape Wow & Flutter',
    description: 'Reduces pitch instability from tape playback issues',
    icon: Radio,
    category: 'tape',
    severity: 'medium',
    settings: {
      deNoise: 40,
      deClick: 30,
      deHum: 40,
      spectralRepair: 50,
      smoothing: 60,
      threshold: -35,
    }
  },
  {
    id: 'cassette-restoration',
    name: 'Cassette Restoration',
    description: 'Full restoration for cassette tape transfers',
    icon: Radio,
    category: 'tape',
    severity: 'heavy',
    settings: {
      deNoise: 70,
      deClick: 40,
      deHum: 50,
      spectralRepair: 60,
      smoothing: 65,
      threshold: -32,
    }
  },

  // Noise Presets
  {
    id: 'room-noise-light',
    name: 'Light Room Noise',
    description: 'Removes subtle room tone and ambient noise',
    icon: Wind,
    category: 'noise',
    severity: 'light',
    settings: {
      deNoise: 40,
      deClick: 5,
      deHum: 15,
      spectralRepair: 25,
      smoothing: 35,
      threshold: -38,
    }
  },
  {
    id: 'hvac-hum-removal',
    name: 'HVAC/AC Hum Removal',
    description: 'Targets air conditioning and heating system noise',
    icon: Wind,
    category: 'noise',
    severity: 'medium',
    settings: {
      deNoise: 35,
      deClick: 10,
      deHum: 80,
      spectralRepair: 30,
      smoothing: 40,
      threshold: -36,
    }
  },
  {
    id: 'traffic-noise',
    name: 'Traffic & Outdoor Noise',
    description: 'Reduces constant traffic rumble and outdoor ambience',
    icon: Wind,
    category: 'noise',
    severity: 'heavy',
    settings: {
      deNoise: 75,
      deClick: 20,
      deHum: 60,
      spectralRepair: 55,
      smoothing: 60,
      threshold: -30,
    }
  },

  // Digital Presets
  {
    id: 'digital-clicks',
    name: 'Digital Clicks & Pops',
    description: 'Removes digital artifacts and clipping distortion',
    icon: Zap,
    category: 'digital',
    severity: 'medium',
    settings: {
      deNoise: 20,
      deClick: 80,
      deHum: 5,
      spectralRepair: 60,
      smoothing: 45,
      threshold: -28,
    }
  },
  {
    id: 'mp3-artifacts',
    name: 'MP3 Artifact Reduction',
    description: 'Smooths compression artifacts from low-bitrate MP3s',
    icon: Zap,
    category: 'digital',
    severity: 'light',
    settings: {
      deNoise: 35,
      deClick: 15,
      deHum: 10,
      spectralRepair: 70,
      smoothing: 75,
      threshold: -42,
    }
  },

  // Voice Presets
  {
    id: 'voice-cleanup',
    name: 'Voice Cleanup',
    description: 'General voice recording cleanup for podcasts',
    icon: Mic,
    category: 'voice',
    severity: 'light',
    settings: {
      deNoise: 45,
      deClick: 25,
      deHum: 30,
      spectralRepair: 35,
      smoothing: 40,
      threshold: -36,
    }
  },
  {
    id: 'phone-quality-enhance',
    name: 'Phone Quality Enhancement',
    description: 'Improves quality of phone or video call recordings',
    icon: Mic,
    category: 'voice',
    severity: 'medium',
    settings: {
      deNoise: 65,
      deClick: 40,
      deHum: 45,
      spectralRepair: 55,
      smoothing: 60,
      threshold: -33,
    }
  },
  {
    id: 'broadcast-ready',
    name: 'Broadcast Ready Voice',
    description: 'Professional voice processing for broadcast quality',
    icon: Mic,
    category: 'voice',
    severity: 'medium',
    settings: {
      deNoise: 55,
      deClick: 35,
      deHum: 40,
      spectralRepair: 45,
      smoothing: 55,
      threshold: -34,
    }
  },
];

export const RestorationPresets: React.FC<RestorationPresetsProps> = ({
  onApplyPreset,
  audioBuffer
}) => {
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customPresets, setCustomPresets] = useState<RestorationPreset[]>([]);

  const handleApplyPreset = (preset: RestorationPreset) => {
    setSelectedPreset(preset.id);
    
    if (onApplyPreset) {
      onApplyPreset(preset);
    }

    toast({
      title: "Preset Applied",
      description: `${preset.name} restoration preset has been loaded`,
    });
  };

  const handleSaveCustomPreset = () => {
    // Placeholder for custom preset saving
    toast({
      title: "Custom Preset Saved",
      description: "Your current settings have been saved as a custom preset",
    });
  };

  const filteredPresets = activeCategory === 'all' 
    ? RESTORATION_PRESETS 
    : RESTORATION_PRESETS.filter(p => p.category === activeCategory);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'light': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'heavy': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="p-6 bg-background/95 backdrop-blur border-border">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Restoration Presets</h3>
            <p className="text-sm text-muted-foreground">
              One-click solutions for common audio restoration needs
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleSaveCustomPreset}>
              <Download className="w-4 h-4 mr-1" />
              Save Preset
            </Button>
            <Button size="sm" variant="outline">
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
          </div>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="vinyl">
              <Disc className="w-4 h-4 mr-1" />
              Vinyl
            </TabsTrigger>
            <TabsTrigger value="tape">
              <Radio className="w-4 h-4 mr-1" />
              Tape
            </TabsTrigger>
            <TabsTrigger value="noise">
              <Wind className="w-4 h-4 mr-1" />
              Noise
            </TabsTrigger>
            <TabsTrigger value="digital">
              <Zap className="w-4 h-4 mr-1" />
              Digital
            </TabsTrigger>
            <TabsTrigger value="voice">
              <Mic className="w-4 h-4 mr-1" />
              Voice
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="space-y-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredPresets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedPreset === preset.id;
                
                return (
                  <Card
                    key={preset.id}
                    className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm text-foreground truncate">
                            {preset.name}
                          </h4>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {preset.description}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSeverityColor(preset.severity)}`}
                          >
                            {preset.severity}
                          </Badge>
                          
                          <div className="flex gap-1 text-xs text-muted-foreground">
                            {preset.settings.deNoise > 50 && (
                              <span className="px-1.5 py-0.5 rounded bg-muted">
                                Noise
                              </span>
                            )}
                            {preset.settings.deClick > 50 && (
                              <span className="px-1.5 py-0.5 rounded bg-muted">
                                Clicks
                              </span>
                            )}
                            {preset.settings.deHum > 50 && (
                              <span className="px-1.5 py-0.5 rounded bg-muted">
                                Hum
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">De-Noise:</span>
                            <span className="ml-1 text-foreground font-medium">
                              {preset.settings.deNoise}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">De-Click:</span>
                            <span className="ml-1 text-foreground font-medium">
                              {preset.settings.deClick}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">De-Hum:</span>
                            <span className="ml-1 text-foreground font-medium">
                              {preset.settings.deHum}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {customPresets.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-6 mb-3">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-foreground">Custom Presets</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customPresets.map((preset) => (
                    <Card
                      key={preset.id}
                      className="p-4 cursor-pointer transition-all hover:border-primary/50 border-border"
                      onClick={() => handleApplyPreset(preset)}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-foreground">
                            {preset.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {selectedPreset && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <Check className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              Preset loaded. Adjust parameters in the main restoration panel and click "Apply Restoration" to process.
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
