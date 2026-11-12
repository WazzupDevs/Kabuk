import { upperTr } from '@shared/trText.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Line, Path, Pattern, Rect } from 'react-native-svg';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T } from '@/aura/kit';
import { FxMoves } from '@/components/FxSvg';
import { Loader } from '@/components/Loader';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { Tap } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { lookGround } from '@/theme/capsuleLook';
import { RISO_PAPER, TICKET } from '@/theme/profileCover';
import { ICON, SPACING } from '@/theme/tokens';

import { LivingLook } from './LivingLook';
import { profileViewKeys } from './queries';

// The ticket's outline: rounded corners, a half-round notch at the top and the bottom of the
// perforation (x = stub).
function ticketPath(x0: number, y0: number, w: number, h: number): string {
  const R = TICKET.radius;
  const r = TICKET.notch;
  const s = x0 + TICKET.stub;
  const x1 = x0 + w;
  const y1 = y0 + h;
  return [
    `M${x0 + R} ${y0}`,
    `H${s - r}`,
    `A${r} ${r} 0 0 0 ${s + r} ${y0}`,
    `H${x1 - R}`,
    `A${R} ${R} 0 0 1 ${x1} ${y0 + R}`,
    `V${y1 - R}`,
    `A${R} ${R} 0 0 1 ${x1 - R} ${y1}`,
    `H${s + r}`,
    `A${r} ${r} 0 0 0 ${s - r} ${y1}`,
    `H${x0 + R}`,
    `A${R} ${R} 0 0 1 ${x0} ${y1 - R}`,
    `V${y0 + R}`,
    `A${R} ${R} 0 0 1 ${x0 + R} ${y0}`,
    'Z',
  ].join(' ');
}

// The anonymous identity on the own profile (docs/SPEC_V4.md §4.W; rule 4: the capsule and the
// nick show here only): the capsule on its ground in the stub with "No. <the nick's end>", the
// nick, its renewal (K-9: once in 30 days) and "Kapsülünü süsle".
export function IdentityTicket({
  nick,
  look,
  refreshAt,
}: {
  nick: string;
  look: string | null;
  refreshAt: string | null;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const e = TICKET.edgeWidth / 2;
  const o = TICKET.printOffset;
  const cell = RISO_PAPER.cell;
  return (
    <View
      testID="profile-capsule"
      onLayout={(ev) => setBox({ w: ev.nativeEvent.layout.width, h: ev.nativeEvent.layout.height })}
      style={{ flexDirection: 'row', marginTop: SPACING[5], marginRight: o, marginBottom: o }}
    >
      {box.w > 0 ? (
        <Svg
          width={box.w + o}
          height={box.h + o}
          style={{ position: 'absolute', left: 0, top: 0 }}
          importantForAccessibility="no-hide-descendants"
        >
          <Defs>
            <ClipPath id="ticket">
              <Path d={ticketPath(e, e, box.w - 2 * e, box.h - 2 * e)} />
            </ClipPath>
            {/* The riso halftone on the paper (iskelet.md → 2.5). */}
            <Pattern id="ticket-tram" width={cell} height={cell} patternUnits="userSpaceOnUse">
              <Circle cx={cell / 4} cy={cell / 4} r={RISO_PAPER.dot} fill={RISO_PAPER.light.dots} />
              <Circle
                cx={(3 * cell) / 4}
                cy={(3 * cell) / 4}
                r={RISO_PAPER.dot}
                fill={RISO_PAPER.light.dots}
              />
            </Pattern>
          </Defs>
          <Path d={ticketPath(o + e, o + e, box.w - 2 * e, box.h - 2 * e)} fill={TICKET.print} />
          <Path d={ticketPath(e, e, box.w - 2 * e, box.h - 2 * e)} fill={TICKET.paper} />
          <Path d={ticketPath(e, e, box.w - 2 * e, box.h - 2 * e)} fill="url(#ticket-tram)" />
          {look ? (
            <Rect
              x={0}
              y={0}
              width={TICKET.stub}
              height={box.h}
              fill={lookGround(look)}
              clipPath="url(#ticket)"
            />
          ) : null}
          <Path
            d={ticketPath(e, e, box.w - 2 * e, box.h - 2 * e)}
            fill="none"
            stroke={TICKET.edge}
            strokeWidth={TICKET.edgeWidth}
          />
          <Line
            x1={TICKET.stub}
            y1={TICKET.notch + SPACING[1]}
            x2={TICKET.stub}
            y2={box.h - TICKET.notch - SPACING[1]}
            stroke={TICKET.edge}
            strokeWidth={TICKET.edgeWidth / 2}
            strokeDasharray={[...TICKET.dash]}
          />
        </Svg>
      ) : null}
      <View
        style={{
          width: TICKET.stub,
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING[1],
          paddingVertical: TICKET.padY,
        }}
      >
        {look ? (
          <View style={{ width: TICKET.capsule, height: TICKET.capsule }}>
            <FxMoves>
              <LivingLook
                look={look}
                size={TICKET.capsule}
                ground={false}
                accessibilityLabel={tr.profile.ownCapsule}
              />
            </FxMoves>
          </View>
        ) : null}
        <T v="stamp" color={TICKET.ink} center>
          {tr.profile.ticketNo(nick.slice(-4))}
        </T>
      </View>
      <View
        style={{
          flex: 1,
          gap: TICKET.gap,
          paddingVertical: TICKET.padY,
          paddingHorizontal: TICKET.padX,
        }}
      >
        <T v="eyebrow" color={TICKET.muted}>
          {upperTr(tr.profile.ticketKicker)}
        </T>
        <T v="h3" color={TICKET.ink} testID="nick">
          {nick}
        </T>
        <NickRefresh refreshAt={refreshAt} />
        <View style={{ marginTop: TICKET.buttonTop, alignSelf: 'flex-start' }}>
          <Btn sm label={tr.capsule.edit} onPress={() => router.push('/profile/capsule')} />
        </View>
      </View>
    </View>
  );
}

// "Yenile" while it can be renewed; "Yenile · n gün sonra" while it waits (K-9).
function NickRefresh({ refreshAt }: { refreshAt: string | null }) {
  const queryClient = useQueryClient();
  const now = useNow(60_000);
  const waitMs = refreshAt ? Date.parse(refreshAt) - now : 0;
  const waiting = waitMs > 0;
  const refresh = useMutation({
    meta: FEEL_ERROR,
    mutationFn: profileApi.refreshNick,
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileViewKeys.all }),
  });
  if (waiting) {
    return (
      <T v="fine" color={TICKET.muted}>
        {tr.profile.nickRenewIn(Math.ceil(waitMs / DAY_MS))}
      </T>
    );
  }
  return (
    <View style={{ gap: SPACING[0.5] }}>
      <Tap
        testID="nick-refresh"
        accessibilityLabel={tr.profile.nickRenew}
        accessibilityState={{ busy: refresh.isPending, disabled: refresh.isPending }}
        disabled={refresh.isPending}
        onPress={() => refresh.mutate()}
        hitSlop={SPACING[2]}
        style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[1], minHeight: ICON.md }}
      >
        {refresh.isPending ? (
          <Loader size={ICON.sm} delay={0} />
        ) : (
          <CapIcon name="refresh" color={TICKET.link} size={ICON.sm} />
        )}
        <T v="fine" color={TICKET.link}>
          {tr.profile.nickRenew}
        </T>
      </Tap>
      {refresh.isError ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(refresh.error)}
        </T>
      ) : null}
    </View>
  );
}
const DAY_MS = 24 * 60 * 60 * 1000;
