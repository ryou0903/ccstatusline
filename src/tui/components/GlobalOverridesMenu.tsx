import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import { t } from '../../i18n';
import type { Settings } from '../../types/Settings';
import {
    COLOR_MAP,
    getChalkColor,
    getColorDisplayName
} from '../../utils/colors';
import { shouldInsertInput } from '../../utils/input-guards';

import { ConfirmDialog } from './ConfirmDialog';

export interface GlobalOverridesMenuProps {
    settings: Settings;
    onUpdate: (settings: Settings) => void;
    onBack: () => void;
}

export const GlobalOverridesMenu: React.FC<GlobalOverridesMenuProps> = ({ settings, onUpdate, onBack }) => {
    const [editingPadding, setEditingPadding] = useState(false);
    const [editingSeparator, setEditingSeparator] = useState(false);
    const [confirmingSeparator, setConfirmingSeparator] = useState(false);
    const [paddingInput, setPaddingInput] = useState(settings.defaultPadding ?? '');
    const [separatorInput, setSeparatorInput] = useState(settings.defaultSeparator ?? '');
    const [inheritColors, setInheritColors] = useState(settings.inheritSeparatorColors);
    const [globalBold, setGlobalBold] = useState(settings.globalBold);
    const [minimalistMode, setMinimalistMode] = useState(settings.minimalistMode);
    const isPowerlineEnabled = settings.powerline.enabled;

    // Check if there are any manual separators in the current configuration
    const hasManualSeparators = settings.lines.some(line => line.some(item => item.type === 'separator')
    );

    // Get colors from COLOR_MAP
    const bgColors = ['none', ...COLOR_MAP.filter(c => c.isBackground).map(c => c.name)];
    const fgColors = ['none', ...COLOR_MAP.filter(c => !c.isBackground).map(c => c.name)];

    const currentBgIndex = bgColors.indexOf(settings.overrideBackgroundColor ?? 'none');
    const currentFgIndex = fgColors.indexOf(settings.overrideForegroundColor ?? 'none');

    useInput((input, key) => {
        if (editingPadding) {
            if (key.return) {
                const updatedSettings = {
                    ...settings,
                    defaultPadding: paddingInput
                };
                onUpdate(updatedSettings);
                setEditingPadding(false);
            } else if (key.escape) {
                setPaddingInput(settings.defaultPadding ?? '');
                setEditingPadding(false);
            } else if (key.backspace) {
                setPaddingInput(paddingInput.slice(0, -1));
            } else if (key.delete) {
                // For simple text inputs without cursor, forward delete does nothing
            } else if (shouldInsertInput(input, key)) {
                setPaddingInput(paddingInput + input);
            }
        } else if (editingSeparator) {
            if (key.return) {
                // Only show confirmation if setting a non-empty separator AND there are manual separators
                if (separatorInput && hasManualSeparators) {
                    setEditingSeparator(false);
                    setConfirmingSeparator(true);
                } else {
                    // Apply directly without confirmation
                    const updatedSettings = {
                        ...settings,
                        defaultSeparator: separatorInput || undefined,
                        // Only remove manual separators if we're setting a non-empty default
                        lines: separatorInput
                            ? settings.lines.map(line => line.filter(item => item.type !== 'separator'))
                            : settings.lines
                    };
                    onUpdate(updatedSettings);
                    setEditingSeparator(false);
                }
            } else if (key.escape) {
                setSeparatorInput(settings.defaultSeparator ?? '');
                setEditingSeparator(false);
            } else if (key.backspace) {
                setSeparatorInput(separatorInput.slice(0, -1));
            } else if (key.delete) {
                // For simple text inputs without cursor, forward delete does nothing
            } else if (shouldInsertInput(input, key)) {
                setSeparatorInput(separatorInput + input);
            }
        } else if (confirmingSeparator) {
            // Skip input handling when confirmation is active - let ConfirmDialog handle it
            return;
        } else {
            if (key.escape) {
                onBack();
            } else if (input === 'p' || input === 'P') {
                setEditingPadding(true);
            } else if ((input === 's' || input === 'S') && !isPowerlineEnabled && !key.ctrl) {
                setEditingSeparator(true);
            } else if ((input === 'i' || input === 'I') && !isPowerlineEnabled) {
                const newInheritColors = !inheritColors;
                setInheritColors(newInheritColors);
                const updatedSettings = {
                    ...settings,
                    inheritSeparatorColors: newInheritColors
                };
                onUpdate(updatedSettings);
            } else if ((input === 'b' || input === 'B') && !isPowerlineEnabled) {
                // Cycle through background colors
                const nextIndex = (currentBgIndex + 1) % bgColors.length;
                const nextBgColor = bgColors[nextIndex];
                const updatedSettings = {
                    ...settings,
                    overrideBackgroundColor: nextBgColor === 'none' ? undefined : nextBgColor
                };
                onUpdate(updatedSettings);
            } else if ((input === 'c' || input === 'C') && !isPowerlineEnabled) {
                // Clear override background color
                const updatedSettings = {
                    ...settings,
                    overrideBackgroundColor: undefined
                };
                onUpdate(updatedSettings);
            } else if (input === 'o' || input === 'O') {
                // Toggle global bold
                const newGlobalBold = !globalBold;
                setGlobalBold(newGlobalBold);
                const updatedSettings = {
                    ...settings,
                    globalBold: newGlobalBold
                };
                onUpdate(updatedSettings);
            } else if (input === 'm' || input === 'M') {
                // Toggle minimalist mode
                const newMinimalistMode = !minimalistMode;
                setMinimalistMode(newMinimalistMode);
                const updatedSettings = {
                    ...settings,
                    minimalistMode: newMinimalistMode
                };
                onUpdate(updatedSettings);
            } else if (input === 'f' || input === 'F') {
                // Cycle through foreground colors
                const nextIndex = (currentFgIndex + 1) % fgColors.length;
                const nextFgColor = fgColors[nextIndex];
                const updatedSettings = {
                    ...settings,
                    overrideForegroundColor: nextFgColor === 'none' ? undefined : nextFgColor
                };
                onUpdate(updatedSettings);
            } else if (input === 'g' || input === 'G') {
                // Clear override foreground color
                const updatedSettings = {
                    ...settings,
                    overrideForegroundColor: undefined
                };
                onUpdate(updatedSettings);
            }
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>{t('globalOverrides.title')}</Text>
            <Text dimColor>{t('globalOverrides.subtitle')}</Text>
            {isPowerlineEnabled && (
                <Box marginTop={1}>
                    <Text color='yellow'>{t('globalOverrides.powerlineWarning')}</Text>
                </Box>
            )}
            <Box marginTop={1} />

            {editingPadding ? (
                <Box flexDirection='column'>
                    <Box>
                        <Text>{t('globalOverrides.paddingPrompt')}</Text>
                        <Text color='cyan'>{paddingInput ? `"${paddingInput}"` : t('globalOverrides.paddingEmpty')}</Text>
                    </Box>
                    <Text dimColor>{t('common.pressEnterSave')}</Text>
                </Box>
            ) : editingSeparator ? (
                <Box flexDirection='column'>
                    <Box>
                        <Text>{t('globalOverrides.separatorPrompt')}</Text>
                        <Text color='cyan'>{separatorInput ? `"${separatorInput}"` : t('globalOverrides.separatorEmpty')}</Text>
                    </Box>
                    <Text dimColor>{t('common.pressEnterSave')}</Text>
                </Box>
            ) : confirmingSeparator ? (
                <Box flexDirection='column'>
                    <Box marginBottom={1}>
                        <Text color='yellow'>{t('globalOverrides.separatorWarning')}</Text>
                    </Box>
                    <Box>
                        <Text>{t('globalOverrides.newSeparator')}</Text>
                        <Text color='cyan'>{separatorInput ? `"${separatorInput}"` : t('common.none')}</Text>
                    </Box>
                    <Box marginTop={1}>
                        <Text>{t('globalOverrides.separatorConfirm')}</Text>
                    </Box>
                    <Box marginTop={1}>
                        <ConfirmDialog
                            inline={true}
                            onConfirm={() => {
                                // Remove all manual separators from lines
                                const updatedSettings = {
                                    ...settings,
                                    defaultSeparator: separatorInput,
                                    lines: settings.lines.map(line => line.filter(item => item.type !== 'separator')
                                    )
                                };
                                onUpdate(updatedSettings);
                                setConfirmingSeparator(false);
                            }}
                            onCancel={() => {
                                // Cancel without applying changes
                                setSeparatorInput(settings.defaultSeparator ?? '');
                                setConfirmingSeparator(false);
                            }}
                        />
                    </Box>
                </Box>
            ) : (
                <>
                    <Box>
                        <Text>
                            {' '}
                            {t('globalOverrides.globalBold')}
                        </Text>
                        <Text color={globalBold ? 'green' : 'red'}>{globalBold ? t('common.enabled') : t('common.disabled')}</Text>
                        <Text dimColor>{t('globalOverrides.toggleBoldHint')}</Text>
                    </Box>

                    <Box>
                        <Text>
                            {' '}
                            {t('globalOverrides.minimalistMode')}
                        </Text>
                        <Text color={minimalistMode ? 'green' : 'red'}>{minimalistMode ? t('common.enabled') : t('common.disabled')}</Text>
                        <Text dimColor>{t('globalOverrides.toggleMinimalistHint')}</Text>
                    </Box>

                    <Box>
                        <Text>
                            {' '}
                            {t('globalOverrides.defaultPadding')}
                        </Text>
                        <Text color='cyan'>{settings.defaultPadding ? `"${settings.defaultPadding}"` : t('common.none')}</Text>
                        <Text dimColor>{t('globalOverrides.editPaddingHint')}</Text>
                    </Box>

                    <Box>
                        <Text>{t('globalOverrides.overrideFg')}</Text>
                        {(() => {
                            const fgColor = settings.overrideForegroundColor ?? 'none';
                            if (fgColor === 'none') {
                                return <Text color='gray'>{t('common.none')}</Text>;
                            } else {
                                const displayName = getColorDisplayName(fgColor);
                                const fgChalk = getChalkColor(fgColor, 'ansi16', false);
                                const display = fgChalk ? fgChalk(displayName) : displayName;
                                return <Text>{display}</Text>;
                            }
                        })()}
                        <Text dimColor>{t('globalOverrides.cycleFgHint')}</Text>
                    </Box>

                    <Box>
                        <Text>{t('globalOverrides.overrideBg')}</Text>
                        {isPowerlineEnabled ? (
                            <Text dimColor>{t('globalOverrides.disabledPowerline')}</Text>
                        ) : (
                            <>
                                {(() => {
                                    const bgColor = settings.overrideBackgroundColor ?? 'none';
                                    if (bgColor === 'none') {
                                        return <Text color='gray'>{t('common.none')}</Text>;
                                    } else {
                                        const displayName = getColorDisplayName(bgColor);
                                        const bgChalk = getChalkColor(bgColor, 'ansi16', true);
                                        const display = bgChalk ? bgChalk(` ${displayName} `) : displayName;
                                        return <Text>{display}</Text>;
                                    }
                                })()}
                                <Text dimColor>{t('globalOverrides.cycleBgHint')}</Text>
                            </>
                        )}
                    </Box>

                    <Box>
                        <Text>
                            {' '}
                            {t('globalOverrides.inheritColors')}
                        </Text>
                        {isPowerlineEnabled ? (
                            <Text dimColor>{t('globalOverrides.disabledPowerline')}</Text>
                        ) : (
                            <>
                                <Text color={inheritColors ? 'green' : 'red'}>{inheritColors ? t('common.enabled') : t('common.disabled')}</Text>
                                <Text dimColor>{t('globalOverrides.toggleInheritHint')}</Text>
                            </>
                        )}
                    </Box>

                    <Box>
                        <Text>{t('globalOverrides.defaultSeparator')}</Text>
                        {isPowerlineEnabled ? (
                            <Text dimColor>{t('globalOverrides.disabledPowerline')}</Text>
                        ) : (
                            <>
                                <Text color='cyan'>{settings.defaultSeparator ? `"${settings.defaultSeparator}"` : t('common.none')}</Text>
                                <Text dimColor>{t('globalOverrides.editSeparatorHint')}</Text>
                            </>
                        )}
                    </Box>

                    <Box marginTop={2}>
                        <Text dimColor>{t('globalOverrides.escBack')}</Text>
                    </Box>

                    <Box marginTop={1} flexDirection='column'>
                        <Text dimColor wrap='wrap'>
                            {t('globalOverrides.inheritHelp')}
                        </Text>
                        <Text dimColor wrap='wrap'>
                            {t('globalOverrides.boldHelp')}
                        </Text>
                        <Text dimColor wrap='wrap'>
                            {t('globalOverrides.minimalistHelp')}
                        </Text>
                        <Text dimColor wrap='wrap'>
                            {t('globalOverrides.fgHelp')}
                        </Text>
                    </Box>
                </>
            )}
        </Box>
    );
};