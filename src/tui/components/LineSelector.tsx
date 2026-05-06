import {
    Box,
    Text,
    useInput
} from 'ink';
import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import { t } from '../../i18n';
import type { Settings } from '../../types/Settings';
import type { WidgetItem } from '../../types/Widget';

import { ConfirmDialog } from './ConfirmDialog';
import { List } from './List';

interface LineSelectorProps {
    lines: WidgetItem[][];
    onSelect: (line: number) => void;
    onBack: () => void;
    onLinesUpdate: (lines: WidgetItem[][]) => void;
    initialSelection?: number;
    title?: string;
    blockIfPowerlineActive?: boolean;
    settings?: Settings;
    allowEditing?: boolean;
}

const LineSelector: React.FC<LineSelectorProps> = ({
    lines,
    onSelect,
    onBack,
    onLinesUpdate,
    initialSelection = 0,
    title,
    blockIfPowerlineActive = false,
    settings,
    allowEditing = false
}) => {
    const [selectedIndex, setSelectedIndex] = useState(initialSelection);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [moveMode, setMoveMode] = useState(false);
    const [localLines, setLocalLines] = useState(lines);

    useEffect(() => {
        setLocalLines(lines);
    }, [lines]);

    useEffect(() => {
        setSelectedIndex(initialSelection);
    }, [initialSelection]);

    const selectedLine = useMemo(
        () => localLines[selectedIndex],
        [localLines, selectedIndex]
    );

    const appendLine = () => {
        const newLines = [...localLines, []];
        setLocalLines(newLines);
        onLinesUpdate(newLines);
        setSelectedIndex(newLines.length - 1);
    };

    const deleteLine = (lineIndex: number) => {
    // Don't allow deleting the last remaining line
        if (localLines.length <= 1) {
            return;
        }
        const newLines = [...localLines];
        newLines.splice(lineIndex, 1);
        setLocalLines(newLines);
        onLinesUpdate(newLines);
    };

    // Check if powerline theme is managing colors
    const powerlineEnabled = settings ? settings.powerline.enabled : false;
    const powerlineTheme = settings ? settings.powerline.theme : undefined;
    const isThemeManaged
        = blockIfPowerlineActive
            && powerlineEnabled
            && powerlineTheme
            && powerlineTheme !== 'custom';

    // Handle keyboard input
    useInput((input, key) => {
        if (showDeleteDialog) {
            return;
        }

        // If theme-managed and blocking is enabled, any key goes back
        if (isThemeManaged) {
            onBack();
            return;
        }

        if (moveMode) {
            if (key.upArrow && localLines.length > 1) {
                const newLines = [...localLines];
                const targetIndex = selectedIndex - 1 < 0 ? localLines.length - 1 : selectedIndex - 1;
                const temp = newLines[selectedIndex];
                const prev = newLines[targetIndex];
                if (temp && prev) {
                    [newLines[selectedIndex], newLines[targetIndex]] = [prev, temp];
                }
                setLocalLines(newLines);
                onLinesUpdate(newLines);
                setSelectedIndex(targetIndex);
            } else if (key.downArrow && localLines.length > 1) {
                const newLines = [...localLines];
                const targetIndex = selectedIndex + 1 > localLines.length - 1 ? 0 : selectedIndex + 1;
                const temp = newLines[selectedIndex];
                const next = newLines[targetIndex];
                if (temp && next) {
                    [newLines[selectedIndex], newLines[targetIndex]] = [next, temp];
                }
                setLocalLines(newLines);
                onLinesUpdate(newLines);
                setSelectedIndex(targetIndex);
            } else if (key.escape || key.return) {
                setMoveMode(false);
            }
            return;
        }

        switch (input) {
            case 'a':
                if (allowEditing) {
                    appendLine();
                }
                return;
            case 'd':
                if (allowEditing && localLines.length > 1 && selectedIndex < localLines.length) {
                    setShowDeleteDialog(true);
                }
                return;
            case 'm':
                if (allowEditing && localLines.length > 1 && selectedIndex < localLines.length) {
                    setMoveMode(true);
                }
                return;
        }

        if (key.escape) {
            onBack();
        }
    });

    // Show powerline theme warning if applicable
    if (isThemeManaged) {
        return (
            <Box flexDirection='column'>
                <Text bold>{title ?? 'Select Line'}</Text>
                <Box marginTop={1}>
                    <Text color='yellow'>
                        {t('lineSelector.powerlineColorWarning', { theme: powerlineTheme.charAt(0).toUpperCase() + powerlineTheme.slice(1) })}
                    </Text>
                </Box>
                <Box marginTop={1}>
                    <Text dimColor>{t('lineSelector.powerlineColorHint1')}</Text>
                </Box>
                <Box marginLeft={2}>
                    <Text dimColor>
                        {t('lineSelector.powerlineColorHint2')}
                    </Text>
                </Box>
                <Box marginLeft={2}>
                    <Text dimColor>
                        {t('lineSelector.powerlineColorHint3')}
                    </Text>
                </Box>
                <Box marginTop={2}>
                    <Text>{t('common.pressAnyKeyBack')}</Text>
                </Box>
            </Box>
        );
    }

    if (showDeleteDialog && selectedLine) {
        const suffix
            = selectedLine.length > 0
                ? `${selectedLine.length} ${selectedLine.length === 1 ? t('common.widget') : t('common.widgets')}`
                : t('lineSelector.emptyLine');

        return (
            <Box flexDirection='column'>
                <Box flexDirection='column' gap={1}>
                    <Text bold>
                        <Text>
                            <Text>
                                {t('lineSelector.lineIndicator')}
                                {selectedIndex + 1}
                            </Text>
                            {' '}
                            <Text dimColor>
                                (
                                {suffix}
                                )
                            </Text>
                        </Text>
                    </Text>
                    <Text bold>{t('confirm.deleteLine')}</Text>
                </Box>

                <Box marginTop={1}>
                    <ConfirmDialog
                        inline={true}
                        onConfirm={() => {
                            deleteLine(selectedIndex);
                            setSelectedIndex(Math.max(0, selectedIndex - 1));
                            setShowDeleteDialog(false);
                        }}
                        onCancel={() => {
                            setShowDeleteDialog(false);
                        }}
                    />
                </Box>
            </Box>
        );
    }

    const lineItems = localLines.map((line, index) => ({
        label: `${t('lineSelector.lineIndicator')} ${index + 1}`,
        sublabel: `(${line.length > 0 ? `${line.length} ${line.length === 1 ? t('common.widget') : t('common.widgets')}` : t('lineSelector.emptyLine')})`,
        value: index
    }));

    return (
        <>
            <Box flexDirection='column'>
                <Box>
                    <Text bold>
                        {title ?? t('lineSelector.title')}
                        {' '}
                    </Text>
                    {moveMode && <Text color='blue'>{t('lineSelector.moveMode')}</Text>}
                </Box>
                <Text dimColor>
                    {t('lineSelector.chooseHint')}
                </Text>
                {moveMode ? (
                    <Text dimColor>{t('lineSelector.moveModeHint')}</Text>
                ) : (
                    <Text dimColor>
                        {allowEditing ? (
                            localLines.length > 1
                                ? t('lineSelector.hintFull')
                                : t('lineSelector.hintAppendOnly')
                        ) : t('lineSelector.hintEscOnly')}
                    </Text>
                )}

                {moveMode ? (
                    <Box marginTop={1} flexDirection='column'>
                        {localLines.map((line, index) => {
                            const isSelected = selectedIndex === index;
                            const suffix = line.length
                                ? `${line.length} ${line.length === 1 ? t('common.widget') : t('common.widgets')}`
                                : t('lineSelector.emptyLine');

                            return (
                                <Box key={index}>
                                    <Text color={isSelected ? 'blue' : undefined}>
                                        <Text>{isSelected ? '◆  ' : '   '}</Text>
                                        <Text>
                                            <Text>
                                                {t('lineSelector.lineIndicator')}
                                                {' '}
                                                {index + 1}
                                            </Text>
                                            {' '}
                                            <Text dimColor={!isSelected}>
                                                (
                                                {suffix}
                                                )
                                            </Text>
                                        </Text>
                                    </Text>
                                </Box>
                            );
                        })}
                    </Box>
                ) : (
                    <List
                        marginTop={1}
                        items={lineItems}
                        onSelect={(line) => {
                            if (line === 'back') {
                                onBack();
                                return;
                            }

                            onSelect(line);
                        }}
                        onSelectionChange={(_, index) => {
                            setSelectedIndex(index);
                        }}
                        initialSelection={selectedIndex}
                        showBackButton={true}
                    />
                )}
            </Box>
        </>
    );
};

export { LineSelector, type LineSelectorProps };
