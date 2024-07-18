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

import React, { useEffect, useState, useRef } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import { CloseOutlined, KeyboardVoiceOutlined, Pause, MicOffOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useLanguageModel from '../apis/languageModel';
import useSpeechRecognition, { CharacterState } from '../apis/speechRecognition';
import useTextToSpeech from '../apis/textToSpeech';
import useStyle, { COLORS } from './styles';
import { useAvatar } from '../context/AvatarContext';
import ReadyPlayerMeAvatar, { ReadyPlayerMeAvatarRef } from '../components/ReadyPlayerMeAvatar';
import AnimationPanel from './AnimationPanel';

const animationCategories = {
  dance: [
    'F_Dances_001', 'F_Dances_004', 'F_Dances_005', 'F_Dances_006', 'F_Dances_007',
    'M_Dances_001', 'M_Dances_002', 'M_Dances_003', 'M_Dances_004', 'M_Dances_005',
    'M_Dances_006', 'M_Dances_007', 'M_Dances_008', 'M_Dances_009', 'M_Dances_011'
  ],
  expression: [
    'F_Talking_Variations_001', 'F_Talking_Variations_002', 'F_Talking_Variations_003',
    'F_Talking_Variations_004', 'F_Talking_Variations_005', 'F_Talking_Variations_006',
    'M_Standing_Expressions_001', 'M_Standing_Expressions_002', 'M_Standing_Expressions_004',
    'M_Standing_Expressions_005', 'M_Standing_Expressions_007', 'M_Standing_Expressions_008',
    'M_Standing_Expressions_009', 'M_Standing_Expressions_010', 'M_Standing_Expressions_011',
    'M_Standing_Expressions_012', 'M_Standing_Expressions_013', 'M_Standing_Expressions_014',
    'M_Standing_Expressions_015', 'M_Standing_Expressions_016', 'M_Standing_Expressions_017',
    'M_Standing_Expressions_018', 'M_Talking_Variations_001', 'M_Talking_Variations_002',
    'M_Talking_Variations_003', 'M_Talking_Variations_004', 'M_Talking_Variations_005',
    'M_Talking_Variations_006', 'M_Talking_Variations_007', 'M_Talking_Variations_008',
    'M_Talking_Variations_009', 'M_Talking_Variations_010'
  ],
  idle: [
    'F_Standing_Idle_001', 'F_Standing_Idle_Variations_001', 'F_Standing_Idle_Variations_002',
    'F_Standing_Idle_Variations_003', 'F_Standing_Idle_Variations_004', 'F_Standing_Idle_Variations_005',
    'F_Standing_Idle_Variations_006', 'F_Standing_Idle_Variations_007', 'F_Standing_Idle_Variations_008',
    'F_Standing_Idle_Variations_009', 'M_Standing_Idle_001', 'M_Standing_Idle_Variations_001',
    'M_Standing_Idle_Variations_002', 'M_Standing_Idle_Variations_003', 'M_Standing_Idle_Variations_004',
    'M_Standing_Idle_Variations_005', 'M_Standing_Idle_Variations_006', 'M_Standing_Idle_Variations_007',
    'M_Standing_Idle_Variations_008', 'M_Standing_Idle_Variations_009', 'M_Standing_Idle_Variations_010'
  ],
  locomotion: [
    'F_Crouch_Strafe_Left', 'F_Crouch_Strafe_Right', 'F_Crouch_Walk_001', 'F_CrouchedWalk_Backwards_001',
    'F_Falling_Idle_000', 'F_Falling_Idle_001', 'F_Jog_001', 'F_Jog_Backwards_001', 'F_Jog_Jump_Small_001',
    'F_Jog_Strafe_Left_001', 'F_Jog_Strafe_Right_001', 'F_Run_001', 'F_Run_Backwards_001', 'F_Run_Jump_001',
    'F_Run_Strafe_Left_001', 'F_Run_Strafe_Right_001', 'F_Walk_Backwards_001', 'F_Walk_Jump_001',
    'F_Walk_Strafe_Left_001', 'F_Walk_Strafe_Right_001', 'M_Crouch_Strafe_Left_002', 'M_Crouch_Strafe_Right_002',
    'M_Crouch_Walk_003', 'M_CrouchedWalk_Backwards_002', 'M_Jog_Jump_001', 'M_Jog_Jump_002', 'M_Run_Jump_001',
    'M_Walk_Jump_001', 'M_Walk_Jump_002', 'M_Walk_Strafe_Left_002', 'M_Walk_Strafe_Right_002'
  ]
};

const Character: React.FC = () => {
  const navigate = useNavigate();
  const { sendMessage } = useLanguageModel();
  const {
    characterState,
    bars,
    setCharacterState,
    onMicButtonPressed,
    setOnSpeechFoundCallback,
  } = useSpeechRecognition();
  const { convert, setOnProcessCallback } = useTextToSpeech();
  const { avatarUrl } = useAvatar();
  const [transcript, setTranscript] = useState<String[]>(['You', '']);
  const { boxWidth } = useStyle();
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const avatarRef = useRef<ReadyPlayerMeAvatarRef>(null);

  useEffect(() => {
    setOnProcessCallback((audioData: Float32Array) => {
      // Handle audio processing if needed
    });
    setOnSpeechFoundCallback((transcription: string) => {
      setTranscript(['You', transcription]);
      sendMessage(transcription).then((result) => {
        setTranscript(['AI tutor', result]);
        convert(result).then(() => {
          setCharacterState(CharacterState.Idle);
        });
      });
    });

    // Set random idle animation on load
    const randomIdleAnimation = animationCategories.idle[Math.floor(Math.random() * animationCategories.idle.length)];
    setCurrentAnimation(`/animations/idle/${randomIdleAnimation}.fbx`);
  }, []);

  const handleExitButtonClick = () => {
    navigate('/exit');
    sessionStorage.setItem("usePalmApi", "false");
    sessionStorage.setItem("useGoogleApi", "false");
  };

  const handleSelectAnimation = (category: string, animation: string) => {
    const newAnimationSrc = `/animations/${category}/${animation}.fbx`;
    setCurrentAnimation(newAnimationSrc);
    if (avatarRef.current) {
      avatarRef.current.setAnimation(newAnimationSrc);
    }
  };

  const characterStateIcon = {
    [CharacterState.Idle]: (
      <IconButton
        className="shadow-box"
        onClick={onMicButtonPressed}
        aria-label="Start Recording"
        sx={{
          width: '10vh',
          height: '10vh',
          marginTop: '30px',
          padding: '16px',
          borderRadius: '50%',
          color: COLORS.primary,
          backgroundColor: COLORS.bgcolor,
          '&:hover': {
            backgroundColor: COLORS.bgcolor,
            '@media (hover: none)': {
              backgroundColor: COLORS.bgcolor,
            },
          },
        }}>
        <KeyboardVoiceOutlined sx={{fontSize: '40px'}} />
      </IconButton>
    ),
    [CharacterState.Listening]: (
      <IconButton
        className="shadow-box"
        onClick={onMicButtonPressed}
        color="error"
        aria-label="Stop Recording"
        sx={{
          width: '10vh',
          height: '10vh',
          marginTop: '30px',
          padding: '16px',
          borderRadius: '50%',
          backgroundColor: COLORS.bgcolor,
          '&:hover': {
            backgroundColor: COLORS.bgcolor,
            '@media (hover: none)': {
              backgroundColor: COLORS.bgcolor,
            },
          },
        }}>
        <Pause sx={{fontSize: '40px'}} />
      </IconButton>
    ),
    [CharacterState.Speaking]: (
      <IconButton
        className="shadow-box"
        onClick={onMicButtonPressed}
        color="default"
        aria-label="Recording Disabled"
        sx={{
          width: '10vh',
          height: '10vh',
          marginTop: '30px',
          padding: '16px',
          borderRadius: '50%',
          backgroundColor: 'grey.400',
          '&:hover': {
            backgroundColor: 'grey.500',
            '@media (hover: none)': {
              backgroundColor: 'grey.400',
            },
          },
        }}>
        <MicOffOutlined sx={{fontSize: '40px'}} />
      </IconButton>
    ),
  };

  return (
    <Box
      component="div"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        minHeight: '100vh',
        bgcolor: COLORS.bgcolor,
      }}>
      <Box
        component="div"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: '5vh',
          paddingRight: '5vh',
        }}>
        <AppBar
          position="static"
          color="transparent"
          elevation={0}
          sx={{width: boxWidth, alignSelf: 'center'}}>
          <Toolbar className="tool-bar">
            <Box component="div"
                className="shadow-back-button"
                sx={{justifyContent: 'center', color: COLORS.bgcolor, marginRight: '1vh'}}>
              <IconButton 
              onClick={handleExitButtonClick}
              sx={{
              fontSize: '3vh',
              color: COLORS.primary,}}>
              <CloseOutlined
                sx={{fontSize: '3vh', color: COLORS.primary}}
              />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            flexDirection: 'column',
            position: 'relative',
          }}>
          <Box
            component="div"
            className="shadow-box"
            sx={{
              width: boxWidth,
              height: '40vh',
              boxSizing: 'border-box',
              overflow: 'hidden',
              margin: '0 0 2vh 0',
              bgcolor: '#FFFFFF',
            }}>
            {avatarUrl ? (
              <ReadyPlayerMeAvatar
                ref={avatarRef}
                avatarUrl={avatarUrl}
                animationSrc={currentAnimation}
              />
            ) : (
              <Typography>No avatar created yet</Typography>
            )}
          </Box>

          <Box
            component="div"
            sx={{
              width: boxWidth,
              textAlign: 'left',
              boxSizing: 'content-box',
              overflow: 'hidden',
            }}>
            <Typography>{transcript[0]}</Typography>
          </Box>
          <Box
            component="div"
            className="shadow-box"
            sx={{
              width: boxWidth,
              height: '15vh',
              verticalAlign: 'middle',
              boxSizing: 'content-box',
              margin: '2vh 0',
              bgcolor: '#FFFFFF',
            }}>
            <Typography
              style={{ color: COLORS.primary }}
              sx={{
                padding: '0.8vh',
                margin: '1.2vh',
                textAlign: 'left',
                height: '11vh',
                overflow: 'scroll',
                '&::-webkit-scrollbar': {
                  width: '1.5px',
                  height: '0',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#AAA',
                  borderRadius: '0.7px',
                },
                borderRadius: '4vh',
                fontFamily: 'Google Sans, sans-serif',
                fontSize: '14px',
              }}>
              {transcript[1]}
            </Typography>
          </Box>

          <Box
            component="div"
            sx={{
              justifyContent: 'center',
              paddingTop: '2vh',
              transform: 'translate(15px, -30px)',
            }}>
            {characterStateIcon[characterState]}
            <Box component="div" className={`bar-container ${characterState != CharacterState.Listening ? 'hidden' : ''}`}>
              <Box component="div" ref={(el: HTMLDivElement | null) => (bars.current[0] = el)} className="bar" />
              <Box component="div" ref={(el: HTMLDivElement | null) => (bars.current[1] = el)} className="bar middle" />
              <Box component="div" ref={(el: HTMLDivElement | null) => (bars.current[2] = el)} className="bar" />
            </Box>
          </Box>
        </Box>
      </Box>
      <AnimationPanel
        categories={animationCategories}
        onSelectAnimation={handleSelectAnimation}
      />
    </Box>
  );
};

export default Character;