import type { ImageSourcePropType } from 'react-native';

// A venue's own picture where one is drawn (the owner's call, 24 Kasım: İstanbul Gelişim
// Üniversitesi from its tower, Sakarya's Esentepe at dusk; not riso): the ticket's small one, drawn
// whole at the ticket box's 4:3 (never a crop of the scene), and the page's 4:3 scene. Matched by
// the venue's name, the one thing the app holds that is the same in the dev and the production
// project (their ids differ); without one, the type's picture and the shared scene stay.
type Own = { ticket: ImageSourcePropType; scene: ImageSourcePropType };

const OWN: Record<string, Own> = {
  'İstanbul Gelişim Üniversitesi': {
    ticket: require('../../../assets/riso/venue-igu.webp') as ImageSourcePropType,
    scene: require('../../../assets/riso/venue-igu-scene.webp') as ImageSourcePropType,
  },
  // Esentepe at dusk, over Sapanca's lit shore.
  'Sakarya Üniversitesi Esentepe Kampüsü': {
    ticket: require('../../../assets/riso/venue-sau.webp') as ImageSourcePropType,
    scene: require('../../../assets/riso/venue-sau-scene.webp') as ImageSourcePropType,
  },
};

export function ownTicketPicture(name: string): ImageSourcePropType | null {
  return OWN[name]?.ticket ?? null;
}

export function ownScenePicture(name: string): ImageSourcePropType | null {
  return OWN[name]?.scene ?? null;
}
