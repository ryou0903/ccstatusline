import {
    Box,
    Text
} from 'ink';
import React from 'react';

import { t } from '../../i18n';

import { List } from './List';

export interface LanguageSelectorProps {
    currentLanguage: 'en' | 'ja';
    onSelect: (lang: 'en' | 'ja') => void;
    onBack: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    currentLanguage,
    onSelect,
    onBack
}) => {
    const items = [
        {
            label: 'English',
            sublabel: currentLanguage === 'en' ? t('language.current') : undefined,
            value: 'en' as const
        },
        {
            label: '日本語',
            sublabel: currentLanguage === 'ja' ? t('language.current') : undefined,
            value: 'ja' as const
        }
    ];

    const handleSelect = (value: 'en' | 'ja' | 'back') => {
        if (value === 'back') {
            onBack();
            return;
        }

        onSelect(value);
    };

    return (
        <Box flexDirection='column'>
            <Text bold>{t('language.title')}</Text>
            <List
                marginTop={1}
                items={items}
                onSelect={handleSelect}
                showBackButton={true}
            />
        </Box>
    );
};