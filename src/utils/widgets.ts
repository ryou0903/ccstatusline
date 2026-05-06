import {
    tWidgetCategory,
    tWidgetDescription,
    tWidgetDisplayName
} from '../i18n';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetItem,
    WidgetItemType
} from '../types/Widget';

import {
    filterFuzzySearchRecords,
    type FuzzySearchRecord
} from './fuzzy';
import {
    LAYOUT_WIDGET_MANIFEST,
    WIDGET_MANIFEST
} from './widget-manifest';

export { getMatchSegments } from './fuzzy';

// Create widget registry
const widgetRegistry = new Map<WidgetItemType, Widget>(
    WIDGET_MANIFEST.map((entry): [WidgetItemType, Widget] => [entry.type, entry.create()])
);
const layoutWidgetTypes = new Set<WidgetItemType>(LAYOUT_WIDGET_MANIFEST.map(entry => entry.type));

export const LEGACY_WIDGET_TYPE_ALIASES: Record<string, WidgetItemType> = { 'git-pr': 'git-review' };

export function resolveLegacyWidgetType(type: WidgetItemType): WidgetItemType {
    return LEGACY_WIDGET_TYPE_ALIASES[type] ?? type;
}

export function upgradeLegacyWidgetTypes(lines: WidgetItem[][]): WidgetItem[][] {
    return lines.map(line => line.map((item) => {
        const resolved = resolveLegacyWidgetType(item.type);
        return resolved === item.type ? item : { ...item, type: resolved };
    }));
}

export function getWidget(type: WidgetItemType): Widget | null {
    return widgetRegistry.get(resolveLegacyWidgetType(type)) ?? null;
}

export function getAllWidgetTypes(settings: Settings): WidgetItemType[] {
    const allTypes = WIDGET_MANIFEST.map(entry => entry.type);

    // Add separator types based on settings
    if (!settings.powerline.enabled) {
        if (!settings.defaultSeparator) {
            allTypes.push('separator');
        }
        allTypes.push('flex-separator');
    }

    return allTypes;
}

export interface WidgetCatalogEntry {
    type: WidgetItemType;
    displayName: string;
    description: string;
    category: string;
    searchText: string;
}

const layoutWidgetManifestMap = new Map(
    LAYOUT_WIDGET_MANIFEST.map(entry => [entry.type, entry])
);

function buildLayoutCatalogEntry(type: WidgetItemType): WidgetCatalogEntry | null {
    const entry = layoutWidgetManifestMap.get(type);
    if (!entry)
        return null;
    const displayName = tWidgetDisplayName(type);
    const description = tWidgetDescription(type);
    const category = tWidgetCategory(entry.category);
    return {
        type: entry.type,
        displayName,
        description,
        category,
        searchText: `${displayName} ${description} ${entry.displayName} ${entry.description} ${entry.type}`.toLowerCase()
    };
}

export function getWidgetCatalog(settings: Settings): WidgetCatalogEntry[] {
    return getAllWidgetTypes(settings).map((type) => {
        const layoutEntry = buildLayoutCatalogEntry(type);
        if (layoutEntry) {
            return layoutEntry;
        }

        const widget = getWidget(type);
        const enDisplayName = widget?.getDisplayName() ?? type;
        const enDescription = widget?.getDescription() ?? '';
        const enCategory = widget?.getCategory() ?? 'Other';
        const displayName = tWidgetDisplayName(type);
        const description = tWidgetDescription(type);
        const category = tWidgetCategory(enCategory);

        return {
            type,
            displayName,
            description,
            category,
            searchText: `${displayName} ${description} ${enDisplayName} ${enDescription} ${type}`.toLowerCase()
        };
    });
}

export function getWidgetCatalogCategories(catalog: WidgetCatalogEntry[]): string[] {
    const categories = new Set<string>();

    for (const entry of catalog) {
        categories.add(entry.category);
    }

    return Array.from(categories);
}

export function filterWidgetCatalog(catalog: WidgetCatalogEntry[], category: string, query: string): WidgetCatalogEntry[] {
    const categoryFiltered = category === 'All'
        ? [...catalog]
        : catalog.filter(entry => entry.category === category);

    const records: FuzzySearchRecord<WidgetCatalogEntry>[] = categoryFiltered.map(entry => ({
        item: entry,
        name: entry.displayName,
        type: entry.type,
        description: entry.description,
        searchText: entry.searchText,
        sortText: entry.displayName,
        secondarySortText: entry.type
    }));

    return filterFuzzySearchRecords(records, query);
}

export function isKnownWidgetType(type: string): boolean {
    const resolved = resolveLegacyWidgetType(type);
    return widgetRegistry.has(resolved)
        || layoutWidgetTypes.has(resolved);
}
