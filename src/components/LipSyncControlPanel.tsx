import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button } from '@mui/material';
import * as THREE from 'three';

interface LipSyncControlsProps {
  avatarMixer: THREE.AnimationMixer | null;
  onAnimationStart: () => void;
}

interface MorphTargetMesh extends THREE.Object3D {
  morphTargetDictionary?: { [key: string]: number };
  morphTargetInfluences?: number[];
}

interface VisemeData {
  mouthCues: {
    start: number;
    end: number;
    value: string;
  }[];
  metadata: {
    duration: number;
  };
}

const visemeToBlendShape: { [key: string]: string[] } = {
  'X': ['viseme_sil', 'viseme_sil'],
  'A': ['viseme_PP', 'viseme_PP'],
  'B': ['viseme_kk', 'viseme_kk'],
  'C': ['viseme_I', 'viseme_I'],
  'D': ['viseme_AA', 'viseme_AA'],
  'E': ['viseme_O', 'viseme_O'],
  'F': ['viseme_U', 'viseme_U'],
  'G': ['viseme_FF', 'viseme_FF'],
  'H': ['viseme_TH', 'viseme_TH'],
};

const LipSyncControls: React.FC<LipSyncControlsProps> = ({ avatarMixer, onAnimationStart }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const visemeDataRef = useRef<VisemeData | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    fetch('/viseme/Viseme1.json')
      .then(response => response.json())
      .then(data => {
        visemeDataRef.current = data as VisemeData;
        console.log('Viseme data loaded:', data);
      })
      .catch(error => console.error('Error loading viseme data:', error));

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const setBlendShapes = useCallback((shapes: string[], values: number[]) => {
    if (!avatarMixer) return;

    const avatarRoot = avatarMixer.getRoot() as MorphTargetMesh;
    const morphTargetDictionary = avatarRoot.morphTargetDictionary;
    const morphTargetInfluences = avatarRoot.morphTargetInfluences;

    if (!morphTargetDictionary || !morphTargetInfluences) {
      console.warn('Avatar root does not have morph targets');
      return;
    }

    shapes.forEach((shape, index) => {
      const morphIndex = morphTargetDictionary[shape];
      if (typeof morphIndex === 'number' && morphIndex < morphTargetInfluences.length) {
        morphTargetInfluences[morphIndex] = values[index];
      }
    });
  }, [avatarMixer]);

  const animateLipsync = useCallback(() => {
    if (!visemeDataRef.current || !audioRef.current || !avatarMixer) return;

    const currentTime = (Date.now() - startTimeRef.current) / 1000;
    const visemeData = visemeDataRef.current;

    const currentCue = visemeData.mouthCues.find((cue) => 
      currentTime >= cue.start && currentTime < cue.end
    );

    if (currentCue) {
      const blendShapes = visemeToBlendShape[currentCue.value];
      if (blendShapes) {
        const allShapes = Object.values(visemeToBlendShape).flat();
        const values = allShapes.map(shape => blendShapes.includes(shape) ? 1 : 0);
        setBlendShapes(allShapes, values);
      }
    } else {
      // Reset to neutral expression
      const allShapes = Object.values(visemeToBlendShape).flat();
      const values = new Array(allShapes.length).fill(0);
      setBlendShapes(allShapes, values);
    }

    if (currentTime < visemeData.metadata.duration) {
      animationRef.current = requestAnimationFrame(animateLipsync);
    } else {
      stopAudio();
    }
  }, [avatarMixer, setBlendShapes]);

  const playAudio = (audioFile: string) => {
    if (isPlaying) {
      stopAudio();
    }

    audioRef.current = new Audio(audioFile);
    audioRef.current.play();
    setIsPlaying(true);
    onAnimationStart();
    startTimeRef.current = Date.now();

    animateLipsync();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    // Reset to neutral expression
    const allShapes = Object.values(visemeToBlendShape).flat();
    const values = new Array(allShapes.length).fill(0);
    setBlendShapes(allShapes, values);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
      <Button
        variant="contained"
        onClick={() => playAudio('/audio/TestAudio1.mp3')}
        sx={{ borderRadius: '20px', padding: '10px 20px' }}
      >
        Play Audio 1
      </Button>
      <Button
        variant="contained"
        onClick={() => playAudio('/audio/TestAudio2.mp3')}
        sx={{ borderRadius: '20px', padding: '10px 20px' }}
        disabled={true} 
      >
        Play Audio 2
      </Button>
      <Button
        variant="contained"
        onClick={() => playAudio('/audio/TestAudio3.mp3')}
        sx={{ borderRadius: '20px', padding: '10px 20px' }}
        disabled={true} 
      >
        Play Audio 3
      </Button>
      <Button
        variant="contained"
        onClick={() => playAudio('/audio/TestAudio4.mp3')}
        sx={{ borderRadius: '20px', padding: '10px 20px' }}
        disabled={true} 
      >
        Play Audio 4
      </Button>
    </Box>
  );
};

export default LipSyncControls;