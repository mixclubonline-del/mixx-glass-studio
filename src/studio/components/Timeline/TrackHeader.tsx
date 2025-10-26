/**
 * TrackHeader - Enhanced track header with all professional controls
 */

import { useState } from "react";
import { Circle, Lock, Unlock, ChevronDown, Edit3, Trash2, Copy, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenubarSeparator } from "@/components/ui/menubar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ProfessionalPeakMeter } from "../Metering/ProfessionalPeakMeter";

interface TrackHeaderProps {
  id: string;
  name: string;
  color: string;
  height: number;
  muted: boolean;
  solo: boolean;
  recordArmed: boolean;
  locked: boolean;
  automationMode: "off" | "read" | "touch" | "latch" | "write";
  peakLevel: { left: number; right: number };
  pluginCount: number;
  isSelected: boolean;
  onNameChange: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
  onRecordArmToggle: (id: string) => void;
  onLockToggle: (id: string) => void;
  onAutomationModeChange: (id: string, mode: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export function TrackHeader({
  id,
  name,
  color,
  height,
  muted,
  solo,
  recordArmed,
  locked,
  automationMode,
  peakLevel,
  pluginCount,
  isSelected,
  onNameChange,
  onColorChange,
  onMuteToggle,
  onSoloToggle,
  onRecordArmToggle,
  onLockToggle,
  onAutomationModeChange,
  onDuplicate,
  onDelete,
  onSelect,
}: TrackHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleNameSubmit = () => {
    if (editName.trim()) {
      onNameChange(id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 border-b border-border/50 hover:bg-secondary/20 transition-colors",
        isSelected && "bg-secondary/40 ring-1 ring-primary/30",
      )}
      style={{ height: `${height}px` }}
      onClick={() => onSelect(id)}
    >
      {/* Color indicator */}
      <Circle className="w-3 h-3 shrink-0 cursor-pointer" fill={color} stroke={color} />

      {/* Track name */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameSubmit();
              if (e.key === "Escape") {
                setEditName(name);
                setIsEditing(false);
              }
            }}
            className="h-6 text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-sm truncate block cursor-text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {name}
          </span>
        )}
      </div>

      {/* Inline peak meter */}
      <div className="shrink-0" style={{ width: "16px", height: "60px" }}>
        <ProfessionalPeakMeter level={peakLevel} width={16} height={60} stereo={true} />
      </div>

      {/* Record arm */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "w-7 h-7 shrink-0 rounded-full",
          recordArmed && "bg-destructive/20 text-destructive ring-2 ring-destructive animate-pulse",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onRecordArmToggle(id);
        }}
      >
        <Circle className={cn("w-3 h-3", recordArmed && "fill-current")} />
      </Button>

      {/* Mute */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("w-7 h-7 shrink-0 text-xs font-bold", muted && "bg-muted text-muted-foreground")}
        onClick={(e) => {
          e.stopPropagation();
          onMuteToggle(id);
        }}
      >
        M
      </Button>

      {/* Solo */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("w-7 h-7 shrink-0 text-xs font-bold", solo && "bg-[hsl(var(--fire-red))] text-white")}
        onClick={(e) => {
          e.stopPropagation();
          onSoloToggle(id);
        }}
      >
        S
      </Button>

      {/* Automation mode */}
      <Select value={automationMode} onValueChange={(value) => onAutomationModeChange(id, value)}>
        <SelectTrigger className="w-16 h-7 text-xs shrink-0" onClick={(e) => e.stopPropagation()}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="off">Off</SelectItem>
          <SelectItem value="read">Read</SelectItem>
          <SelectItem value="touch">Touch</SelectItem>
          <SelectItem value="latch">Latch</SelectItem>
          <SelectItem value="write">Write</SelectItem>
        </SelectContent>
      </Select>

      {/* Plugin count indicator */}
      {pluginCount > 0 && (
        <div className="shrink-0 px-2 py-1 rounded-md bg-primary/20 text-primary text-xs font-medium">
          {pluginCount}
        </div>
      )}

      {/* Lock button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("w-7 h-7 shrink-0", locked && "text-primary")}
        onClick={(e) => {
          e.stopPropagation();
          onLockToggle(id);
        }}
      >
        {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
      </Button>

      {/* More options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0">
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onDuplicate(id)}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate Track
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit3 className="w-4 h-4 mr-2" />
            Change Color
          </DropdownMenuItem>
          <DropdownMenuItem>
            <StickyNote className="w-4 h-4 mr-2" />
            Add Note
          </DropdownMenuItem>
          <MenubarSeparator />
          <DropdownMenuItem onClick={() => onDelete(id)} className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Track
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
