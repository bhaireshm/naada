'use client';

import { ReactNode } from 'react';
import { AppShell } from '@mantine/core';
import Navigation from '@/components/Navigation';
import { GlobalAudioPlayerProvider } from '@/components/GlobalAudioPlayer';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { SearchProvider } from '@/contexts/SearchContext';
import SearchOverlay from '@/components/SearchOverlay';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AudioPlayerProvider>
      <SearchProvider>
        <GlobalAudioPlayerProvider>
          <AppShell 
            header={{ height: 60 }} 
            footer={{ height: 64 }}
            padding="md"
          >
            <AppShell.Header>
              <Navigation />
            </AppShell.Header>
            <AppShell.Main>{children}</AppShell.Main>
          </AppShell>
          <SearchOverlay />
        </GlobalAudioPlayerProvider>
      </SearchProvider>
    </AudioPlayerProvider>
  );
}
