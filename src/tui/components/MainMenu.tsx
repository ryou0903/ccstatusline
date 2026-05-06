import {
    Box,
    Text
} from 'ink';
import React from 'react';

import { t } from '../../i18n';
import type { Settings } from '../../types/Settings';
import { type PowerlineFontStatus } from '../../utils/powerline';

import { List } from './List';

export type MainMenuOption = 'lines'
    | 'colors'
    | 'powerline'
    | 'terminalConfig'
    | 'globalOverrides'
    | 'install'
    | 'configureStatusLine'
    | 'language'
    | 'starGithub'
    | 'save'
    | 'exit';

export interface MainMenuProps {
    onSelect: (value: MainMenuOption, index: number) => void;
    isClaudeInstalled: boolean;
    hasChanges: boolean;
    initialSelection?: number;
    powerlineFontStatus: PowerlineFontStatus;
    settings: Settings | null;
    previewIsTruncated?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
    onSelect,
    isClaudeInstalled,
    hasChanges,
    initialSelection = 0,
    powerlineFontStatus,
    settings,
    previewIsTruncated
}) => {
    // Build menu structure with visual gaps
    const menuItems: ({
        label: string;
        value: MainMenuOption;
        description: string;
    } | '-')[] = [
        {
            label: t('menu.editLines'),
            value: 'lines',
            description: t('menu.editLinesDesc')
        },
        {
            label: t('menu.editColors'),
            value: 'colors',
            description: t('menu.editColorsDesc')
        },
        {
            label: t('menu.powerline'),
            value: 'powerline',
            description: t('menu.powerlineDesc')
        },
        '-' as const,
        {
            label: t('menu.terminalOptions'),
            value: 'terminalConfig',
            description: t('menu.terminalOptionsDesc')
        },
        {
            label: t('menu.globalOverrides'),
            value: 'globalOverrides',
            description: t('menu.globalOverridesDesc')
        },
        '-' as const,
        ...(isClaudeInstalled
            ? [
                {
                    label: t('menu.configureStatusLine'),
                    value: 'configureStatusLine' as MainMenuOption,
                    description: t('menu.configureStatusLineDesc')
                },
                {
                    label: t('menu.uninstall'),
                    value: 'install' as MainMenuOption,
                    description: t('menu.uninstallDesc')
                }
            ]
            : [
                {
                    label: t('menu.install'),
                    value: 'install' as MainMenuOption,
                    description: t('menu.installDesc')
                }
            ]
        ),
        {
            label: t('menu.language'),
            value: 'language' as MainMenuOption,
            description: t('menu.languageDesc')
        }
    ];

    if (hasChanges) {
        menuItems.push(
            {
                label: t('menu.saveExit'),
                value: 'save',
                description: t('menu.saveExitDesc')
            },
            {
                label: t('menu.exitNoSave'),
                value: 'exit',
                description: t('menu.exitNoSaveDesc')
            },
            '-' as const,
            {
                label: t('menu.starGithub'),
                value: 'starGithub',
                description: t('menu.starGithubDesc')
            }
        );
    } else {
        menuItems.push(
            {
                label: t('menu.exit'),
                value: 'exit',
                description: t('menu.exitDesc')
            },
            '-' as const,
            {
                label: t('menu.starGithub'),
                value: 'starGithub',
                description: t('menu.starGithubDesc')
            }
        );
    }

    // Check if we should show the truncation warning
    const showTruncationWarning
        = previewIsTruncated && settings?.flexMode === 'full-minus-40';

    return (
        <Box flexDirection='column'>
            {showTruncationWarning && (
                <Box marginBottom={1}>
                    <Text color='yellow'>
                        {t('menu.truncationWarning')}
                    </Text>
                </Box>
            )}

            <Text bold>{t('menu.title')}</Text>

            <List
                items={menuItems}
                marginTop={1}
                onSelect={(value, index) => {
                    if (value === 'back') {
                        return;
                    }

                    onSelect(value, index);
                }}
                initialSelection={initialSelection}
            />
        </Box>
    );
};
