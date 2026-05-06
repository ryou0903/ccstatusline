import {
    Box,
    Text,
    useInput
} from 'ink';
import React from 'react';

import { t } from '../../i18n';
import { getClaudeSettingsPath } from '../../utils/claude-settings';

import { List } from './List';

export interface InstallMenuProps {
    bunxAvailable: boolean;
    existingStatusLine: string | null;
    onSelectNpx: () => void;
    onSelectBunx: () => void;
    onCancel: () => void;
    initialSelection?: number;
}

export const InstallMenu: React.FC<InstallMenuProps> = ({
    bunxAvailable,
    existingStatusLine,
    onSelectNpx,
    onSelectBunx,
    onCancel,
    initialSelection = 0
}) => {
    useInput((_, key) => {
        if (key.escape) {
            onCancel();
        }
    });

    function onSelect(value: string) {
        switch (value) {
            case 'npx':
                onSelectNpx();
                break;
            case 'bunx':
                if (bunxAvailable) {
                    onSelectBunx();
                }
                break;
            case 'back':
                onCancel();
                break;
        }
    }

    const listItems = [
        {
            label: t('install.npx'),
            value: 'npx'
        },
        {
            label: t('install.bunx'),
            sublabel: bunxAvailable ? undefined : t('install.notInstalled'),
            value: 'bunx',
            disabled: !bunxAvailable
        }
    ];

    return (
        <Box flexDirection='column'>
            <Text bold>{t('install.title')}</Text>

            {existingStatusLine && (
                <Box marginBottom={1}>
                    <Text color='yellow'>
                        {t('install.currentStatusLine', { line: existingStatusLine })}
                    </Text>
                </Box>
            )}

            <Box>
                <Text dimColor>{t('install.selectPackageManager')}</Text>
            </Box>

            <List
                color='blue'
                marginTop={1}
                items={listItems}
                onSelect={(line) => {
                    if (line === 'back') {
                        onCancel();
                        return;
                    }

                    onSelect(line);
                }}
                initialSelection={initialSelection}
                showBackButton={true}
            />

            <Box marginTop={2}>
                <Text dimColor>
                    {t('install.writeTo', { path: getClaudeSettingsPath() })}
                </Text>
            </Box>

            <Box marginTop={1}>
                <Text dimColor>{t('common.pressEnterSelect')}</Text>
            </Box>
        </Box>
    );
};
