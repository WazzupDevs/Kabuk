import { V46_SCREEN_PARTS, type V46ScreenPartId } from './parts.generated';
import { V46_COMPONENTS, type V46ComponentId } from './tokens.generated';

// The app's v46 gallery (Ayarlar → Tasarım (test) → v46 galeri) lists the inventory's components
// in its order and groups, the same ids as v46's own gallery (skall-masa-deneme-v46-galeri.html
// ?page=galeri#<id>), so a screenshot of one sits next to the other. The parts of v46's screens
// the inventory does not list (scripts/v46/screenParts.ts: the tab bar with Keşfet or Aktiviteler
// selected, the heads, the list/map switch) follow, in their group: an inventory group they share
// (Sekme çubuğu) or one of their own after the inventory's.
export type GalleryId = V46ComponentId | V46ScreenPartId;

export type GalleryGroup = { name: string; ids: GalleryId[] };

export function galleryGroups(): GalleryGroup[] {
  const groups: GalleryGroup[] = [];
  const add = (id: GalleryId, name: string) => {
    const group = groups.find((g) => g.name === name);
    if (group) group.ids.push(id);
    else groups.push({ name, ids: [id] });
  };
  for (const id of Object.keys(V46_COMPONENTS) as V46ComponentId[]) {
    add(id, V46_COMPONENTS[id].group);
  }
  for (const id of Object.keys(V46_SCREEN_PARTS) as V46ScreenPartId[]) {
    add(id, V46_SCREEN_PARTS[id].group);
  }
  return groups;
}

export function isScreenPart(id: GalleryId): id is V46ScreenPartId {
  return id in V46_SCREEN_PARTS;
}

// A gallery entry's name and the box v46 draws it in.
export function galleryInfo(id: GalleryId): { name: string; width: number; height: number } {
  if (isScreenPart(id)) return V46_SCREEN_PARTS[id];
  const c = V46_COMPONENTS[id];
  return { name: c.name, width: c.width, height: c.light.height };
}

// The testID of a component's entry, and of one of its states once it is built in src/ui.
export function galleryTestId(id: GalleryId, state?: string): string {
  return state ? `gal-${id}-${state}` : `gal-${id}`;
}
