'use client';

import { Group, Button, Text, Select, useMantineTheme } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
}: PaginationProps) {
  const theme = useMantineTheme();

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Group justify="space-between" wrap="wrap" gap="md">
      <Text size="sm" c="dimmed">
        Showing {startItem} to {endItem} of {totalItems} items
      </Text>

      <Group gap="xs">
        <Button
          variant="light"
          size="sm"
          leftSection={<IconChevronLeft size={16} />}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        <Group gap={4}>
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <Text key={`ellipsis-${index}`} size="sm" c="dimmed" px="xs">
                  ...
                </Text>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? 'filled' : 'light'}
                size="sm"
                onClick={() => onPageChange(page as number)}
                styles={{
                  root: {
                    minWidth: 36,
                    padding: '0 8px',
                  },
                }}
              >
                {page}
              </Button>
            );
          })}
        </Group>

        <Button
          variant="light"
          size="sm"
          rightSection={<IconChevronRight size={16} />}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </Group>

      {showItemsPerPage && onItemsPerPageChange && (
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Items per page:
          </Text>
          <Select
            size="sm"
            value={itemsPerPage.toString()}
            onChange={(value) => onItemsPerPageChange(parseInt(value || '20'))}
            data={[
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '50', label: '50' },
              { value: '100', label: '100' },
            ]}
            styles={{
              input: {
                width: 80,
              },
            }}
          />
        </Group>
      )}
    </Group>
  );
}
