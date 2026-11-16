import { View } from 'react-native';

import { T } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { InboxCard, useThreadMenu } from '@/features/friends/InboxRows';
import { useDmInbox } from '@/features/friends/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { splitInbox } from '@/lib/dmManage';
import { useNow } from '@/lib/useNow';
import { MESSAGES as M } from '@/theme/messages';
import { SPACING } from '@/theme/tokens';

// Arşivlenenler (docs/SPEC_V4.md §4.X; tuval Arsiv, ArsivUzunBas, ArsivBos): the archived
// conversations, from the same dm/inbox as Mesajlar, newest first. A new message keeps a
// conversation here with its unread; a long press takes it out ("Arşivden çıkar") or clears it.
export default function ArchiveScreen() {
  const inbox = useDmInbox();
  const loading = useLoaderHold(inbox.isPending);
  const menu = useThreadMenu(inbox.data ?? []);
  const now = new Date(useNow(60_000));
  const archived = inbox.data ? splitInbox(inbox.data).archived : [];
  return (
    <Screen
      list
      refreshable
      side={M.side}
      top={
        <PageTop
          title={tr.messages.archived}
          sub={archived.length > 0 ? tr.messages.archivedCount(archived.length) : undefined}
        />
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
            title={tr.messages.archivedEmpty}
            body={tr.messages.archivedEmptyHint}
          />
        </View>
      ) : (
        <View testID="archive-list" style={{ gap: SPACING[3] }}>
          <T v="fine">{tr.messages.archivedHint}</T>
          <InboxCard threads={archived} now={now} onHold={menu.open} />
          {menu.menu}
        </View>
      )}
    </Screen>
  );
}
