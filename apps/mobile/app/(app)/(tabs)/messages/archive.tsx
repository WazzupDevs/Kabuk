import { useState } from 'react';
import { View } from 'react-native';

import { T } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { Toast, type ToastMessage } from '@/components/Toast';
import { InboxList, useThreadMenu } from '@/features/friends/InboxRows';
import { useDmInbox } from '@/features/friends/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { splitInbox } from '@/lib/dmManage';
import { useNow } from '@/lib/useNow';
import { BarBack, ListMoveArea, useListMoves } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { FLAT } from '@/theme/flatLists';
import { MESSAGES as M } from '@/theme/messages';
import { SPACING } from '@/theme/tokens';

// Arşivlenenler (docs/SPEC_V4.md §4.X; yeni arayüz tuvali: Arsiv, ArsivUzunBas, ArsivBos): the
// archived conversations, from the same dm/inbox as Mesajlar, newest first. A new message keeps a
// conversation here with its unread; a long press takes it out ("Arşivden çıkar") or clears it.
export default function ArchiveScreen() {
  const inbox = useDmInbox();
  const loading = useLoaderHold(inbox.isPending);
  // The motion table's A3: a row taken out of the archive or cleared leaves, the others close up;
  // "Sohbet silindi" once one is cleared (tuval MesajlarSilindi).
  const moves = useListMoves();
  const [notice, setNotice] = useState<ToastMessage | null>(null);
  const menu = useThreadMenu(inbox.data ?? [], {
    moves,
    onCleared: () => setNotice({ id: Date.now(), title: tr.messages.cleared }),
  });
  const now = new Date(useNow(60_000));
  const archived = inbox.data ? splitInbox(inbox.data).archived : [];
  const B = FLAT.bar;
  return (
    <View style={{ flex: 1 }}>
      <Screen
        list
        refreshable
        side={M.side}
        barSide={M.side}
        barTop={B.top}
        padTop={B.fieldTop}
        gap={M.gap}
        top={
          // `.ptop`: the round back button and the title over "N sohbet", 12 apart (Arkadaşlar's
          // top row).
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: B.gap, minHeight: B.row }}
          >
            <BarBack side={KIT.size.round} />
            <View style={{ flex: 1 }}>
              <T v="pageBarTitle" accessibilityRole="header">
                {tr.messages.archived}
              </T>
              {archived.length > 0 ? (
                <T v="fine">{tr.messages.archivedCount(archived.length)}</T>
              ) : null}
            </View>
          </View>
        }
      >
        {inbox.isPending || loading ? (
          <View style={{ marginTop: SPACING[12] }}>
            <EmptyState kind="loading" body={tr.common.loading} />
          </View>
        ) : !inbox.data ? (
          <EmptyState
            kind="error"
            body={errorMessage(inbox.error)}
            action={{
              label: tr.common.retry,
              onPress: () => void inbox.refetch(),
              loading: inbox.isRefetching,
            }}
          />
        ) : archived.length === 0 ? (
          <View testID="archive-empty" style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              kind="empty"
              compact
              title={tr.messages.archivedEmpty}
              body={tr.messages.archivedEmptyHint}
            />
          </View>
        ) : (
          <View testID="archive-list" style={{ gap: M.gap }}>
            {/* `.ahint`: 4 in. */}
            <T v="fine" style={{ paddingHorizontal: SPACING[1] }}>
              {tr.messages.archivedHint}
            </T>
            <ListMoveArea moves={moves}>
              <InboxList
                threads={archived}
                now={now}
                onHold={menu.open}
                version={inbox.dataUpdatedAt}
              />
            </ListMoveArea>
            {menu.menu}
          </View>
        )}
      </Screen>
      <Toast message={notice} testID="archive-toast" />
    </View>
  );
}
