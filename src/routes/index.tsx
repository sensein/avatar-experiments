import React from 'react';
import { useRoutes } from 'react-router-dom';
import Character from '../pages/character';
import Personality from '../pages/personality';
import Tools from '../pages/tools';
import Home from '../pages/home';
import Exit from '../pages/exit';
import CreateAvatar from '../pages/createAvatar';
import ConfigPersonality from '../pages/configPersonality';
import AvatarPage from '../pages/avatarPage';

export function Router() {
  return useRoutes([
    {
      path: '/',
      element: <Home />,
    },
    {
      path: '/tools',
      element: <Tools />
    },
    {
      path: '/personality',
      element: <Personality />,
    },
    {
      path: '/character',
      element: <Character />
    },
    {
      path: '/exit',
      element: <Exit />
    },
    {
      path: '/createAvatar',
      element: <CreateAvatar />
    },
    {
      path: '/configPersonality',
      element: <ConfigPersonality />
    },
    {
      path: '/avatar',
      element: <AvatarPage />
    }
  ]);
}