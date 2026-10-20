import type { ReactNode } from 'react';

import type { V46ComponentId } from '@/theme/tokens.generated';

// What the v46 gallery draws for a component once it is rewritten in src/ui (v46 native, step 3):
// each state v46 shows for it (envanter `variants`: normal, pressed; plus disabled, loading …),
// with fixed data. A component not here shows as "henüz yok" with v46's measurements.
export type GalleryState = { key: string; render: () => ReactNode };

export const UI_GALLERY: Partial<Record<V46ComponentId, readonly GalleryState[]>> = {};
