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
import LipSyncControls from '../components/LipSyncControlPanel';

const WEBSOCKET_SERVER_URL = process.env.REACT_APP_WEBSOCKET_SERVER_URL || 'ws://localhost:3001';

const Character: React.FC = () => {
  const navigate = useNavigate();
  const { boxWidth } = useStyle();
  const { avatarUrl } = useAvatar();
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [currentLipsyncAudio, setCurrentLipsyncAudio] = useState<string | null>(null);
  const [isLipsyncPlaying, setIsLipsyncPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [externalAnimationData, setExternalAnimationData] = useState<any>(null);
  const [externalLipsyncData, setExternalLipsyncData] = useState<any>(null);
  const [isStreamingAudio, setIsStreamingAudio] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

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

  useEffect(() => {
    // Set up WebSocket connection
    wsRef.current = new WebSocket(WEBSOCKET_SERVER_URL);

    wsRef.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'animation') {
        setExternalAnimationData(data);
      } else if (data.type === 'lipsync') {
        setExternalLipsyncData(data);
        if (data.audioUrl) {
          setCurrentLipsyncAudio(data.audioUrl);
          setIsLipsyncPlaying(true);
        }
      } else if (data.type === 'audio') {
        // Handle incoming audio data
        if (audioRef.current) {
          audioRef.current.src = data.audioUrl;
          audioRef.current.play().catch(error => console.error('Error playing audio:', error));
        }
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (externalAnimationData) {
      setCurrentAnimation(externalAnimationData.animationUrl);
    }
  }, [externalAnimationData]);

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

  const handleStartAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsStreamingAudio(true);

      // Initial setup for audio stream
      console.log('Audio stream started and ready to be sent');

      // Example: send audio data over WebSocket
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(1024, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const left = e.inputBuffer.getChannelData(0);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'audioData',
            data: Array.from(left)
          }));
        }
      };
    } catch (error) {
      console.error('Error starting audio stream:', error);
    }
  };

  const handleStopAudioStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreamingAudio(false);
    console.log('Audio stream stopped');
  };

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

      </Box>
    </Box>
  );
};

export default Character;