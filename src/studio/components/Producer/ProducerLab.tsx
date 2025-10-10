/**
 * Producer Lab - Full production suite for beatmakers and sound designers
 * Integrated production environment with instruments, FX, loops, and AI composition
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstrumentBrowser } from './InstrumentBrowser';
import { FXBrowser } from './FXBrowser';
import { LoopBrowser } from './LoopBrowser';
import { FileBrowser } from './FileBrowser';
import { MIDITools } from './MIDITools';
import { AIComposer } from './AIComposer';
import mixxclubLogo from '@/assets/mixxclub-logo.png';
import { Music, Waves, Repeat, FileAudio, Cloud, ShoppingBag } from 'lucide-react';

export const ProducerLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('instruments');

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-600/10 via-pink-500/10 to-blue-500/10">
      {/* Header */}
      <div className="px-4 py-3 glass border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={mixxclubLogo} 
            alt="Producer Lab" 
            className="h-8 w-auto logo-glow" 
          />
          <div className="border-l border-border/30 h-7"></div>
          <div>
            <h2 className="text-base font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Producer Lab
            </h2>
            <p className="text-[0.7rem] text-muted-foreground">
              Full Production Suite • Instruments • FX • Loops • AI Composer
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4 flex gap-4">
        {/* Left Panel - Browser */}
        <Card className="flex-1 glass-glow border-border/30 p-4 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="glass">
              <TabsTrigger value="instruments" className="gap-2">
                <Music size={14} />
                Instruments
              </TabsTrigger>
              <TabsTrigger value="fx" className="gap-2">
                <Waves size={14} />
                FX
              </TabsTrigger>
              <TabsTrigger value="loops" className="gap-2">
                <Repeat size={14} />
                Loops
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2">
                <FileAudio size={14} />
                Files
              </TabsTrigger>
              <TabsTrigger value="cloud" className="gap-2">
                <Cloud size={14} />
                Cloud
              </TabsTrigger>
              <TabsTrigger value="shop" className="gap-2">
                <ShoppingBag size={14} />
                Shop
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="instruments" className="mt-0">
                <InstrumentBrowser />
              </TabsContent>
              <TabsContent value="fx" className="mt-0">
                <FXBrowser />
              </TabsContent>
              <TabsContent value="loops" className="mt-0">
                <LoopBrowser />
              </TabsContent>
              <TabsContent value="files" className="mt-0">
                <FileBrowser />
              </TabsContent>
              <TabsContent value="cloud" className="mt-0">
                <div className="text-muted-foreground text-sm">Cloud storage integration coming soon...</div>
              </TabsContent>
              <TabsContent value="shop" className="mt-0">
                <div className="text-muted-foreground text-sm">Mixx Club Shop coming soon...</div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Right Panel - Tools */}
        <div className="w-80 flex flex-col gap-4">
          {/* MIDI Tools */}
          <Card className="glass-glow border-border/30 p-4">
            <MIDITools />
          </Card>

          {/* AI Composer */}
          <Card className="flex-1 glass-glow border-border/30 p-4">
            <AIComposer />
          </Card>
        </div>
      </div>
    </div>
  );
};
