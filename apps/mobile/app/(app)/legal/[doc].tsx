import { Redirect, useLocalSearchParams } from 'expo-router';

import { LegalText } from '@/components/LegalText';
import { LEGAL_DOCS, type LegalDocKey } from '@/i18n/legalDocs.generated';

// A legal text from inside the app (Ayarlar → Gizlilik): the same texts as the sign-up's.
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  if (doc in LEGAL_DOCS) return <LegalText doc={doc as LegalDocKey} />;
  return <Redirect href="/settings" />;
}
