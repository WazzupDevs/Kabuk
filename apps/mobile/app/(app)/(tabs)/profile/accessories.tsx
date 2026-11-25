import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchField } from '@/components/Field';
import { Btn, Chip, Round, T } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useHideTabBar } from '@/components/TabBar';
import { useProfile } from '@/features/account/useProfile';
import {
  type CatalogItem,
  type CatalogKind,
  type CatalogSection,
  catalogSections,
  countOf,
  isWorn,
  putOn,
  searchItems,
} from '@/features/capsule/catalog';
import { CatalogTile } from '@/features/capsule/CatalogTile';
import { useLookDraft } from '@/features/capsule/draft';
import { parse } from '@/features/capsule/look';
import { slotOptions } from '@/features/capsule/options';
import { useGiftState } from '@/features/gifts/queries';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { BarBack, PopScale } from '@/motion';
import { GridWindow, type GridWindowHandle } from '@/motion/GridWindow';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { CAPSULE_EDIT } from '@/theme/capsuleEdit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// T's largest text size against the system's (aura/kit → MAX_FONT_SCALE).
const MAX_TEXT_SCALE = 1.3;
const RESULTS = 'results';

const KIND_NAME: Readonly<Record<CatalogKind, string>> = {
  h: tr.capsule.slotNames.h,
  e: tr.capsule.slotNames.e,
  f: tr.capsule.slotNames.f,
  m: tr.capsule.slotNames.m,
  n: tr.capsule.slotNames.n,
  c: tr.capsule.slotNames.c,
  sets: tr.capsule.setsCategory,
};

// Tüm aksesuarlar (yeni arayüz tuvali, TumAksesuarlar, TumSecili, TumTakim, TumAra, TumAraBos;
// docs/decisions/yeni-tuval.md): Kapsülünü süsle's "Tümüne bak". Every piece the person can put on,
// section after section (Baş … Renk, then the sets), under a row of category chips with their
// counts; a chip takes the list to its section and the list moves the chip. A piece on the capsule
// now wears the pink ring; a piece picked wears it and "Kapsülüne tak" (a set: "Takımı tak") comes
// up at the foot. It puts the piece on the draft Süsle shares and goes back; nothing is saved here,
// Kaydet is Süsle's alone. The search turns the bar into a field over one list of results.
export default function AccessoriesScreen() {
  useHideTabBar();
  const own = useProfile();
  const view = useProfileView(own.data?.public_id);
  const saved = view.data?.capsuleLook ?? null;
  const { scheme } = useTheme();
  const ground = { flex: 1, backgroundColor: AURA[scheme].ground } as const;
  if (view.isPending || own.isPending) {
    return (
      <View style={ground}>
        <EmptyState kind="loading" body={tr.common.loading} />
      </View>
    );
  }
  if (!saved) {
    return (
      <View style={[ground, { justifyContent: 'center', padding: SPACING[4] }]}>
        <EmptyState
          kind="error"
          body={errorMessage(view.error)}
          error={view.error}
          action={{ label: tr.common.retry, onPress: () => void view.refetch() }}
        />
      </View>
    );
  }
  return <Catalog saved={saved} />;
}

