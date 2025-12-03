import { Box, Text, Group, Stack, ScrollArea, ActionIcon, useMantineTheme } from '@mantine/core';
import { IconX, IconPlayerPlay, IconGripVertical } from '@tabler/icons-react';
import { Song } from '@/lib/api';
import { DragDropContext, Draggable, DropResult } from '@hello-pangea/dnd';
import { StrictModeDroppable } from './StrictModeDroppable';

interface QueueOverlayProps {
    queue: Song[];
    currentIndex: number;
    onPlay: (index: number) => void;
    onClose: () => void;
    isOpen: boolean;
    zIndex?: number;
    onReorder?: (fromIndex: number, toIndex: number) => void;
}

export default function QueueOverlay({ queue, currentIndex, onPlay, onClose, isOpen, zIndex = 99, onReorder }: QueueOverlayProps) {
    const theme = useMantineTheme();

    if (!isOpen) return null;

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || !onReorder) return;
        onReorder(result.source.index, result.destination.index);
    };

    return (
        <Box
            style={{
                position: 'fixed',
                bottom: 80,
                right: 20,
                width: 350,
                maxWidth: '100vw',
                height: 'calc(100vh - 180px)', // Leave space for header/footer
                background: theme?.colors?.dark?.[7] || '#333',
                borderRadius: theme?.radius?.md || 8,
                boxShadow: theme?.shadows?.xl || 'none',
                zIndex: zIndex,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: `1px solid ${theme?.colors?.dark?.[4] || '#555'}`,
            }}
        >
            <Group justify="space-between" p="md" style={{ borderBottom: `1px solid ${theme?.colors?.dark?.[6] || '#444'}` }}>
                <Text fw={700} size="lg">Queue</Text>
                <ActionIcon variant="subtle" color="gray" onClick={onClose}>
                    <IconX size={20} />
                </ActionIcon>
            </Group>

            <DragDropContext onDragEnd={handleDragEnd}>
                <StrictModeDroppable droppableId="queue-list">
                    {(provided) => (
                        <ScrollArea style={{ flex: 1 }}>
                            <Stack gap={0} ref={provided.innerRef} {...provided.droppableProps}>
                                {queue.map((song, index) => {
                                    const isCurrent = index === currentIndex;
                                    return (
                                        <Draggable key={`${song.id}-${index}`} draggableId={`${song.id}-${index}`} index={index} isDragDisabled={!onReorder}>
                                            {(provided, snapshot) => (
                                                <Box
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    p="sm"
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                        backgroundColor: snapshot.isDragging
                                                            ? theme.colors.dark[5]
                                                            : isCurrent ? theme.colors.dark[6] : 'transparent',
                                                        cursor: 'pointer',
                                                        borderBottom: `1px solid ${theme.colors.dark[5]}`,
                                                        transition: 'background-color 0.2s',
                                                    }}
                                                    onClick={() => onPlay(index)}
                                                    onMouseEnter={(e) => {
                                                        if (!snapshot.isDragging) {
                                                            e.currentTarget.style.backgroundColor = isCurrent ? theme.colors.dark[6] : theme.colors.dark[5];
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!snapshot.isDragging) {
                                                            e.currentTarget.style.backgroundColor = isCurrent ? theme.colors.dark[6] : 'transparent';
                                                        }
                                                    }}
                                                >
                                                    <Group wrap="nowrap">
                                                        {onReorder && (
                                                            <Box {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                                                                <IconGripVertical size={16} color={theme.colors.gray[6]} />
                                                            </Box>
                                                        )}
                                                        <Text size="xs" c="dimmed" w={20} ta="center">{index + 1}</Text>
                                                        <Box style={{ flex: 1, overflow: 'hidden' }}>
                                                            <Text size="sm" fw={isCurrent ? 700 : 500} truncate c={isCurrent ? theme.colors.primary[4] : undefined}>
                                                                {song.title}
                                                            </Text>
                                                            <Text size="xs" c="dimmed" truncate>
                                                                {song.artist}
                                                            </Text>
                                                        </Box>
                                                        {isCurrent && <IconPlayerPlay size={16} color={theme.colors.primary[4]} />}
                                                    </Group>
                                                </Box>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                                {queue.length === 0 && (
                                    <Text p="md" c="dimmed" ta="center">Queue is empty</Text>
                                )}
                            </Stack>
                        </ScrollArea>
                    )}

                </StrictModeDroppable>
            </DragDropContext>
        </Box>
    );
}
