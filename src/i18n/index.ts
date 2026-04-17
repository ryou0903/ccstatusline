import {
    en,
    type Translations
} from './translations/en';
import { ja } from './translations/ja';

export type Language = 'en' | 'ja';

const translations: Record<Language, Translations> = { en, ja };

let currentLanguage: Language = 'en';

export function initLanguage(lang: Language): void {
    currentLanguage = lang;
}

export function getLanguage(): Language {
    return currentLanguage;
}

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
        if (typeof current !== 'object' || current === null)
            return undefined;
        current = (current as Record<string, unknown>)[part];
    }
    return typeof current === 'string' ? current : undefined;
}

export function t(key: string, vars?: Record<string, string>): string {
    const dict = translations[currentLanguage] as unknown as Record<string, unknown>;
    let result = getNestedValue(dict, key);

    if (result === undefined && currentLanguage !== 'en') {
        result = getNestedValue(translations.en as unknown as Record<string, unknown>, key);
    }

    if (result === undefined) {
        return key;
    }

    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
    }

    return result;
}

function widgetTypeToKey(type: string): string {
    return type.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function tWidgetDisplayName(type: string): string {
    const key = widgetTypeToKey(type);
    return t(`widget.${key}.displayName`);
}

export function tWidgetDescription(type: string): string {
    const key = widgetTypeToKey(type);
    return t(`widget.${key}.description`);
}

export function tWidgetCategory(category: string): string {
    const key = category.toLowerCase().replace(/\s+(\w)/g, (_, c: string) => c.toUpperCase());
    return t(`widgetCategory.${key}`);
}