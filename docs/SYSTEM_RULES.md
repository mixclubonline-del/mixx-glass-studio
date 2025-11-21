# F.L.O.W. — SYSTEM RULES

## Track-to-System Relationship Rules

### RULE 1: Tracks Don't Exist Until Created
- Track state exists in React state
- Track audio nodes (analyser, gain, panner) don't exist until created
- **No track analysis until track nodes exist**
- Track nodes are created when track is added to timeline

### RULE 2: Tracks Must Have Clips Playing
- Track analysis only happens when:
  - Track has clips on timeline
  - Clips are at current playhead position
  - Transport is playing (`isPlaying === true`)
- **No clips at playhead = No track analysis**

### RULE 3: Tracks Must Not Be Muted
- Muted tracks contribute zero to analysis
- Solo logic: If any track is soloed, only soloed tracks contribute
- **Muted or unsoloed = No track analysis**

### RULE 4: Tracks Must Have Actual Audio
- Track analyser reads audio signal
- Noise floor gating: `level > 0.001` (normalized, ~-60dB)
- **Silence or noise below threshold = Zero analysis**

### RULE 5: Master Analysis is Sum of Active Tracks
- Master analyser reads sum of all active tracks
- Active track = Not muted + Has clips playing + Has audio > noise floor
- **No active tracks = No master analysis = No ALS = No Bloom**

## Complete System Flow

```
1. CREATE TRACKS
   ↓ (from audio import, stem separation, etc.)
   
2. CREATE TRACK NODES
   ↓ (analyser, gain, panner, FX chain)
   
3. PLACE CLIPS ON TRACKS
   ↓ (clips reference audio buffers)
   
4. PLAY TRANSPORT
   ↓ (isPlaying = true, playhead moves)
   
5. SCHEDULE CLIPS
   ↓ (activeSources created for clips at playhead)
   
6. TRACK ANALYSERS READ
   ↓ (only if: nodes exist + clips playing + not muted + audio > noise floor)
   
7. TRACK ANALYSIS → TRACK ALS
   ↓ (deriveTrackALSFeedback from track analysis)
   
8. TRACKS → MASTER INPUT
   ↓ (active tracks sum to master chain)
   
9. MASTER ANALYSER READS
   ↓ (only if: isPlaying + master level > noise floor)
   
10. MASTER ANALYSIS → MASTER ALS
    ↓ (momentum, harmony, temperature, pressure)
    
11. MASTER ALS → BLOOM PULSE
    ↓ (bloomPulseAgent derived from master ALS)
    
12. BLOOM → DOCK/HUB VISUALS
    ↓ (pulse, glow, waveform display)
```

## Critical Gates

**Track Analysis Gate:**
- ✅ Track nodes exist
- ✅ Clips playing at current time
- ✅ Transport playing
- ✅ Track not muted
- ✅ Audio level > noise floor (0.001)

**Master Analysis Gate:**
- ✅ Transport playing
- ✅ Master analyser exists
- ✅ Master level > noise floor (0.001)

**ALS Gate:**
- ✅ Master analysis level > 0
- ✅ Transport playing
- ✅ No false readings from feedback/noise

**Bloom Gate:**
- ✅ Master ALS has activity
- ✅ Transport playing
- ✅ Actual audio present

## System Integrity

**When Nothing Exists:**
- No tracks → No analysis → No ALS → No Bloom
- Tracks exist but no clips → No analysis → No ALS → No Bloom
- Clips exist but not playing → No analysis → No ALS → No Bloom
- Playing but muted → No analysis → No ALS → No Bloom
- Playing but silence → No analysis → No ALS → No Bloom

**When Everything Works:**
- Tracks created → Nodes exist → Clips placed → Transport playing → 
- Clips scheduled → Audio flows → Track analysers read → 
- Track analysis → Track ALS → Master sum → Master analysis → 
- Master ALS → Bloom pulse → Visual feedback

**The Rule:**
> Tracks don't exist until we create them. Analysis doesn't happen until tracks exist, have clips, are playing, not muted, and have actual audio. The system is a chain - break any link, and everything downstream is zero.





