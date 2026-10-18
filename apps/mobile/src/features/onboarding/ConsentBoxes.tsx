import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { Card } from '@/components/Card';
import { Checkbox } from '@/components/Checkbox';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';

type Props = {
  terms: boolean;
  kvkk: boolean;
  onTerms: () => void;
  onKvkk: () => void;
};

// The two consents with their "Oku" links (the terms and the KVKK notice), on "Başlamadan önce"
// before the phone and again after the code when the texts changed.
export function ConsentBoxes({ terms, kvkk, onTerms, onKvkk }: Props) {
  return (
    <Card className="gap-1">
      <Checkbox label={tr.consents.terms} checked={terms} onToggle={onTerms} />
      <ReadLink href="/terms" />
      <Checkbox label={tr.consents.kvkk} checked={kvkk} onToggle={onKvkk} />
      <ReadLink href="/kvkk" />
    </Card>
  );
}

// "Oku" under a consent, aligned with the checkbox label; 44 high for the finger.
function ReadLink({ href }: { href: '/terms' | '/kvkk' }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" className="ml-9 min-h-11 justify-center self-start">
        <Text tone="accent" variant="bodyStrong">
          {tr.consents.read}
        </Text>
      </Pressable>
    </Link>
  );
}
