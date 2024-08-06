import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

interface AnimationPanelProps {
  categories: Record<string, string[]>;
  onSelectAnimation: (category: string, animation: string) => void;
}

const AnimationPanel: React.FC<AnimationPanelProps> = ({ categories, onSelectAnimation }) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const handleCategoryClick = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  return (
    <Box sx={{ width: 250, height: '100vh', overflow: 'auto', bgcolor: 'background.paper' }}>
      <Typography variant="h6" sx={{ p: 2 }}>Animations</Typography>
      <List>
        {Object.entries(categories).map(([category, animations]) => (
          <React.Fragment key={category}>
            <ListItemButton onClick={() => handleCategoryClick(category)}>
              <ListItemText primary={category.charAt(0).toUpperCase() + category.slice(1)} />
              {openCategory === category ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openCategory === category} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {animations.map((animation) => (
                  <ListItem key={animation} disablePadding>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => onSelectAnimation(category, animation)}>
                      <ListItemText primary={animation} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default AnimationPanel;