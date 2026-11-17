import { useLocalSearchParams } from 'expo-router';

import { useDistrictPersonProfile } from '@/features/district/queries';
import { SenderProfileScreen } from '@/features/profile/SenderProfileScreen';

// A profiled row of Odadakiler, opened through the row (docs/SPEC_V4.md §4.V): the same view as a
// profiled message's sender, only to the room's people, no public_id. The row is no message: no
// request and no report start here (those go through a message); a friend gets the DM.
export default function DistrictPersonProfileScreen() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const view = useDistrictPersonProfile(ref);
  return <SenderProfileScreen view={view} ids={{ screen: 'district-person-profile' }} />;
}