function Catalog({ saved }: { saved: string }) {
  const E = CAPSULE_EDIT;
  const C = E.catalog;
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const grid = useRef<GridWindowHandle>(null);
  const gifts = useGiftState();
  const owned = useMemo(() => new Set((gifts.data?.owned ?? []).map((o) => o.id)), [gifts.data]);
  const kept = useMemo(() => parse(saved), [saved]);
  // The draft Süsle is trying on (the saved look when it is not open).
  const draft = useLookDraft((d) => d.look);
  const setDraft = useLookDraft((d) => d.set);
  const look = draft ?? kept;
  const color = look.c;
  const sections = useMemo(
    () =>
      catalogSections({
        optionsOf: (slot) => slotOptions(slot, color, kept, owned, '').flat,
        owned,
        setName: tr.capsule.setName,
      }),
    [color, kept, owned],
  );
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<CatalogKind | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const found = useMemo(() => searchItems(sections, query), [sections, query]);
  const shown: readonly CatalogSection[] = useMemo(
    () => (searching ? [{ kind: 'h', items: found }] : sections.filter((s) => s.items.length > 0)),
    [searching, found, sections],
  );
  const itemsOf = useMemo(() => {
    const map = new Map<string, readonly CatalogItem[]>();
    for (const s of shown) map.set(searching ? RESULTS : s.kind, s.items);
    return map;
  }, [shown, searching]);
  const gridSections = useMemo(
    () =>
      shown.map((s) => ({
        key: searching ? RESULTS : s.kind,
        count: s.items.length,
        headerHeight: C.head,
      })),
    [shown, searching, C.head],
  );
  const pickedItem = useMemo(
    () => shown.flatMap((s) => s.items).find((i) => i.key === picked) ?? null,
    [shown, picked],
  );

  // The tiles: four in a row from the sides, the round at most 72 and as wide as a column when the
  // phone is narrower; the name's room grows with the text size (to the kit's largest).
  const column = (width - 2 * C.side - (C.columns - 1) * C.colGap) / C.columns;
  const side = Math.floor(Math.min(C.thumb, column));
  const nameHeight = Math.ceil(C.name * Math.min(fontScale, MAX_TEXT_SCALE));
  const rowHeight = side + C.nameGap + nameHeight;

  const pick = useCallback(
    (item: CatalogItem) => {
      haptic('selection');
      setPicked((now) => (now === item.key ? null : item.key));
    },
    [setPicked],
  );
  const renderItem = useCallback(
    (key: string, index: number) => {
      const item = itemsOf.get(key)?.[index];
      if (!item) return null;
      return (
        <CatalogTile
          item={item}
          color={color}
          side={side}
          nameHeight={nameHeight}
          ringed={item.key === picked || isWorn(item, look)}
          onPress={pick}
        />
      );
    },
    [itemsOf, color, side, nameHeight, picked, look, pick],
  );
  const renderHeader = useCallback(
    (key: string) => {
      const n = itemsOf.get(key)?.length ?? 0;
      return (
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: SPACING[2],
            paddingBottom: SPACING[1.5],
          }}
        >
          <T v="h3" ink accessibilityRole="header" lines={1} fit>
            {key === RESULTS ? tr.capsule.catalogResults : KIND_NAME[key as CatalogKind]}
          </T>
          <T v="fine" lines={1} fit>
            {tr.capsule.allCount(n)}
          </T>
        </View>
      );
    },
    [itemsOf],
  );

  const wear = () => {
    if (!pickedItem) return;
    haptic('selection');
    setDraft(putOn(pickedItem, look));
    if (router.canGoBack()) router.back();
    else router.replace('/profile/capsule');
  };
  const leaveSearch = () => {
    setSearching(false);
    setQuery('');
  };
  const total = countOf(sections);
  const none = searching && query.trim() !== '' && found.length === 0;
  const hint = searching && query.trim() === '';

  return (
    <View
      testID="catalog"
      style={{ flex: 1, backgroundColor: AURA[scheme].ground, paddingTop: insets.top }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: E.bar.row,
          gap: E.bar.gap,
          paddingHorizontal: E.barSide,
        }}
      >
        <BarBack side={KIT.size.round} onBack={searching ? leaveSearch : undefined} />
        {searching ? (
          <View style={{ flex: 1 }}>
            <SearchField
              autoFocus
              testID="catalog-search"
              value={query}
              onChangeText={setQuery}
              placeholder={tr.capsule.catalogSearchHint}
            />
          </View>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <T v="pageBarTitle" ink accessibilityRole="header" fit lines={1}>
                {tr.capsule.allTitle}
              </T>
              <T v="fine" lines={1} fit>
                {tr.capsule.allCount(total)}
              </T>
            </View>
            <Round
              side={KIT.size.round}
              icon="search"
              testID="catalog-search-open"
              label={tr.capsule.catalogSearch}
              onPress={() => setSearching(true)}
            />
          </>
        )}
      </View>
      {searching ? null : (
        <ScrollView
          horizontal
          accessibilityLabel={tr.capsule.allCategories}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            gap: C.cats.gap,
            paddingTop: C.cats.top,
            paddingBottom: C.cats.bottom,
            paddingHorizontal: C.side,
          }}
        >
          <Chip
            label={tr.capsule.allPacks}
            on={open === null}
            testID="catalog-cat-all"
            onPress={() => {
              setOpen(null);
              grid.current?.scrollToSection(shown[0]?.kind ?? 'h', true);
            }}
          />
          {sections.map((s) => (
            <Chip
              key={s.kind}
              label={tr.capsule.catLabel(KIND_NAME[s.kind], s.items.length)}
              on={open === s.kind}
              testID={`catalog-cat-${s.kind}`}
              onPress={() => {
                if (s.items.length === 0) return;
                setOpen(s.kind);
                grid.current?.scrollToSection(s.kind, true);
              }}
            />
          ))}
        </ScrollView>
      )}
      <View style={{ flex: 1 }}>
        {none ? (
          <EmptyState
            riso="search"
            title={tr.capsule.catalogNoResult}
            body={tr.capsule.catalogNoResultBody(query.trim())}
          />
        ) : total === 0 ? (
          <EmptyState kind="empty" body={tr.capsule.catalogEmpty} />
        ) : hint ? null : (
          <GridWindow
            ref={grid}
            testID="catalog-grid"
            sections={gridSections}
            columns={C.columns}
            rowHeight={rowHeight}
            gap={C.rowGap}
            paddingTop={0}
            paddingBottom={
              insets.bottom + (pickedItem ? KIT.size.btn + C.action.bottom * 2 : C.side)
            }
            paddingHorizontal={C.side}
            renderItem={renderItem}
            renderHeader={renderHeader}
            onSection={(key) => {
              if (searching) return;
              setOpen(key === shown[0]?.kind ? null : (key as CatalogKind));
            }}
          />
        )}
      </View>
      {pickedItem ? (
        <WearBar
          set={!!pickedItem.pieces}
          bottom={insets.bottom + C.action.bottom}
          onPress={wear}
        />
      ) : null}
    </View>
  );
}

// "Kapsülüne tak" at the foot (a set: its note over "Takımı tak"): it grows from 0.4 on the pop
// spring on the first piece picked and stays while another is picked (hareket 6.4; at once with
// reduced motion).
function WearBar({ set, bottom, onPress }: { set: boolean; bottom: number; onPress: () => void }) {
  return (
    <PopScale
      style={{
        position: 'absolute',
        left: CAPSULE_EDIT.catalog.side,
        right: CAPSULE_EDIT.catalog.side,
        bottom,
        gap: CAPSULE_EDIT.catalog.action.gap,
      }}
    >
      {set ? (
        <T v="fine" center>
          {tr.capsule.setNote}
        </T>
      ) : null}
      <Btn
        block

        testID="catalog-wear"
        label={set ? tr.capsule.wearSet : tr.capsule.wearSelected}
        onPress={onPress}
      />
    </PopScale>
  );
}
