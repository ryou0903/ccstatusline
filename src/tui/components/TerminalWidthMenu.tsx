import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import { t } from '../../i18n';
import type { FlexMode } from '../../types/FlexMode';
import type { Settings } from '../../types/Settings';
import { shouldInsertInput } from '../../utils/input-guards';

import {
    List,
    type ListEntry
} from './List';

export const TERMINAL_WIDTH_OPTIONS: FlexMode[] = ['full', 'full-minus-40', 'full-until-compact'];

export function getTerminalWidthSelectionIndex(selectedOption: FlexMode): number {
    const selectedIndex = TERMINAL_WIDTH_OPTIONS.indexOf(selectedOption);

    return selectedIndex >= 0 ? selectedIndex : 0;
}

export function validateCompactThresholdInput(value: string): string | null {
    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue)) {
        return t('terminalWidth.invalidNumber');
    }

    if (parsedValue < 1 || parsedValue > 99) {
        return t('terminalWidth.invalidRange', { n: String(parsedValue) });
    }

    return null;
}

export function buildTerminalWidthItems(
    selectedOption: FlexMode,
    compactThreshold: number
): ListEntry<FlexMode>[] {
    const n = String(compactThreshold);

    return [
        {
            value: 'full',
            label: t('terminalWidth.fullWidth'),
            sublabel: selectedOption === 'full' ? t('common.active') : undefined,
            description: t('terminalWidth.fullWidthDesc')
        },
        {
            value: 'full-minus-40',
            label: t('terminalWidth.fullMinus40'),
            sublabel: selectedOption === 'full-minus-40' ? t('common.active') : t('common.default'),
            description: t('terminalWidth.fullMinus40Desc')
        },
        {
            value: 'full-until-compact',
            label: t('terminalWidth.fullUntilCompact'),
            sublabel: selectedOption === 'full-until-compact'
                ? t('terminalWidth.thresholdActive', { n })
                : t('terminalWidth.thresholdInactive', { n }),
            description: t('terminalWidth.fullUntilCompactDesc', { threshold: n })
        }
    ];
}

export interface TerminalWidthMenuProps {
    settings: Settings;
    onUpdate: (settings: Settings) => void;
    onBack: () => void;
}

export const TerminalWidthMenu: React.FC<TerminalWidthMenuProps> = ({
    settings,
    onUpdate,
    onBack
}) => {
    const [selectedOption, setSelectedOption] = useState<FlexMode>(settings.flexMode);
    const [compactThreshold, setCompactThreshold] = useState(settings.compactThreshold);
    const [editingThreshold, setEditingThreshold] = useState(false);
    const [thresholdInput, setThresholdInput] = useState(String(settings.compactThreshold));
    const [validationError, setValidationError] = useState<string | null>(null);

    useInput((input, key) => {
        if (editingThreshold) {
            if (key.return) {
                const error = validateCompactThresholdInput(thresholdInput);

                if (error) {
                    setValidationError(error);
                } else {
                    const value = parseInt(thresholdInput, 10);
                    setCompactThreshold(value);

                    const updatedSettings = {
                        ...settings,
                        flexMode: selectedOption,
                        compactThreshold: value
                    };
                    onUpdate(updatedSettings);
                    setEditingThreshold(false);
                    setValidationError(null);
                }
            } else if (key.escape) {
                setThresholdInput(String(compactThreshold));
                setEditingThreshold(false);
                setValidationError(null);
            } else if (key.backspace) {
                setThresholdInput(thresholdInput.slice(0, -1));
                setValidationError(null);
            } else if (key.delete) {
                // For simple number inputs, forward delete does nothing since there's no cursor position
            } else if (shouldInsertInput(input, key) && /\d/.test(input)) {
                const newValue = thresholdInput + input;
                if (newValue.length <= 2) {
                    setThresholdInput(newValue);
                    setValidationError(null);
                }
            }
            return;
        }

        if (key.escape) {
            onBack();
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>{t('terminalWidth.title')}</Text>
            <Text color='white'>{t('terminalWidth.subtitle')}</Text>
            <Text dimColor wrap='wrap'>{t('terminalWidth.subtitleNote')}</Text>

            {editingThreshold ? (
                <Box marginTop={1} flexDirection='column'>
                    <Text>
                        {t('terminalWidth.thresholdPrompt')}
                        {' '}
                        {thresholdInput}
                        %
                    </Text>
                    {validationError ? (
                        <Text color='red'>{validationError}</Text>
                    ) : (
                        <Text dimColor>{t('common.pressEnterConfirm')}</Text>
                    )}
                </Box>
            ) : (
                <List
                    marginTop={1}
                    items={buildTerminalWidthItems(selectedOption, compactThreshold)}
                    initialSelection={getTerminalWidthSelectionIndex(selectedOption)}
                    onSelect={(value) => {
                        if (value === 'back') {
                            onBack();
                            return;
                        }

                        setSelectedOption(value);

                        const updatedSettings = {
                            ...settings,
                            flexMode: value,
                            compactThreshold
                        };
                        onUpdate(updatedSettings);

                        if (value === 'full-until-compact') {
                            setEditingThreshold(true);
                        }
                    }}
                    showBackButton={true}
                />
            )}
        </Box>
    );
};
