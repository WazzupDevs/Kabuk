import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Btn, Round, T } from '@/aura/kit';
import { useNarrow } from '@/lib/useNarrow';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { letterFace } from '@/theme/avatar';
import { FLAT } from '@/theme/flatLists';

export type RowAction = {
  label: string;
  // The accept button's own words ("Kabul et", "Katıl"); the round decline has none.
  text?: string;
  testID: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
};

type Props = {
  testID: string;
  // What the reader hears: the whole row as a sentence.
  label: string;
  name: string;
  kind: string;
  stamp?: { text: string; color?: string };
  face: ReactNode;
  decline?: RowAction;
  accept?: RowAction;
  // "Gönderdiğin"'s one soft button ("Geri çek"), with its words in `text`.
  soft?: RowAction;
  // A line under the row (the table is full, an answer failed).
  note?: { text: string; danger?: boolean };
};

// Mesajlar → İstekler `.rq` (yeni arayüz tuvali: IsteklerDolu): the face, the name over its line and
// its date or seconds, the decline round and the accept button at the right; at 320 dp or the
// largest text they stand under the words. Shared by the friend requests and the "Masa" rows.
export function RequestRowView({
  testID,
  label,
  name,
  kind,
  stamp,
  face,
  decline,
  accept,
  soft,
  note,
}: Props) {
  const R = FLAT.request;
  const narrow = useNarrow();
  const actions =
    decline || accept || soft ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipsGap }}>
        {decline ? (
          <Round
            icon="close"
            label={decline.label}
            testID={decline.testID}
            disabled={decline.disabled}
            loading={decline.loading}
            onPress={decline.onPress}
          />
        ) : null}
        {accept ? (
          <Btn
            sm
            icon="check"
            label={accept.text ?? ''}
            accessibilityLabel={accept.label}
            testID={accept.testID}
            disabled={accept.disabled}
            loading={accept.loading}
            onPress={accept.onPress}
          />
        ) : null}
        {soft ? (
          <Btn
            sm
            variant="glassy"
            label={soft.text ?? ''}
            accessibilityLabel={soft.label}
            testID={soft.testID}
            disabled={soft.disabled}
            loading={soft.loading}
            onPress={soft.onPress}
          />
        ) : null}
      </View>
    ) : null;
  return (
    <View testID={testID} style={{ gap: KIT.size.chipsGap, paddingVertical: R.rowPadY }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: R.gap }}>
        {face}
        <View style={{ flex: 1, minWidth: 0 }} accessible accessibilityLabel={label}>
          <T v="h3">{name}</T>
          <T v="fine">{kind}</T>
          {stamp ? (
            <T v="stamp" color={stamp.color}>
              {stamp.text}
            </T>
          ) : null}
        </View>
        {narrow ? null : actions}
      </View>
      {narrow ? actions : null}
      {note ? (
        <T v="fine" color={note.danger ? KIT.danger : undefined}>
          {note.text}
        </T>
      ) : null}
    </View>
  );
}

// `.rqa`: a face without a photo, the name's first letter in white on its own colour.
export function LetterFace({ name }: { name: string }) {
  const f = FLAT.requestFace;
  const { letter, color } = letterFace(name);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: f.side,
        height: f.side,
        borderRadius: f.radius,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text maxFontSizeMultiplier={1} style={[KIT_TYPE.faceLetter, { color: KIT.white }]}>
        {letter}
      </Text>
    </View>
  );
}
