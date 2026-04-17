import {
    Box,
    Text,
    useInput
} from 'ink';
import * as os from 'os';
import React, { useState } from 'react';

import { t } from '../../i18n';
import type { PowerlineConfig } from '../../types/PowerlineConfig';
import type { Settings } from '../../types/Settings';
import { type PowerlineFontStatus } from '../../utils/powerline';
import { buildEnabledPowerlineSettings } from '../../utils/powerline-settings';

import { ConfirmDialog } from './ConfirmDialog';
import {
    List,
    type ListEntry
} from './List';
import { PowerlineSeparatorEditor } from './PowerlineSeparatorEditor';
import { PowerlineThemeSelector } from './PowerlineThemeSelector';

type PowerlineMenuValue = 'separator' | 'startCap' | 'endCap' | 'themes';
type Screen = 'menu' | PowerlineMenuValue;
const POWERLINE_MENU_LABEL_WIDTH = 11;

function formatPowerlineMenuLabel(label: string): string {
    return label.padEnd(POWERLINE_MENU_LABEL_WIDTH, ' ');
}

export function getSeparatorDisplay(powerlineConfig: PowerlineConfig): string {
    const seps = powerlineConfig.separators;

    if (seps.length > 1) {
        return t('powerline.multiple');
    }

    const sep = seps[0] ?? '\uE0B0';
    const presets = [
        { char: '\uE0B0', name: t('powerline.triangleRight') },
        { char: '\uE0B2', name: t('powerline.triangleLeft') },
        { char: '\uE0B4', name: t('powerline.roundRight') },
        { char: '\uE0B6', name: t('powerline.roundLeft') }
    ];
    const preset = presets.find(item => item.char === sep);

    if (preset) {
        return `${preset.char} - ${preset.name}`;
    }

    return `${sep} - ${t('common.custom')}`;
}

export function getCapDisplay(
    powerlineConfig: PowerlineConfig,
    type: 'start' | 'end'
): string {
    const caps = type === 'start'
        ? powerlineConfig.startCaps
        : powerlineConfig.endCaps;

    if (caps.length === 0) {
        return t('powerline.none');
    }

    if (caps.length > 1) {
        return t('powerline.multiple');
    }

    const cap = caps[0];

    if (!cap) {
        return t('powerline.none');
    }

    const presets = type === 'start' ? [
        { char: '\uE0B2', name: t('powerline.triangle') },
        { char: '\uE0B6', name: t('powerline.round') },
        { char: '\uE0BA', name: t('powerline.lowerTriangle') },
        { char: '\uE0BE', name: t('powerline.diagonal') }
    ] : [
        { char: '\uE0B0', name: t('powerline.triangle') },
        { char: '\uE0B4', name: t('powerline.round') },
        { char: '\uE0B8', name: t('powerline.lowerTriangle') },
        { char: '\uE0BC', name: t('powerline.diagonal') }
    ];
    const preset = presets.find(item => item.char === cap);

    if (preset) {
        return `${preset.char} - ${preset.name}`;
    }

    return `${cap} - ${t('common.custom')}`;
}

export function getThemeDisplay(powerlineConfig: PowerlineConfig): string {
    const theme = powerlineConfig.theme;

    if (!theme || theme === 'custom') {
        return t('common.custom');
    }

    return theme.charAt(0).toUpperCase() + theme.slice(1);
}

export function buildPowerlineSetupMenuItems(
    powerlineConfig: PowerlineConfig
): ListEntry<PowerlineMenuValue>[] {
    const disabled = !powerlineConfig.enabled;

    return [
        {
            label: formatPowerlineMenuLabel(t('powerline.separator')),
            sublabel: `(${getSeparatorDisplay(powerlineConfig)})`,
            value: 'separator',
            disabled,
            description: t('powerline.separatorDesc')
        },
        {
            label: formatPowerlineMenuLabel(t('powerline.startCap')),
            sublabel: `(${getCapDisplay(powerlineConfig, 'start')})`,
            value: 'startCap',
            disabled,
            description: t('powerline.startCapDesc')
        },
        {
            label: formatPowerlineMenuLabel(t('powerline.endCap')),
            sublabel: `(${getCapDisplay(powerlineConfig, 'end')})`,
            value: 'endCap',
            disabled,
            description: t('powerline.endCapDesc')
        },
        {
            label: formatPowerlineMenuLabel(t('powerline.themes')),
            sublabel: `(${getThemeDisplay(powerlineConfig)})`,
            value: 'themes',
            disabled,
            description: t('powerline.themesDesc')
        }
    ];
}

export interface PowerlineSetupProps {
    settings: Settings;
    powerlineFontStatus: PowerlineFontStatus;
    onUpdate: (settings: Settings) => void;
    onBack: () => void;
    onInstallFonts: () => void;
    installingFonts: boolean;
    fontInstallMessage: string | null;
    onClearMessage: () => void;
}

