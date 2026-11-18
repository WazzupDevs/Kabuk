import { APP_NAME } from '@shared/brand.ts';
import { fillLegalText, LEGAL_ENTITY, legalReady } from '@shared/legalEntity.ts';
import { type LegalBlock, type LegalSpan, parseLegalMarkdown } from '@shared/legalMarkdown.ts';
import { router } from 'expo-router';
import { Linking, Text, View } from 'react-native';

import { Btn, T, useKit } from '@/aura/kit';
import { RisoKanki } from '@/aura/RisoKanki';
import { LEGAL_DOC_BY_SLUG, LEGAL_DOCS, type LegalDocKey } from '@/i18n/legalDocs.generated';
import { tr } from '@/i18n/tr';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { LEGAL_PEEK } from '@/theme/kankiMotion';
import { SETTINGS } from '@/theme/settings';
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
// (the bar carries it) and the line with the date it takes effect (the meta line carries it: the
// first paragraph, ending in that date).
const parsed = new Map<LegalDocKey, LegalBlock[]>();
function blocksOf(doc: LegalDocKey): LegalBlock[] {
  let blocks = parsed.get(doc);
  if (!blocks) {
    blocks = parseLegalMarkdown(fillLegalText(LEGAL_DOCS[doc], APP_NAME, LEGAL_ENTITY)).filter(
      (block) => !(block.type === 'heading' && block.level === 1),
    );
    const first = blocks[0];
    if (
      first?.type === 'paragraph' &&
      first.spans
        .map((span) => span.text)
        .join('')
        .trim()
        .endsWith(LEGAL_ENTITY.effectiveDate)
    )
      blocks = blocks.slice(1);
    parsed.set(doc, blocks);
  }
  return blocks;
}

// A link to another text opens it in the same stack: from Ayarlar inside the signed-in app
// (`/legal/[doc]`), elsewhere its own screen (the sign-up's).
function open(href: string, inApp: boolean) {
  const slug = href.replace(/\.html$/, '');
  const doc = Object.hasOwn(LEGAL_DOC_BY_SLUG, slug) ? LEGAL_DOC_BY_SLUG[slug] : undefined;
  if (doc && inApp) router.push({ pathname: '/legal/[doc]', params: { doc } });
  else if (doc) router.push(ROUTES[doc]);
  else void Linking.openURL(/^https?:/.test(href) ? href : `${SITE}${href}`);
}

// The board's colours for the text (`.doc p.b`) and its links (`.doc a`: the ink, 600, underlined
// in the ink at 35 %; Android draws the line in the words' colour).
type Look = { text: string; link: string; ink: string; line: string; inApp: boolean };

