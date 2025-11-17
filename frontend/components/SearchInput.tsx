'use client';

import { useEffect } from 'react';
import { TextInput, ActionIcon, useMantineTheme } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useSearch } from '@/contexts/SearchContext';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

export default function SearchInput({ 
  placeholder = 'Search songs, artists, albums...', 
  className 
}: SearchInputProps) {
  const { query, setQuery, isOpen, setIsOpen, performSearch, clearSearch } = useSearch();
  const theme = useMantineTheme();

  // Keyboard shortcut listener (Ctrl/Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    performSearch(value);
  };

  const handleClear = () => {
    clearSearch();
  };

  return (
    <TextInput
      placeholder={placeholder}
      value={query}
      onChange={(e) => handleInputChange(e.target.value)}
      onClick={() => setIsOpen(true)}
      leftSection={<IconSearch size={18} />}
      rightSection={
        query ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={handleClear}
            size="sm"
          >
            <IconX size={16} />
          </ActionIcon>
        ) : null
      }
      className={className}
      styles={{
        input: {
          cursor: 'pointer',
          paddingLeft: '2.5rem',
        },
      }}
    />
  );
}