export const PowerlineSetup: React.FC<PowerlineSetupProps> = ({
    settings,
    powerlineFontStatus,
    onUpdate,
    onBack,
    onInstallFonts,
    installingFonts,
    fontInstallMessage,
    onClearMessage
}) => {
    const powerlineConfig = settings.powerline;
    const [screen, setScreen] = useState<Screen>('menu');
    const [selectedMenuItem, setSelectedMenuItem] = useState(0);
    const [confirmingEnable, setConfirmingEnable] = useState(false);
    const [confirmingFontInstall, setConfirmingFontInstall] = useState(false);

    const hasSeparatorItems = settings.lines.some(line => line.some(
        item => item.type === 'separator' || item.type === 'flex-separator'
    ));

    useInput((input, key) => {
        if (fontInstallMessage || installingFonts) {
            if (fontInstallMessage && !key.escape) {
                onClearMessage();
            }
            return;
        }

        if (confirmingFontInstall || confirmingEnable) {
            return;
        }

        if (screen === 'menu') {
            if (key.escape) {
                onBack();
            } else if (input === 't' || input === 'T') {
                if (!powerlineConfig.enabled) {
                    if (hasSeparatorItems) {
                        setConfirmingEnable(true);
                    } else {
                        onUpdate(buildEnabledPowerlineSettings(settings, false));
                    }
                } else {
                    onUpdate({
                        ...settings,
                        powerline: {
                            ...powerlineConfig,
                            enabled: false
                        }
                    });
                }
            } else if (input === 'i' || input === 'I') {
                setConfirmingFontInstall(true);
            } else if ((input === 'a' || input === 'A') && powerlineConfig.enabled) {
                onUpdate({
                    ...settings,
                    powerline: {
                        ...powerlineConfig,
                        autoAlign: !powerlineConfig.autoAlign
                    }
                });
            } else if ((input === 'c' || input === 'C') && powerlineConfig.enabled) {
                onUpdate({
                    ...settings,
                    powerline: {
                        ...powerlineConfig,
                        continueThemeAcrossLines: !powerlineConfig.continueThemeAcrossLines
                    }
                });
            }
        }
    });

    if (screen === 'separator') {
        return (
            <PowerlineSeparatorEditor
                settings={settings}
                mode='separator'
                onUpdate={onUpdate}
                onBack={() => { setScreen('menu'); }}
            />
        );
    }

    if (screen === 'startCap') {
        return (
            <PowerlineSeparatorEditor
                settings={settings}
                mode='startCap'
                onUpdate={onUpdate}
                onBack={() => { setScreen('menu'); }}
            />
        );
    }

    if (screen === 'endCap') {
        return (
            <PowerlineSeparatorEditor
                settings={settings}
                mode='endCap'
                onUpdate={onUpdate}
                onBack={() => { setScreen('menu'); }}
            />
        );
    }

    if (screen === 'themes') {
        return (
            <PowerlineThemeSelector
                settings={settings}
                onUpdate={onUpdate}
                onBack={() => { setScreen('menu'); }}
            />
        );
    }

    return (
        <Box flexDirection='column'>
            {!confirmingFontInstall && !installingFonts && !fontInstallMessage && (
                <Text bold>{t('powerline.title')}</Text>
            )}

            {confirmingFontInstall ? (
                <Box flexDirection='column'>
                    <Box marginBottom={1}>
                        <Text color='cyan' bold>{t('powerline.fontInstall')}</Text>
                    </Box>

                    <Box marginBottom={1} flexDirection='column'>
                        <Text bold>{t('powerline.whatWillHappen')}</Text>
                        <Text>
                            <Text dimColor>{t('powerline.cloneFrom')}</Text>
                            <Text color='blue'>https://github.com/powerline/fonts</Text>
                        </Text>
                        {os.platform() === 'darwin' && (
                            <>
                                <Text dimColor>• Run install.sh script which will:</Text>
                                <Text dimColor>  - Copy all .ttf/.otf files to ~/Library/Fonts</Text>
                                <Text dimColor>  - Register fonts with macOS</Text>
                            </>
                        )}
                        {os.platform() === 'linux' && (
                            <>
                                <Text dimColor>• Run install.sh script which will:</Text>
                                <Text dimColor>  - Copy all .ttf/.otf files to ~/.local/share/fonts</Text>
                                <Text dimColor>  - Run fc-cache to update font cache</Text>
                            </>
                        )}
                        {os.platform() === 'win32' && (
                            <>
                                <Text dimColor>• Copy Powerline .ttf/.otf files to:</Text>
                                <Text dimColor>  AppData\Local\Microsoft\Windows\Fonts</Text>
                            </>
                        )}
                        <Text dimColor>• Clean up temporary files</Text>
                    </Box>

                    <Box marginBottom={1}>
                        <Text color='yellow' bold>{t('powerline.requirements')}</Text>
                        <Text dimColor>{t('powerline.requirementsDetail')}</Text>
                    </Box>

                    <Box marginBottom={1} flexDirection='column'>
                        <Text color='green' bold>{t('powerline.afterInstall')}</Text>
                        <Text dimColor>{t('powerline.restartTerminal')}</Text>
                        <Text dimColor>{t('powerline.selectFont')}</Text>
                        <Text dimColor>
                            {'  '}
                            {t('powerline.selectFontExample')}
                        </Text>
                    </Box>

                    <Box marginTop={1}>
                        <Text>{t('powerline.proceed')}</Text>
                    </Box>
                    <Box marginTop={1}>
                        <ConfirmDialog
                            inline={true}
                            onConfirm={() => {
                                setConfirmingFontInstall(false);
                                onInstallFonts();
                            }}
                            onCancel={() => {
                                setConfirmingFontInstall(false);
                            }}
                        />
                    </Box>
                </Box>
            ) : confirmingEnable ? (
                <Box flexDirection='column' marginTop={1}>
                    {hasSeparatorItems && (
                        <>
                            <Box>
                                <Text color='yellow'>{t('powerline.enableWarning')}</Text>
                            </Box>
                            <Box marginBottom={1}>
                                <Text dimColor>{t('powerline.enableWarningDetail')}</Text>
                            </Box>
                        </>
                    )}
                    <Box marginTop={hasSeparatorItems ? 1 : 0}>
                        <Text>{t('powerline.enableConfirm')}</Text>
                    </Box>
                    <Box marginTop={1}>
                        <ConfirmDialog
                            inline={true}
                            onConfirm={() => {
                                onUpdate(buildEnabledPowerlineSettings(settings, true));
                                setConfirmingEnable(false);
                            }}
                            onCancel={() => {
                                setConfirmingEnable(false);
                            }}
                        />
                    </Box>
                </Box>
            ) : installingFonts ? (
                <Box>
                    <Text color='yellow'>{t('powerline.installing')}</Text>
                </Box>
            ) : fontInstallMessage ? (
                <Box flexDirection='column'>
                    <Text color={fontInstallMessage.includes('success') ? 'green' : 'red'}>
                        {fontInstallMessage}
                    </Text>
                    <Box marginTop={1}>
                        <Text dimColor>{t('common.pressAnyKeyBack')}</Text>
                    </Box>
                </Box>
            ) : (
                <>
                    <Box flexDirection='column'>
                        <Text>
                            {'    '}
                            {t('powerline.fontStatus')}
                            {powerlineFontStatus.installed ? (
                                <>
                                    <Text color='green'>{t('powerline.fontInstalled')}</Text>
                                    <Text dimColor>{t('powerline.fontInstalledHint')}</Text>
                                </>
                            ) : (
                                <>
                                    <Text color='yellow'>{t('powerline.fontNotInstalled')}</Text>
                                    <Text dimColor>{t('powerline.fontNotInstalledHint')}</Text>
                                </>
                            )}
                        </Text>
                    </Box>

                    <Box>
                        <Text>{t('powerline.powerlineMode')}</Text>
                        <Text color={powerlineConfig.enabled ? 'green' : 'red'}>
                            {powerlineConfig.enabled ? `${t('common.enabled')}  ` : `${t('common.disabled')} `}
                        </Text>
                        <Text dimColor>{t('powerline.toggleHint')}</Text>
                    </Box>

                    {powerlineConfig.enabled && (
                        <>
                            <Box>
                                <Text>
                                    {'  '}
                                    {t('powerline.alignWidgets')}
                                </Text>
                                <Text color={powerlineConfig.autoAlign ? 'green' : 'red'}>
                                    {powerlineConfig.autoAlign ? `${t('common.enabled')}  ` : `${t('common.disabled')} `}
                                </Text>
                                <Text dimColor>{t('powerline.alignToggleHint')}</Text>
                            </Box>

                            <Box>
                                <Text>{t('powerline.continueTheme')}</Text>
                                <Text color={powerlineConfig.continueThemeAcrossLines ? 'green' : 'red'}>
                                    {powerlineConfig.continueThemeAcrossLines ? `${t('common.enabled')}  ` : `${t('common.disabled')} `}
                                </Text>
                                <Text dimColor>{t('powerline.continueToggleHint')}</Text>
                            </Box>

                            <Box flexDirection='column' marginTop={1}>
                                <Text dimColor>
                                    When enabled, global overrides are disabled and powerline separators are used
                                </Text>
                                <Text dimColor>
                                    Continue Theme keeps the Powerline color sequence running across lines
                                </Text>
                            </Box>
                        </>
                    )}

                    {!powerlineConfig.enabled && (
                        <Box marginTop={1}>
                            <Text dimColor>Enable Powerline mode to configure separators, caps, and themes.</Text>
                        </Box>
                    )}

                    <List
                        marginTop={1}
                        items={buildPowerlineSetupMenuItems(powerlineConfig)}
                        onSelect={(value) => {
                            if (value === 'back') {
                                onBack();
                                return;
                            }

                            setScreen(value);
                        }}
                        onSelectionChange={(_, index) => {
                            setSelectedMenuItem(index);
                        }}
                        initialSelection={selectedMenuItem}
                        showBackButton={true}
                    />
                </>
            )}
        </Box>
    );
};