import { useLocalSearchParams } from 'expo-router';

import { useDistrictChatProfile } from '@/features/district/queries';
import { SenderProfileScreen } from '@/features/profile/SenderProfileScreen';
import { districtChatApi, friendsApi } from '@/lib/api';

// The sender of a profiled district chat message, opened through the message (docs/SPEC_V4.md
// §4.V): only to the room's people, no public_id. The screen is the shared
// `SenderProfileScreen`; the district chat has no block.
export default function DistrictChatProfileScreen() {
  const { messageId } = useLocalSearchParams<{ messageId: string }>();
  const view = useDistrictChatProfile(messageId);
  return (
    <SenderProfileScreen
      view={view}
      sendRequest={() => friendsApi.requestFromDistrictChat(messageId)}
      report={{ send: (reason) => districtChatApi.report(messageId, reason) }}
      ids={{
        screen: 'district-chat-profile',
        request: 'district-chat-profile-request',
        confirm: 'district-chat-request-confirm',
      }}
    />
  );
}
