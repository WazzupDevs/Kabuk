import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { blursBehind, TAB_GLASS } from './glass';

// The live app's tabs and Keşfet, read from their source (moved from scripts/v46 when v46 was
// removed, 30 Ekim).
const mobile = join(import.meta.dirname, '..', '..');
const app = (file: string) => readFileSync(join(mobile, file), 'utf8');

describe("the app's tabs", () => {
  it('float the bar above the bottom, feel a new tab and blur the focused screen', () => {
    const tabs = app('src/components/TabBar.tsx');
    // The kit's bar (iskelet.md → 3.3), folded by the tabs' scroll (TabBarMotion), over its edge.
    expect(tabs).toMatch(/TabBar as FloatingTabBar,[\s\S]*from '@\/motion\/TabBar'/);
    expect(tabs).toMatch(/<TabBarMotion>\{children\}<\/TabBarMotion>/);
    expect(tabs).toMatch(/\{overMap \? null : <TabBarEdge \/>\}/);
    expect(tabs).toMatch(/bottom: insets\.bottom \+ AURA\.tabBar\.bottom/);
    // The room the bar takes at the bottom of a tab screen: the bar, its distance, a little more.
    expect(tabs).toMatch(/t\.height \+ t\.bottom \+ insets\.bottom \+ SPACING\[4\]/);
    // Every press that changes the tab is felt, the Mekan tab's redirect to Keşfet too.
    expect(tabs).toMatch(
      /const route = routeOf\(opened\);[\s\S]*if \(moves\) haptic\('tabChanged'\);\s*if \(opened !== key\) router\.navigate\(ROUTES\[opened\]\);\s*else if \(moves\) navigation\.navigate\(route\.name, route\.params\);/,
    );
    const layout = app('app/(app)/(tabs)/_layout.tsx');
    expect(layout).toMatch(/opens=\{\(tab\) => tabOpenedBy\(tab, table\.data, Date\.now\(\)\)\}/);
    // Each tab screen is a glass target where the live glass is on; over the map the bar is opaque.
    expect(tabs).toMatch(/<GlassTarget targetId=\{id\}/);
    expect(tabs).toMatch(/onPress=\{onPress\}\s*opaque=\{overMap\}/);
    expect(layout).toMatch(
      /screenLayout=\{\(\{ navigation, route, children \}\) => \(\s*<TabScene navigation=\{navigation\} routeKey=\{route\.key\}>\s*\{children\}\s*<\/TabScene>/,
    );
  });

  it("frosts as the canvas's `.glass` does, and only where Android blurs", () => {
    expect(TAB_GLASS.blur).toBe(24);
    expect(TAB_GLASS.saturation).toBe(1.7);
    // The glass draws on Android from 12 (RenderEffect); the owner's decision (§4.C).
    expect([29, 30].map((v) => blursBehind('android', v))).toEqual([false, false]);
    expect([31, 34, '35'].map((v) => blursBehind('android', v))).toEqual([true, true, true]);
    expect(blursBehind('ios', '17.4')).toBe(true);
  });
});

describe("the app's Keşfet", () => {
  const screen = app('app/(app)/(tabs)/explore/index.tsx');

  it("is built from the canvas's kit", () => {
    expect(screen).toMatch(/from '@\/aura\/kit'/);
    // iskelet.md → 5.1: the one capsule of the search and the switch, pinned and thinning; each
    // venue on its own card; the motion from the kit.
    for (const part of ['<SearchCapsule', '<ViewSwitch', '<Chip', '<PlaceCard', '<EmptyCard']) {
      expect(screen, part).toContain(part);
    }
    expect(screen).toMatch(
      /<StickyField shrink=\{\[X\.capsule, X\.capsulePinned\]\} band side=\{EXPLORE\.headSide\}>/,
    );
    expect(screen).toMatch(/from '@\/motion'/);
  });

  it('leaves the bell to Mesajlar alone, its dot on the tab for unread DMs and waiting requests (K-6)', () => {
    for (const file of ['explore/index.tsx', 'activities.tsx', 'profile/index.tsx']) {
      expect(app(`app/(app)/(tabs)/${file}`), file).not.toMatch(/NotificationsBell|BellButton/);
    }
    expect(app('app/(app)/(tabs)/messages/index.tsx')).toMatch(/<NotificationsBell \/>/);
    const layout = app('app/(app)/(tabs)/_layout.tsx');
    expect(layout).toMatch(/tabBarBadge: unread \+ requests > 0 \? unread \+ requests : undefined/);
    expect(layout).toMatch(/tabBarAccessibilityLabel: tr\.tabs\.messagesWith\(unread, requests\)/);
  });

  it('names the chips and the switch for a screen reader', () => {
    expect(screen).toMatch(/accessibilityLabel=\{tr\.explore\.viewSwitch\}/);
    expect(screen).toMatch(/accessibilityLabel=\{tr\.explore\.kindsLabel\}/);
  });

  it('feels a new view, the list or the map (haptics.ts → selection)', () => {
    expect(screen).toMatch(/onChange=\{\(mode\) => \{\s*haptic\('selection'\);\s*setView\(mode\);/);
  });

  it("takes each venue's icon and type from its category (lib/venueType.ts)", () => {
    // The list row and the venue page; the mapping is tested in venueType.test.ts.
    expect(screen).toMatch(/const type = venueType\(v\);/);
    expect(screen).toMatch(/<VenueThumb\s+kind=\{kind\}\s+size=\{VENUE_CARD_PICTURE\}/);
    expect(screen).toMatch(/<CardPicture kind=\{type\} \/>/);
    expect(screen).toMatch(/const VENUE_CARD_PICTURE = X\.card\.picture;/);
    expect(app('src/theme/auraKit.ts')).toMatch(/picture: 76, pictureRadius: 14/);
    expect(app('src/theme/auraKit.ts')).toMatch(/size: 56,\n  radius: 18,/);
    expect(screen).toMatch(/tr\.explore\.typeLabel\[type\]/);
    const page = app('app/(app)/(tabs)/explore/[venueId].tsx');
    expect(page).toMatch(/const type = venueType\(venue\);/);
    expect(page).toMatch(/tr\.explore\.typeLabel\[type\]/);
    // The words for the types (v46's, kept).
    const tr = app('src/i18n/tr.ts');
    for (const word of ['Kafe', 'Çay bahçesi', 'Kampüs']) expect(tr).toContain(`'${word}'`);
  });

  it("keeps the board's spacing (tuval Kesfet, theme/explore.ts), and is always the list (no single venue)", () => {
    expect(screen).toMatch(/marginTop: EXPLORE\.districtTop/);
    expect(screen).toMatch(/marginTop: EXPLORE\.sectionTop/);
    expect(screen).toMatch(/gap: X\.cardsGap/);
    expect(screen).not.toMatch(/SingleVenue|exploreLayout/);
  });

  it('fetches the list again when pulled at its top', () => {
    // The list view only, fetching the venues and their cities.
    expect(screen).toMatch(/<PullScroll\s+onRefresh=\{onRefresh\}\s+scrollY=\{y\}/);
    expect(screen).toMatch(
      /onRefresh=\{\(\) => Promise\.all\(\[venues\.refetch\(\), cities\.refetch\(\)\]\)\}/,
    );
    const pull = app('src/components/PullScroll.tsx');
    // At the top and not already refreshing.
    expect(pull).toMatch(/pulling\.set\(atTop\.get\(\) && !busy\.get\(\)\)/);
    // A release past the lock refreshes; the mark turns (Dönüş) at least as long as a loader stays.
    expect(pull).toMatch(/if \(finger\.get\(\) >= p\.lockAt\) \{/);
    expect(pull).toMatch(/<Loader kind="spin" size=\{p\.size\} delay=\{0\} \/>/);
    expect(pull).toMatch(/wait\(LOADER_MIN_VISIBLE_MS\)/);
    // The list settles with its transition, at once with reduce motion; it does not stretch.
    expect(pull).toMatch(/const still = reduce && p\.settle\.offWhenReduced;/);
    expect(pull).toMatch(/Easing\.bezier\(\.\.\.p\.settle\.ease\)/);
    expect(pull).toMatch(/overScrollMode="never"/);
  });
});
