import chalk from 'chalk';
import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import { t } from '../../i18n';
import type { Settings } from '../../types/Settings';
import {
    hasCustomWidgetColors,
    sanitizeLinesForColorLevel
} from '../../utils/color-sanitize';

import { ConfirmDialog } from './ConfirmDialog';
import {
    List,
    type ListEntry
} from './List';

type TerminalOptionsValue = 'width' | 'colorLevel';

export function getNextColorLevel(level: 0 | 1 | 2 | 3): 0 | 1 | 2 | 3 {
    return ((level + 1) % 4) as 0 | 1 | 2 | 3;
}

export function shouldWarnOnColorLevelChange(
    currentLevel: 0 | 1 | 2 | 3,
    nextLevel: 0 | 1 | 2 | 3,
    hasCustomColors: boolean
): boolean {
    return hasCustomColors
        && ((currentLevel === 2 && nextLevel !== 2)
            || (currentLevel === 3 && nextLevel !== 3));
}

export function buildTerminalOptionsItems(
    colorLevel: 0 | 1 | 2 | 3
): ListEntry<TerminalOptionsValue>[] {
    return [
        {
            label: t('terminal.terminalWidth'),
            value: 'width',
            description: t('terminal.terminalWidthDesc')
        },
        {
            label: t('terminal.colorLevel'),
            sublabel: `(${getColorLevelLabel(colorLevel)})`,
            value: 'colorLevel',
            description: t('terminal.colorLevelDesc')
        }
    ];
}

export interface TerminalOptionsMenuProps {
    settings: Settings;
    onUpdate: (settings: Settings) => void;
    onBack: (target?: string) => void;
}

export const TerminalOptionsMenu: React.FC<TerminalOptionsMenuProps> = ({
    settings,
    onUpdate,
    onBack
}) => {
    const [showColorWarning, setShowColorWarning] = useState(false);
    const [pendingColorLevel, setPendingColorLevel] = useState<0 | 1 | 2 | 3 | null>(null);

    const handleSelect = (value: TerminalOptionsValue | 'back') => {
        if (value === 'back') {
            onBack();
            return;
        }

        if (value === 'width') {
            onBack('width');
            return;
        }

        const hasCustomColors = hasCustomWidgetColors(settings.lines);
        const currentLevel = settings.colorLevel;
        const nextLevel = getNextColorLevel(currentLevel);

        if (shouldWarnOnColorLevelChange(currentLevel, nextLevel, hasCustomColors)) {
            setShowColorWarning(true);
            setPendingColorLevel(nextLevel);
            return;
        }

        chalk.level = nextLevel;

        const cleanedLines = sanitizeLinesForColorLevel(settings.lines, nextLevel);

        onUpdate({
            ...settings,
            lines: cleanedLines,
            colorLevel: nextLevel
        });
    };

    const handleColorConfirm = () => {
        if (pendingColorLevel !== null) {
            chalk.level = pendingColorLevel;

            const cleanedLines = sanitizeLinesForColorLevel(settings.lines, pendingColorLevel);

            onUpdate({
                ...settings,
                lines: cleanedLines,
                colorLevel: pendingColorLevel
            });
        }
        setShowColorWarning(false);
        setPendingColorLevel(null);
    };

    const handleColorCancel = () => {
        setShowColorWarning(false);
        setPendingColorLevel(null);
    };

    useInput((_, key) => {
        if (key.escape && !showColorWarning) {
            onBack();
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>{t('terminal.title')}</Text>
            {showColorWarning ? (
                <Box flexDirection='column' marginTop={1}>
                    <Text color='yellow'>{t('terminal.colorWarningTitle')}</Text>
                    <Text>{t('terminal.colorWarningMsg')}</Text>
                    <Box marginTop={1}>
                        <ConfirmDialog
                            message={t('common.continue')}
                            onConfirm={handleColorConfirm}
                            onCancel={handleColorCancel}
                            inline
                        />
                    </Box>
                </Box>
            ) : (
                <>
                    <Text color='white'>{t('terminal.subtitle')}</Text>
                    <List
                        marginTop={1}
                        items={buildTerminalOptionsItems(settings.colorLevel)}
                        onSelect={handleSelect}
                        showBackButton={true}
                    />
                </>
            )}
        </Box>
    );
};

export const getColorLevelLabel = (level?: 0 | 1 | 2 | 3): string => {
    switch (level) {
        case 0: return t('terminal.noColor');
        case 1: return t('terminal.basicColor');
        case 2:
        case undefined: return t('terminal.color256');
        case 3: return t('terminal.truecolor');
        default: return t('terminal.color256');
    }
};
