/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import useStyle, { COLORS } from './styles';
import { useAvatar } from '../context/AvatarContext';
import Avatar from '../components/Avatar';
import AnimationPreview from '../components/AnimationPreview';

const Character: React.FC = () => {
  const navigate = useNavigate();
  const { boxWidth } = useStyle();
  const { avatarUrl } = useAvatar();
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [currentLipsyncAudio, setCurrentLipsyncAudio] = useState<string | null>(null);
  const [isLipsyncPlaying, setIsLipsyncPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const animations = [
    '/animations/expression/F_Talking_Variations_001.glb',
    '/animations/expression/F_Talking_Variations_002.glb',
    '/animations/expression/F_Talking_Variations_004.glb',
    '/animations/expression/F_Talking_Variations_005.glb',
    '/animations/expression/F_Talking_Variations_006.glb',
    '/animations/dance/F_Dances_001.glb',
    '/animations/dance/F_Dances_005.glb',
    '/animations/dance/F_Dances_006.glb',
  ];

  const lipsyncAudios = [
    '/audio/TestAudio1.mp3',
    '/audio/TestAudio2.mp3',
    '/audio/TestAudio3.mp3',
    '/audio/TestAudio4.mp3',
  ];

  const handleSelectAnimation = (animationUrl: string) => {
    setCurrentAnimation(animationUrl);
  };

  const handleExitButtonClick = () => {
    navigate('/exit');
  };

  const handleLipsyncButtonClick = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (currentLipsyncAudio === audioUrl && isLipsyncPlaying) {
      setIsLipsyncPlaying(false);
      setCurrentLipsyncAudio(null);
    } else {
      setCurrentLipsyncAudio(audioUrl);
      setIsLipsyncPlaying(true);
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener('ended', () => {
        setIsLipsyncPlaying(false);
        setCurrentLipsyncAudio(null);
      });
      audioRef.current.play().catch(error => console.error('Error playing audio:', error));
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <Box
      component="div"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        bgcolor: COLORS.bgcolor,
        position: 'relative',
      }}>
      <IconButton
        onClick={handleExitButtonClick}
        sx={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: COLORS.primary,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 1)',
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
        {/* Main content area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 2vh' }}>
          <Box
            component="div"
            className="shadow-box"
            sx={{
              width: '65%',
              aspectRatio: '4/3',
              margin: '2vh auto',
              bgcolor: '#FFFFFF',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0',
            }}>
            <Canvas shadows>
              <PerspectiveCamera makeDefault position={[0, 1.5, 3]} fov={50} />
              <color attach="background" args={['#f0f0f0']} />

              <spotLight
                position={[3, 3, 3]}
                angle={0.6}
                penumbra={1}
                intensity={0.5}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                color="#faf0e6"
              />
              <pointLight position={[-3, 2, 0]} intensity={0.3} color="#e6f0fa" />
              <pointLight position={[0, 2, -3]} intensity={0.2} color="#f0fae6" />
              <ambientLight intensity={0.4} />

              <Avatar 
                avatarUrl={avatarUrl} 
                currentAnimation={currentAnimation} 
                currentLipsyncAudio={currentLipsyncAudio}
                isLipsyncPlaying={isLipsyncPlaying}
              />
              
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <shadowMaterial transparent opacity={0.1} />
              </mesh>

              <OrbitControls enablePan={true} enableZoom={true} enableRotate={false} target={[0,1.4,0]} />
              <Environment preset="warehouse" />
            </Canvas>
          </Box>
        </Box>

        {/* Animation preview column */}
        <Box sx={{ width: '300px', height: '100%', borderLeft: '1px solid #ccc', padding: '20px', overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Animations
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {animations.map((animationUrl, index) => (
              <Box
                key={index}
                onClick={() => handleSelectAnimation(animationUrl)}
                sx={{
                  width: '100%',
                  height: '250px',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                  border: '1px solid #ccc',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                }}
              >
                <Canvas camera={{ position: [0, 1.3, 1.2] }}>
                  <color attach="background" args={['#f0f0f0']} />
                  <AnimationPreview
                    avatarUrl={avatarUrl}
                    animationUrl={animationUrl}
                    onSelect={handleSelectAnimation}
                  />
                  <OrbitControls enableZoom={false} enablePan={false} target={[0,1.4,0]} />
                  <Environment preset="warehouse" />
                </Canvas>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Bottom panel for lipsync controls */}
      <Box
        sx={{
          width: '100%',
          height: '150px',
          borderTop: '1px solid #ccc',
          padding: '20px',
          bgcolor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Lipsync Controls
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {lipsyncAudios.map((audioUrl, index) => (
            <Button
              key={index}
              variant="contained"
              onClick={() => handleLipsyncButtonClick(audioUrl)}
              sx={{
                borderRadius: '20px',
                padding: '10px 20px',
                backgroundColor: currentLipsyncAudio === audioUrl && isLipsyncPlaying ? '#4CAF50' : '#2196F3',
                '&:hover': {
                  backgroundColor: currentLipsyncAudio === audioUrl && isLipsyncPlaying ? '#45a049' : '#1976D2',
                },
              }}
            >
              {currentLipsyncAudio === audioUrl && isLipsyncPlaying ? 'Stop' : `Play Audio ${index + 1}`}
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Character;