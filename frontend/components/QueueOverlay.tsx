/* eslint-disable react-hooks/refs */
import { Text, Group, Stack, useMantineTheme, Drawer, Box, ActionIcon, Portal } from '@mantine/core';
import { IconGripVertical, IconX } from '@tabler/icons-react';
import { Song } from '@/lib/api';
import { DragDropContext, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { StrictModeDroppable } from './StrictModeDroppable';
import PlayingAnimation from './PlayingAnimation';

interface QueueOverlayProps {
    queue: Song[];
    currentIndex: number;
    onPlay: (index: number) => void;
    onClose: () => void;
    isOpen: boolean;
    zIndex?: number;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onRemove?: (index: number) => void;
    isPlaying?: boolean;
}

const MAX_QUEUE_DISPLAY = 100;

// Queue item component to render each draggable song
function QueueItem({
    song,
    index,
    currentIndex,
    isPlaying,
    onPlay,
    onReorder,
    onRemove,
    provided,
    snapshot,
    theme,
}: {
    song: Song;
    index: number;
    currentIndex: number;
    isPlaying: boolean;
    onPlay: (index: number) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onRemove?: (index: number) => void;
    provided: DraggableProvided;
    snapshot: DraggableStateSnapshot;
    theme: ReturnType<typeof useMantineTheme>;
}) {
    const isCurrent = index === currentIndex;

    const content = (
        <Box
            ref={provided.innerRef}
            {...provided.draggableProps}
            py="xs"
            px="sm"
            style={{
                ...provided.draggableProps.style,
                backgroundColor: snapshot.isDragging
                    ? theme.colors.dark[4]
                    : isCurrent ? theme.colors.dark[6] : theme.colors.dark[7],
                cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
                borderRadius: theme.radius.sm,
                marginBottom: 2,
                boxShadow: snapshot.isDragging ? theme.shadows.lg : 'none',
                border: snapshot.isDragging ? `1px solid ${theme.colors.dark[4]}` : 'none',
            }}
            onClick={() => !snapshot.isDragging && onPlay(index)}
        >
            <Group wrap="nowrap" gap="sm">
                {onReorder && (
                    <Box
                        {...provided.dragHandleProps}
                        style={{
                            cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            touchAction: 'none',
                        }}
                    >
                        <IconGripVertical size={16} color={theme.colors.gray[6]} />
                    </Box>
                )}
                {/* Playing indicator or spacer */}
                <Box w={20} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isCurrent && isPlaying ? (
                        <PlayingAnimation size={16} color={theme.colors.primary[4]} />
                    ) : isCurrent ? (
                        <Box
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: theme.colors.primary[4],
                            }}
                        />
                    ) : null}
                </Box>
                <Box style={{ flex: 1, overflow: 'hidden' }}>
                    <Text
                        size="sm"
                        fw={isCurrent ? 700 : 500}
                        truncate
                        c={isCurrent ? theme.colors.primary[4] : undefined}
                    >
                        {song.title}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                        {song.artist}
                    </Text>
                </Box>
                {onRemove && (
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(index);
                        }}
                        aria-label={`Remove ${song.title} from queue`}
                    >
                        <IconX size={14} />
                    </ActionIcon>
                )}
            </Group>
        </Box>
    );

    // Use Portal when dragging to escape overflow:hidden containers
    if (snapshot.isDragging) {
        return <Portal>{content}</Portal>;
    }

    return content;
}

export default function QueueOverlay({ queue, currentIndex, onPlay, onClose, isOpen, zIndex = 1000, onReorder, onRemove, isPlaying = false }: QueueOverlayProps) {
    const theme = useMantineTheme();

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || !onReorder) return;
        onReorder(result.source.index, result.destination.index);
    };

    // Limit displayed songs to MAX_QUEUE_DISPLAY
    const displayedQueue = queue.slice(0, MAX_QUEUE_DISPLAY);
    const hasMoreSongs = queue.length > MAX_QUEUE_DISPLAY;

    return (
        <Drawer
            opened={isOpen}
            onClose={onClose}
            position="right"
            size="sm"
            title={
                <Group gap="xs">
                    <Text fw={700} size="lg">Queue</Text>
                    <Text size="sm" c="dimmed">
                        {hasMoreSongs ? `${MAX_QUEUE_DISPLAY} of ${queue.length}` : queue.length} songs
                    </Text>
                </Group>
            }
            zIndex={zIndex}
            styles={{
                body: {
                    padding: 0,
                    height: 'calc(100% - 60px)',
                    overflow: 'hidden',
                },
                header: {
                    padding: theme.spacing.md,
                    borderBottom: `1px solid ${theme.colors.dark[4]}`,
                },
                content: {
                    backgroundColor: theme.colors.dark[7],
                },
                close: {
                    color: theme.colors.gray[5],
                },
            }}
        >
            <DragDropContext onDragEnd={handleDragEnd}>
                <StrictModeDroppable droppableId="queue-list">
                    {(provided) => (
                        <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            px="xs"
                            style={{
                                height: '100%',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                            }}
                        >
                            {displayedQueue.map((song, index) => (
                                <Draggable
                                    key={`${song.id}-${index}`}
                                    draggableId={`${song.id}-${index}`}
                                    index={index}
                                    isDragDisabled={!onReorder}
                                >
                                    {(provided, snapshot) => (
                                        <QueueItem
                                            song={song}
                                            index={index}
                                            currentIndex={currentIndex}
                                            isPlaying={isPlaying}
                                            onPlay={onPlay}
                                            onReorder={onReorder}
                                            onRemove={onRemove}
                                            provided={provided}
                                            snapshot={snapshot}
                                            theme={theme}
                                        />
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            {queue.length === 0 && (
                                <Stack align="center" justify="center" py="xl" gap="xs">
                                    <Text c="dimmed" ta="center">Queue is empty</Text>
                                    <Text size="xs" c="dimmed" ta="center">
                                        Play a song to start the queue
                                    </Text>
                                </Stack>
                            )}
                            {hasMoreSongs && (
                                <Text size="xs" c="dimmed" ta="center" py="md">
                                    Showing first {MAX_QUEUE_DISPLAY} of {queue.length} songs
                                </Text>
                            )}
                        </Box>
                    )}
                </StrictModeDroppable>
            </DragDropContext>
        </Drawer>
    );
}