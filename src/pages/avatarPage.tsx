import React, { useState, useEffect, useRef } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Button } from '@mui/material';
import { ArrowBackIosNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useStyle, { COLORS } from './styles';
import { useAvatar } from '../context/AvatarContext';

const AvatarPage: React.FC = () => {
  const navigate = useNavigate();
  const { boxWidth } = useStyle();
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [avatarCreatorUrl, setAvatarCreatorUrl] = useState('');
  const { setAvatarUrl } = useAvatar();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://interactive-avatar-9dekor.readyplayer.me') {
        return;
      }

      if (typeof event.data === 'string' && event.data.startsWith('https://models.readyplayer.me/')) {
        // Modify the URL to include morph targets
        const modifiedUrl = `${event.data}?morphTargets=mouthOpen,Oculus Visemes`;
        setAvatarUrl(modifiedUrl);
        setShowAvatarCreator(false);
      } else if (event.data.eventName === 'v1.frame.ready') {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              target: 'readyplayerme',
              type: 'subscribe',
              eventName: 'v1.**'
            }),
            '*'
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setAvatarUrl]);

  const renderAppBar = () => (
    <AppBar position="static" color="transparent" elevation={0} sx={{width: '100%', alignSelf: 'center'}}>
      <Toolbar>
        <IconButton onClick={() => showAvatarCreator ? setShowAvatarCreator(false) : navigate(-1)}>
          <ArrowBackIosNew sx={{color: COLORS.primary}} />
        </IconButton>
        <Typography sx={{color: COLORS.primary}}>
          Avatar Creation
        </Typography>
      </Toolbar>
    </AppBar>
  );

  const renderAvatarCreator = () => (
    <Box
      sx={{
        width: '100%',
        height: 'calc(100vh - 64px - 40px)', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: '16px',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box
        component="iframe"
        ref={iframeRef}
        src={`${avatarCreatorUrl}?frameApi&clearCache&quickStart=false&t=${Date.now()}`}
        allow="camera *; microphone *"
        sx={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </Box>
  );

  const renderButtons = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: boxWidth }}>
      <Button 
        onClick={() => {
          setAvatarCreatorUrl('https://interactive-avatar-9dekor.readyplayer.me');
          setShowAvatarCreator(true);
        }}
        sx={{
          color: COLORS.primary,
          bgcolor: '#FFFFFF',
          height: '8vh',
          borderRadius: '2.6vh',
          boxShadow: '1vh 1vh 1vh 0.1vh rgba(0,0,0,0.2)',
        }}
      >
        Create Full Body Avatar
      </Button>
      <Button 
        onClick={() => navigate('/createAvatar')}
        sx={{
          color: COLORS.primary,
          bgcolor: '#FFFFFF',
          height: '8vh',
          borderRadius: '2.6vh',
          boxShadow: '1vh 1vh 1vh 0.1vh rgba(0,0,0,0.2)',
        }}
      >
        Other Avatar Option
      </Button>
    </Box>
  );

  return (
    <Box
      component="div"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: COLORS.bgcolor,
        alignItems: 'center',
        padding: '20px',
      }}
    >
      {renderAppBar()}
      {showAvatarCreator ? (
        <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {renderAvatarCreator()}
        </Box>
      ) : (
        <>
          <Box component="div" sx={{ width: '100%', height: '10vh' }} />
          {renderButtons()}
        </>
      )}
    </Box>
  );
};

export default AvatarPage;