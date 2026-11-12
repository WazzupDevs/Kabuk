import { APP_NAME } from '@shared/brand.ts';
import { fillLegalText, LEGAL_ENTITY, legalReady } from '@shared/legalEntity.ts';
import { type LegalBlock, type LegalSpan, parseLegalMarkdown } from '@shared/legalMarkdown.ts';
import { router } from 'expo-router';
import { Linking, Text, View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { RisoKanki } from '@/aura/RisoKanki';
import { LEGAL_DOC_BY_SLUG, LEGAL_DOCS, type LegalDocKey } from '@/i18n/legalDocs.generated';
import { tr } from '@/i18n/tr';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { LEGAL_PEEK } from '@/theme/kankiMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { PageTop } from './PageTop';
import { Screen } from './Screen';

// The texts' pages on skall.world: a link to a text the app does not carry opens there.
const SITE = 'https://skall.world/';

// Each text's screen outside the signed-in app, so a link works before sign-up too.
const ROUTES = {
  terms: '/terms',
  kvkk: '/kvkk',
  privacy: '/privacy',
  community: '/rules',
} as const satisfies Record<LegalDocKey, string>;

const TITLES: Record<LegalDocKey, string> = {
  terms: tr.legal.termsTitle,
  kvkk: tr.legal.kvkkTitle,
  privacy: tr.legal.privacyTitle,
  community: tr.legal.communityTitle,
};

// Each text parsed once: the names filled in (brand.ts, legalEntity.ts), the page title dropped
// (the bar carries it).
const parsed = new Map<LegalDocKey, LegalBlock[]>();
function blocksOf(doc: LegalDocKey): LegalBlock[] {
  let blocks = parsed.get(doc);
  if (!blocks) {
    blocks = parseLegalMarkdown(fillLegalText(LEGAL_DOCS[doc], APP_NAME, LEGAL_ENTITY)).filter(
      (block) => !(block.type === 'heading' && block.level === 1),
    );
    parsed.set(doc, blocks);
  }
  return blocks;
}

function open(href: string) {
  const doc = LEGAL_DOC_BY_SLUG[href.replace(/\.html$/, '')];
  if (doc) router.push(ROUTES[doc]);
  else void Linking.openURL(/^https?:/.test(href) ? href : `${SITE}${href}`);
}

function Spans({ spans, link }: { spans: LegalSpan[]; link: string }) {
  return spans.map((span, i) =>
    span.href ? (
      <Text
        key={i}
        accessibilityRole="link"
        onPress={() => open(span.href ?? '')}
        style={[KIT_TYPE.strong, { color: link }]}
      >
        {span.text}
      </Text>
    ) : span.bold ? (
      <Text key={i} style={KIT_TYPE.strong}>
        {span.text}
      </Text>
    ) : (
      span.text
    ),
  );
}

function Block({ block, link, line }: { block: LegalBlock; link: string; line: string }) {
  if (block.type === 'heading') {
    return (
      <T v={block.level === 2 ? 'title' : 'h3'} accessibilityRole="header">
        <Spans spans={block.spans} link={link} />
      </T>
    );
  }
  if (block.type === 'paragraph') {
    return (
      <T v="legal" ink>
        <Spans spans={block.spans} link={link} />
      </T>
    );
  }
  if (block.type === 'list') {
    return (
      <View style={{ gap: SPACING[2] }}>
        {block.items.map((item, i) => (
          <View key={i} className="flex-row" style={{ gap: SPACING[2] }}>
            <T v="legal" ink>
              {block.ordered ? `${i + 1}.` : '•'}
            </T>
            <View className="flex-1">
              <T v="legal" ink>
                <Spans spans={item} link={link} />
              </T>
            </View>
          </View>
        ))}
      </View>
    );
  }
  // A table as a stack of rows: the first cell is the row's name, each other cell goes under its
  // column's name (a phone has no room for columns).
  return (
    <View>
      {block.rows.map((row, i) => (
        <View
          key={i}
          style={{
            gap: SPACING[1],
            paddingVertical: SPACING[3],
            borderTopWidth: KIT.size.edge,
            borderTopColor: line,
          }}
        >
          {row.map((cell, j) =>
            j === 0 ? (
              <T key={j} v="legal" ink strong>
                <Spans spans={cell} link={link} />
              </T>
            ) : (
              <View key={j}>
                <T v="fine">{block.head[j] ?? ''}</T>
                <T v="legal" ink>
                  <Spans spans={cell} link={link} />
                </T>
              </View>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

// YasalMetin (Aura v71): the round back, the title (with the draft notice under it until the data
// controller is named), the text, and "Devam" fixed at the foot with a riso buddy looking over it.
// The text is docs/legal/<file>.md, the same file the site shows (legalDocs.generated.ts).
export function LegalText({ doc }: { doc: LegalDocKey }) {
  const { scheme, colors } = useTheme();
  const link = scheme === 'dark' ? colors.accent : colors.primaryPressed;
  const line = KIT[scheme].glassEdge;
  return (
    <Screen
      list
      top={
        <PageTop
          title={TITLES[doc]}
          sub={legalReady(LEGAL_ENTITY) ? undefined : tr.legal.draftNotice}
        />
      }
      footer={
        <View>
          {/* Cut at the button's foot: only the part over it and behind it shows (ui 6.1). */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: LEGAL_PEEK.top,
              bottom: 0,
              overflow: 'hidden',
            }}
          >
            <RisoKanki place={{ ...LEGAL_PEEK, top: 0 }} scale={1} shadow={false} />
          </View>
          <Btn block variant="glassy" label={tr.common.continue} onPress={() => router.back()} />
        </View>
      }
    >
      <View style={{ gap: SPACING[4] }}>
        {blocksOf(doc).map((block, i) => (
          <Block key={i} block={block} link={link} line={line} />
        ))}
      </View>
    </Screen>
  );
}
