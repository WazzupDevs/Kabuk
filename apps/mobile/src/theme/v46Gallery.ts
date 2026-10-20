import { V46_COMPONENTS, type V46ComponentId } from './tokens.generated';

// The app's v46 gallery (Ayarlar → Tasarım (test) → v46 galeri) lists the inventory's components
// in its order and groups, the same ids as v46's own gallery (skall-masa-deneme-v46-galeri.html
// ?page=galeri#<id>), so a screenshot of one sits next to the other.
export type GalleryGroup = { name: string; ids: V46ComponentId[] };

export function galleryGroups(): GalleryGroup[] {
  const groups: GalleryGroup[] = [];
  for (const id of Object.keys(V46_COMPONENTS) as V46ComponentId[]) {
    const name = V46_COMPONENTS[id].group;
    const group = groups.find((g) => g.name === name);
    if (group) group.ids.push(id);
    else groups.push({ name, ids: [id] });
  }
  return groups;
}

// The testID of a component's entry, and of one of its states once it is built in src/ui.
export function galleryTestId(id: V46ComponentId, state?: string): string {
  return state ? `gal-${id}-${state}` : `gal-${id}`;
}
