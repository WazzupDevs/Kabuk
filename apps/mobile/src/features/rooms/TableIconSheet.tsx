import { TABLE_ICON_THEMES, TABLE_ICONS } from '@shared/tableIcons.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { IconPicker } from './CreateTableSheet';
import { roomKeys, useVenueTables } from './queries';

// The owner changes the table's icon (skall tuvali: MasaSimgeDegistir; K-45, K-59): the themes,
// the theme's scenes, the ones at the venue's other tables faded. A pick saves at once; "Tamam"
// closes.
export function TableIconSheet({
  visible,
  onClose,
  roomId,
  venueId,
  icon,
}: {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  venueId: string;
  icon: string | null;
}) {
  const queryClient = useQueryClient();
  const tables = useVenueTables(visible ? venueId : undefined);
  const used = useMemo(
    () =>
      new Set(
        [...(tables.data?.open ?? []), ...(tables.data?.running ?? [])].flatMap((t) =>
          t.icon && t.icon !== icon ? [t.icon] : [],
        ),
      ),
    [tables.data, icon],
  );
  const [theme, setTheme] = useState<string>(
    () => TABLE_ICONS.find((i) => i.id === icon)?.theme ?? TABLE_ICON_THEMES[0] ?? '',
  );
  const change = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (next: string) => roomsApi.setIcon(roomId, next),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
      void queryClient.invalidateQueries({ queryKey: roomKeys.venueTables(venueId) });
    },
  });
  const shown = change.isPending ? (change.variables ?? icon) : icon;
  return (
    <Sheet visible={visible} onClose={onClose} title={tr.createTable.iconLabel}>
      <IconPicker
        theme={theme}
        onTheme={setTheme}
        selected={shown}
        used={used}
        onSelect={(next) => next !== icon && change.mutate(next)}
      />
      {change.isError ? (
        <Text variant="fine" tone="danger">
          {errorMessage(change.error)}
        </Text>
      ) : null}
      <Button
        size="lg"
        label={tr.createTable.iconDone}
        loading={change.isPending}
        onPress={onClose}
      />
    </Sheet>
  );
}
