import { View } from 'react-native';

import { Av, type AvBoard, InSheet, Li, RowList, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { ROOM } from '@/theme/room';

// Atölye draft `newMessageSheet` (the owner's ask, 26 Kasım): Mesajlar's "Yeni mesaj" sheet
// (messages/index.tsx → FriendPicker). A is today: the rows in a card of their own inside the
// sheet, the 48 face with its ring, the h3 name. B lays the rows straight on the sheet as Masana
// davet et does (theme/room.ts → invite: 8 above and under, 48 at least, 12 between, the 44 face,
// the hairline from 56), the face without its ring, and a line under the title. The sheet is drawn
// still here, in place (a real Sheet is a Modal); sample names, nothing reads the server.

export type NewMessageLook = 'today' | 'flat';

const NAMES = ['Deniz', 'Ece', 'Kaan', 'Mert'] as const;
const NO_RING: AvBoard = { ring: 0, ringColor: 'transparent', shadow: '' };
const SUBTITLE_GAP = 4;

export function NewMessageSheetDraft({ look, width }: { look: NewMessageLook; width: number }) {
  const { c, scheme } = useKit();
  const layer = KIT.layer[scheme];
  const t = tr.design.workshop.newMessageSheet;
  const flat = look === 'flat';
  return (
    // Stretched to the Atölye card's inside, never wider than the column it is given.
    <View style={{ alignSelf: 'stretch', maxWidth: width, gap: KIT.size.rowGap }}>
      <View
        style={{
          backgroundColor: layer.sheet,
          borderRadius: KIT.layer.size.sheetRadius,
          paddingTop: KIT.size.sheetPadTop,
          paddingBottom: KIT.size.sheetPadBottomMin,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            alignSelf: 'center',
            width: KIT.size.grabW,
            height: KIT.size.grabH,
            borderRadius: KIT.size.grabH,
            backgroundColor: layer.sheetGrab,
          }}
        />
        <View
          style={{
            marginTop: KIT.size.sheetHeadGap,
            paddingHorizontal: KIT.size.sheetPadX,
            gap: SUBTITLE_GAP,
          }}
        >
          <T v="sheetTitle">{tr.messages.newMessage}</T>
          {flat ? (
            <T v="fine" color={c.muted}>
              {t.sub(NAMES.length)}
            </T>
          ) : null}
        </View>
        <View style={{ paddingTop: KIT.size.rowGap, paddingHorizontal: KIT.size.sheetPadX }}>
          <InSheet>{flat ? <FlatRows /> : <TodayRows />}</InSheet>
        </View>
      </View>
      <T v="fine" color={c.muted}>
        {flat ? t.noteB : t.noteA}
      </T>
    </View>
  );
}

// Today's rows (FriendPicker): a RowList card, a Li each, the 48 face and the h3 name.
function TodayRows() {
  return (
    <RowList>
      {NAMES.map((name) => (
        <Li key={name}>
          <Av size="row" name={name} />
          <T v="h3" style={{ flex: 1 }}>
            {name}
          </T>
        </Li>
      ))}
    </RowList>
  );
}

// B: Masana davet et's rows on the sheet itself, the 44 face without its ring.
function FlatRows() {
  const { scheme } = useKit();
  const I = ROOM.invite;
  return (
    <View>
      {NAMES.map((name, i) => (
        <View key={name}>
          {i > 0 ? (
            <View
              style={{
                height: KIT.size.hair,
                marginLeft: I.hairIn,
                marginRight: I.hairOut,
                backgroundColor: KIT.layer[scheme].menuHair,
              }}
            />
          ) : null}
          <Li padY={I.padY} padX={0} gap={I.gap} minHeight={I.min}>
            <Av size="md" name={name} board={NO_RING} />
            <View style={{ flex: 1 }}>
              <T v="settingsRow" ink>
                {name}
              </T>
            </View>
          </Li>
        </View>
      ))}
    </View>
  );
}
