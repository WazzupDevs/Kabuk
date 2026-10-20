// TRIAL ONLY (claude/visual-trial, never merged): v46's three most layered cards and its most
// layered button, drawn with React Native 0.86's own boxShadow (inset included) and
// experimental_backgroundImage (linear-gradient, radial-gradient); no native module, no SVG.
// Values are v46's CSS (docs/design/v46/skall-masa-deneme-v46.html): .tk + .tk-s + .tk-glare
// (Kapsül Anlat), .sgc-f.sgc-face.imp (Sahtekar), .va .mine (own table card), .tbtn.tabu
// ("Yasak!"). `flat` draws the same boxes without shadows and gradients: what the drawing check
// (scripts/trial/report.ts → cizim) compares them with.
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Polyline, Rect } from 'react-native-svg';

const TC = '#6A47F5';
const INK = '#14112B';
const FONT = 'PlusJakartaSans_800ExtraBold';
const FONT_BOLD = 'PlusJakartaSans_700Bold';
const FONT_SEMI = 'PlusJakartaSans_600SemiBold';

type Props = { flat?: boolean };

function fx(flat: boolean | undefined, style: ViewStyle): ViewStyle {
  if (!flat) return style;
  const { boxShadow: _s, experimental_backgroundImage: _b, ...rest } = style;
  return rest;
}

// .tkd: two paper cards under the top one, then .tk with its print header and the ban list.
export function TabuCard({ flat }: Props) {
  return (
    <View style={styles.ground} testID="deneme-tabu">
      <View style={styles.deck}>
        <View
          style={[
            fx(flat, styles.stack),
            {
              backgroundColor: '#E8E3F6',
              transform: [{ translateY: 14 }, { rotate: '2.2deg' }, { scale: 0.97 }],
            },
          ]}
        />
        <View
          style={[
            fx(flat, styles.stack),
            {
              backgroundColor: '#F4F1FC',
              transform: [{ translateY: 7 }, { rotate: '-2.4deg' }, { scale: 0.985 }],
            },
          ]}
        />
        <View style={fx(flat, styles.tk)} testID="deneme-tk">
          <View style={styles.tkHead}>
            <View style={styles.tkHeadDot} />
            <Text style={styles.tkWord}>KAPSÜL</Text>
          </View>
          <Text style={styles.tkSep}>SÖYLEME</Text>
          {['Zaman', 'Gömmek', 'Gelecek', 'Mektup', 'Kutu'].map((w, i) => (
            <Text key={w} style={[styles.tkBan, i > 0 && styles.tkBanLine]}>
              {w}
            </Text>
          ))}
          {flat ? null : <View pointerEvents="none" style={styles.glare} />}
        </View>
      </View>
      <View style={styles.acts}>
        <YasakButton flat={flat} />
      </View>
    </View>
  );
}

// .sgc-f.sgc-face.imp: the impostor's face of the seat card.
export function ImpostorCard({ flat }: Props) {
  return (
    <View style={[styles.ground, { backgroundColor: '#4A22A8' }]} testID="deneme-sahtekar">
      <View style={fx(flat, styles.imp)} testID="deneme-imp">
        <Text style={styles.impMark}>?</Text>
        <Text style={styles.impLabel}>SAHTEKARSIN</Text>
        <View style={styles.impCat}>
          <Text style={styles.impCatText}>Kategori: Mutfak</Text>
        </View>
        <Text style={styles.impText}>Kelimeyi bilmiyorsun. Belli etme.</Text>
      </View>
    </View>
  );
}

// .va .mine: your own table, with the pink to violet glow in its corner.
export function MineCard({ flat }: Props) {
  return (
    <View style={styles.page} testID="deneme-masa">
      <View style={fx(flat, styles.mine)} testID="deneme-mine">
        {flat ? null : <View pointerEvents="none" style={styles.mineGlow} />}
        <View style={styles.mineHead}>
          <View style={styles.mineIc} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.mineAlias}>Mor Dalga</Text>
            <View style={styles.mineLine}>
              <View style={styles.dot} />
              <Text style={styles.mineState}>1 kişi · Lobide değil</Text>
            </View>
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Polyline
              points="9 5 16 12 9 19"
              fill="none"
              stroke="#6E6C78"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <View style={styles.two}>
          <Pill label="Lobiye aç" primary />
          <Pill label="Davet et" />
        </View>
      </View>
    </View>
  );
}

function Pill({ label, primary }: { label: string; primary?: boolean }) {
  return (
    <View style={[styles.pill, primary ? { backgroundColor: TC } : { backgroundColor: '#EEEBF8' }]}>
      <Text style={[styles.pillText, { color: primary ? '#fff' : INK }]}>{label}</Text>
    </View>
  );
}

