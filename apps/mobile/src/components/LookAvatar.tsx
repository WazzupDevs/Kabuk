import { useMemo } from 'react';
import { View } from 'react-native';

import { createLru } from '@/lib/lru';
import { stillSvg } from '@/theme/capsuleFx';
import { lookSvg } from '@/theme/capsuleLook';

import { readAhead } from './CachedSvg';
import { useChatMovers, useChatScrolling } from './chatScrolling';
import { FxSvg, type InsidePainter } from './FxSvg';

// A look's avatar drawing, made once (the options of Kapsülünü süsle make the same ones again and
// again as the person moves between tabs).
const KEEP = 600;
const made = createLru<string>(KEEP);
function avatarSvg(look: string): string {
  const hit = made.get(look);
  if (hit !== undefined) return hit;
  const xml = lookSvg(look, 'av');
  made.set(look, xml);
  return xml;
}

// Reads a look's avatar ahead, still as a list shows it, so that it shows with nothing left to read.
export function readLookAhead(look: string): void {
  readAhead(stillSvg(avatarSvg(look)));
}

// The person's own capsule from its stored look (skall tuvali, Profil: "Kapsülün"), drawn by the
// v46 drawing library: the disc in the colour's ground with the capsule cut by it.
export function LookAvatar({
  look,
  size,
  accessibilityLabel,
  still = false,
  paused = false,
  lane,
  inside,
}: {
  look: string;
  size: number;
  accessibilityLabel?: string;
  // Drawn still / its motion held where it stands, on the clocks of `lane` (FxSvg).
  still?: boolean;
  paused?: boolean;
  lane?: string;
  // What draws its motions inside a clip (FxSvg): Kapsül ölçümü's grid with Skia only.
  inside?: InsidePainter;
}) {
  const xml = useMemo(() => avatarSvg(look), [look]);
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
    >
      {inside ? (
        <FxSvg
          xml={xml}
          width={size}
          height={size}
          still={still}
          paused={paused}
          lane={lane}
          inside={inside}
        />
      ) : (
        <FxSvg xml={xml} width={size} height={size} still={still} paused={paused} lane={lane} />
      )}
    </View>
  );
}

// Its own clocks: the chat faces pause while the stream scrolls without holding the other faces'.
const CHAT_LANE = 'chatface';

// A face beside a chat message (ChatList's streams): it moves only while its row is on the screen
// and among the newest few of them, and holds still while the stream scrolls. `id` is the row's key.
export function ChatLookAvatar({ look, size, id }: { look: string; size: number; id: string }) {
  const moves = useChatMovers().has(id);
  const scrolling = useChatScrolling();
  return <LookAvatar look={look} size={size} still={!moves} paused={scrolling} lane={CHAT_LANE} />;
}
