import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Avatar } from '@readyplayerme/visage';

interface ReadyPlayerMeAvatarProps {
  avatarUrl: string;
  animationSrc: string | null;
}

export interface ReadyPlayerMeAvatarRef {
  setAnimation: (animationSrc: string) => void;
}

const ReadyPlayerMeAvatar = forwardRef<ReadyPlayerMeAvatarRef, ReadyPlayerMeAvatarProps>(
  ({ avatarUrl, animationSrc }, ref) => {
    const [key, setKey] = useState(0);

    useImperativeHandle(ref, () => ({
      setAnimation: (newAnimationSrc: string) => {
        // This will trigger a re-render with the new animation
        setKey(prevKey => prevKey + 1);
      },
    }));

    useEffect(() => {
      // Force re-render of Avatar component when animationSrc changes
      setKey(prevKey => prevKey + 1);
    }, [animationSrc]);

    return (
      <Avatar
        key={key}
        modelSrc={avatarUrl}
        animationSrc={animationSrc || undefined}
        style={{ width: '100%', height: '100%' }}
      />
    );
  }
);

export default ReadyPlayerMeAvatar;