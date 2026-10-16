import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Text } from '@/components/Text';

// A phone's alias at its largest, with its table face (canvas: Faz 2 · 22.5 → "Liderine bu adı
// söyle" and the leader's request card): the requester and the leader see the same name at the
// same size, so the leader tells a friend's request from a stranger's (docs/SPEC_V3.md §22.C).
export function BigAlias({ alias }: { alias: string }) {
  return (
    <View className="flex-row items-center gap-3.5">
      <Avatar kind="table" alias={alias} size="hero" />
      <Text variant="display" className="flex-1">
        {alias}
      </Text>
    </View>
  );
}
