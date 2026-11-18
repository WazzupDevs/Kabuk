import { Redirect, useLocalSearchParams } from 'expo-router';

import { LegalText } from '@/components/LegalText';
import { LEGAL_DOCS, type LegalDocKey } from '@/i18n/legalDocs.generated';

// A legal text from inside the app (Ayarlar → Gizlilik): the same texts as the sign-up's, as
// YasalMetin draws them (no "Devam" at the foot: the back button closes it).
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  if (Object.hasOwn(LEGAL_DOCS, doc)) return <LegalText inApp doc={doc as LegalDocKey} />;
  return <Redirect href="/settings" />;
}