// .tbtn.tabu: the white ring is a spread shadow, under it the drop.
export function YasakButton({ flat }: Props) {
  return (
    <View style={fx(flat, styles.yasak)} testID="deneme-yasak">
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Rect x={9.8} y={3} width={4.4} height={12} rx={2.2} fill="#FFFFFF" />
        <Rect x={9.8} y={16.8} width={4.4} height={4.4} rx={2.2} fill="#FFD2C9" />
      </Svg>
      <Text style={styles.yasakText}>Yasak!</Text>
    </View>
  );
}

// The 20 cards of Ayarlar → Tasarım (test) → Bileşen önizleme → Kaydırma: scrolling them is checked
// by hand on a phone (the CI emulator draws in software; its speed says nothing about a phone).
export function ScrollTrialSet(): ReactNode {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: 20 }, (_, i) => (
        <TrialRow key={i} index={i} />
      ))}
    </View>
  );
}

export function TrialRow({ index, flat }: { index: number; flat?: boolean }): ReactNode {
  const kind = index % 3;
  if (kind === 0) return <TabuCard flat={flat} />;
  if (kind === 1) return <ImpostorCard flat={flat} />;
  return <MineCard flat={flat} />;
}

const styles = StyleSheet.create({
  ground: { backgroundColor: TC, padding: 16, gap: 14 },
  page: { backgroundColor: '#F5F3FC', padding: 16 },
  deck: { paddingBottom: 14 },
  stack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 14,
    borderRadius: 24,
    backgroundColor: '#fff',
    boxShadow: '0 1px 0 #DCD5EE, 0 10px 22px rgba(20,17,43,0.2)',
  },
  tk: {
    paddingTop: 7,
    paddingHorizontal: 7,
    paddingBottom: 14,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    experimental_backgroundImage: 'linear-gradient(172deg, #FFFFFF 0%, #FBFAFF 60%, #F3F0FB 100%)',
    boxShadow: 'inset 0 1px 0 #fff, 0 2px 0 #DCD5EE, 0 18px 34px rgba(20,17,43,0.3)',
    overflow: 'hidden',
  },
  tkHead: {
    overflow: 'hidden',
    paddingVertical: 26,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: TC,
    alignItems: 'center',
  },
  tkHeadDot: {
    position: 'absolute',
    right: -18,
    top: -26,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tkWord: { fontFamily: FONT, fontSize: 32, lineHeight: 38, letterSpacing: 0.4, color: '#fff' },
  tkSep: {
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: FONT,
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#8A84A3',
  },
  tkBan: {
    marginHorizontal: 14,
    textAlign: 'center',
    fontFamily: FONT_BOLD,
    fontSize: 17,
    lineHeight: 36,
    color: INK,
  },
  tkBanLine: { borderTopWidth: 1, borderTopColor: '#EFEAF9' },
  glare: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 24,
    experimental_backgroundImage:
      'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.32), rgba(255,255,255,0) 42%)',
  },
  acts: { alignItems: 'center', paddingTop: 4 },
  yasak: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    minWidth: 188,
    paddingHorizontal: 34,
    borderRadius: 999,
    backgroundColor: '#C8331F',
    boxShadow: '0 0 0 3px rgba(255,255,255,0.92), 0 10px 22px rgba(20,17,43,0.25)',
  },
  yasakText: { fontFamily: FONT, fontSize: 16, color: '#fff' },
  imp: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    minHeight: 300,
    borderRadius: 26,
    backgroundColor: '#C51F62',
    experimental_backgroundImage: 'linear-gradient(160deg, #FF4F8B, #C51F62)',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25), 0 22px 44px rgba(0,0,0,0.35)',
  },
  impMark: { fontFamily: FONT, fontSize: 64, lineHeight: 70, color: '#fff' },
  impLabel: { fontFamily: FONT, fontSize: 13, letterSpacing: 1.6, color: '#fff' },
  impCat: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: 'rgba(20,17,43,0.22)',
  },
  impCatText: { fontFamily: FONT, fontSize: 13, color: '#fff' },
  impText: {
    maxWidth: 220,
    textAlign: 'center',
    fontFamily: FONT_SEMI,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  mine: {
    overflow: 'hidden',
    padding: 12,
    gap: 12,
    borderRadius: 22,
    backgroundColor: '#fff',
    boxShadow: '0 10px 22px rgba(20,17,43,0.07)',
  },
  mineGlow: {
    position: 'absolute',
    right: -30,
    top: -50,
    width: 130,
    height: 130,
    borderRadius: 65,
    experimental_backgroundImage:
      'radial-gradient(circle, rgba(255,79,139,0.2), rgba(123,92,255,0.1) 45%, transparent 70%)',
  },
  mineHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mineIc: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFB547' },
  mineAlias: { fontFamily: FONT, fontSize: 16, lineHeight: 22, color: INK },
  mineLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A9A3BF' },
  mineState: { fontFamily: FONT_SEMI, fontSize: 13, lineHeight: 18, color: '#5E5878' },
  two: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontFamily: FONT_BOLD, fontSize: 14 },
});
