import { Redirect } from 'expo-router';

// `/` opens Keşfet (docs/arsiv/SPEC_V2.md §2).
export default function Index() {
  return <Redirect href="/explore" />;
}