function Spans({ spans, look }: { spans: LegalSpan[]; look: Look }) {
  return spans.map((span, i) =>
    span.href ? (
      <Text
        key={i}
        accessibilityRole="link"
        onPress={() => open(span.href ?? '', look.inApp)}
        style={[
          KIT_TYPE.strong,
          {
            color: look.ink,
            textDecorationLine: 'underline',
            textDecorationColor: look.link,
          },
        ]}
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

const D = SETTINGS.legal;

// YasalMetin (`.doc`): a heading (`h2` 700 18/24) 22 under the paragraph before it and 8 over the
// next; a paragraph (`p.b` 15/23) 12 over the next. A level-3 heading, a list and a table (not on
// the board, in the texts) take the same room.
function Block({ block, look }: { block: LegalBlock; look: Look }) {
  if (block.type === 'heading') {
    return (
      <T
        v={block.level === 2 ? 'legalHead' : 'h3'}
        color={look.ink}
        accessibilityRole="header"
        style={{ marginTop: D.h2Top - D.p, marginBottom: D.h2Bottom }}
      >
        <Spans spans={block.spans} look={look} />
      </T>
    );
  }
  if (block.type === 'paragraph') {
    return (
      <T v="legalText" color={look.text} style={{ marginBottom: D.p }}>
        <Spans spans={block.spans} look={look} />
      </T>
    );
  }
  if (block.type === 'list') {
    return (
      <View style={{ gap: SPACING[2], marginBottom: D.p }}>
        {block.items.map((item, i) => (
          <View key={i} className="flex-row" style={{ gap: SPACING[2] }}>
            <T v="legalText" color={look.text}>
              {block.ordered ? `${i + 1}.` : '•'}
            </T>
            <View className="flex-1">
              <T v="legalText" color={look.text}>
                <Spans spans={item} look={look} />
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
    <View style={{ marginBottom: D.p }}>
      {block.rows.map((row, i) => (
        <View
          key={i}
          style={{
            gap: SPACING[1],
            paddingVertical: SPACING[3],
            borderTopWidth: KIT.size.hair,
            borderTopColor: look.line,
          }}
        >
          {row.map((cell, j) =>
            j === 0 ? (
              <T key={j} v="legalText" color={look.text} strong>
                <Spans spans={cell} look={look} />
              </T>
            ) : (
              <View key={j}>
                <T v="fine">{block.head[j] ?? ''}</T>
                <T v="legalText" color={look.text}>
                  <Spans spans={cell} look={look} />
                </T>
              </View>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

// The meta line (`.meta`): while the data controller is not named the draft pill (`.drf`) and the
// date the text takes effect 8 beside it, the draft note (`.dn`) under them; once named the date
// alone.
function Meta() {
  const { c, scheme } = useKit();
  const draft = !legalReady(LEGAL_ENTITY);
  const pill = SETTINGS[scheme].draft;
  return (
    <View style={{ marginBottom: D.draftBottom }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: D.metaGap,
          marginBottom: draft ? D.metaBottom : 0,
        }}
      >
        {draft ? (
          <View
            style={{
              height: SETTINGS.draftPill.height,
              paddingHorizontal: SETTINGS.draftPill.padX,
              borderRadius: SETTINGS.draftPill.height / 2,
              justifyContent: 'center',
              backgroundColor: pill.bg,
            }}
          >
            <T v="draftPill" color={pill.fg}>
              {tr.legal.draftTag}
            </T>
          </View>
        ) : null}
        <T v="fine" color={c.muted}>
          {tr.legal.effective(LEGAL_ENTITY.effectiveDate)}
        </T>
      </View>
      {draft ? (
        <T v="fine" color={c.muted}>
          {tr.legal.draftNotice}
        </T>
      ) : null}
    </View>
  );
}

// YasalMetin (yeni arayüz tuvali; the four texts one template): the page of Ayarlar's family (the
// flat ground, the back button and the title on one bar), the meta line, then the text. The text
// is docs/legal/<file>.md, the same file the site shows (legalDocs.generated.ts). `inApp`: opened
// from Ayarlar → Gizlilik, as the board draws it; outside the signed-in app (the sign-up's links)
// "Devam" stays fixed at the foot with a riso buddy looking over it.
export function LegalText({ doc, inApp }: { doc: LegalDocKey; inApp?: boolean }) {
  const { c, scheme } = useKit();
  const S = SETTINGS[scheme];
  const look: Look = { text: S.text, link: S.link, ink: c.ink, line: S.hair, inApp: !!inApp };
  const P = SETTINGS.page;
  return (
    <Screen
      list
      plain
      side={P.side}
      barSide={P.barSide}
      barTop={P.barTop}
      padTop={P.top - SPACING[1] + D.top}
      top={
        <PageTop
          title={TITLES[doc]}
          inline={{ row: P.barRow, back: KIT.size.round, gap: P.barGap }}
        />
      }
      footer={
        inApp ? undefined : (
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
        )
      }
    >
      <View>
        <Meta />
        {blocksOf(doc).map((block, i) => (
          <Block key={i} block={block} look={look} />
        ))}
      </View>
    </Screen>
  );
}
