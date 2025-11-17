'use client';

import { useState } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { notifications } from '@mantine/notifications';

interface FavoriteButtonProps {
  songId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function FavoriteButton({ songId, size = 'md', showLabel = false }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);
  const favorited = isFavorite(songId);

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 18 : 22;
  const buttonSize = size === 'sm' ? 32 : size === 'md' ? 36 : 44;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    setIsLoading(true);
    try {
      await toggleFavorite(songId);
      
      notifications.show({
        title: favorited ? 'Removed from favorites' : 'Added to favorites',
        message: favorited ? 'Song removed from your favorites' : 'Song added to your favorites',
        color: favorited ? 'gray' : 'pink',
        icon: favorited ? <IconHeart size={16} /> : <IconHeartFilled size={16} />,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update favorites. Please try again.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip label={favorited ? 'Remove from favorites' : 'Add to favorites'} position="top">
      <ActionIcon
        variant="subtle"
        color={favorited ? 'pink' : 'gray'}
        size={buttonSize}
        onClick={handleClick}
        loading={isLoading}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        style={{
          transition: 'transform 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {favorited ? (
          <IconHeartFilled size={iconSize} style={{ color: '#e91e63' }} />
        ) : (
          <IconHeart size={iconSize} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
