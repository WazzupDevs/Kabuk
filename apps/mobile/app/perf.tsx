// perf/mount branch only (not merged): how long a DM's 50 bubbles take to put on the screen, with
// each part of a bubble left out in turn (scripts/e2e/perf-lab.sh reads the log lines).
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/ChatBubble';
import { ChatKindContext } from '@/components/chatKind';
import { PERF_OFF } from '@/lib/perfLab';
import { AURA } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';

const WORDS = ['h', 'Yes', 'Abo', 'Sikildik yine', 'noldu', 'Kapa ac yap guncelleme geldi', 'ggg'];
const LONG = 'Arka plan ne zaman duzelir, bir de su ekran neden kasiyor bakar misin';
const MESSAGES = Array.from({ length: 50 }, (_, i) => ({
  id: `m${i}`,
  mine: i % 3 !== 0,
  text: i % 7 === 3 ? LONG : (WORDS[i % WORDS.length] ?? 'h'),
  time: `0${i % 10}:${10 + (i % 50)}`,
  first: i % 4 === 0,
}));

const VARIANTS: string[][] = [
  [],
  ['ticks'],
  ['arrow'],
  ['golge'],
  ['swipe'],
  ['time'],
  ['ticks', 'arrow', 'golge', 'swipe'],
  ['bare'],
];
const REPS = 6;

type Run = { v: number; rep: number; t0: number };

export default function PerfScreen() {
  const { scheme } = useTheme();
  const [run, setRun] = useState<Run | null>(null);
  const gap = useRef({ last: 0, max: 0, on: false });
  const queue = useRef<{ v: number; rep: number }[]>([]);

  const next = () => {
    const item = queue.current.shift();
    if (!item) {
      console.log('PERFMOUNT done');
      return;
    }
    PERF_OFF.clear();
    for (const k of VARIANTS[item.v] ?? []) PERF_OFF.add(k);
    gap.current = { last: performance.now(), max: 0, on: true };
    const tick = () => {
      const g = gap.current;
      if (!g.on) return;
      const now = performance.now();
      g.max = Math.max(g.max, now - g.last);
      g.last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setRun({ ...item, t0: performance.now() });
  };

  useEffect(() => {
    for (let rep = 0; rep < REPS; rep++)
      for (let v = 0; v < VARIANTS.length; v++) queue.current.push({ v, rep });
    const timer = setTimeout(next, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLayout = () => {
    if (!run) return;
    const t1 = performance.now();
    const r = run;
    setTimeout(() => {
      gap.current.on = false;
      console.log(
        `PERFMOUNT ${JSON.stringify({ v: (VARIANTS[r.v] ?? []).join('+') || 'hepsi', rep: r.rep, ms: Math.round(t1 - r.t0), gap: Math.round(gap.current.max) })}`,
      );
      setRun(null);
      setTimeout(next, 500);
    }, 400);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <ChatKindContext.Provider value="dm">
        {run ? (
          <View key={`${run.v}-${run.rep}`} onLayout={onLayout} style={{ gap: 6, padding: 12 }}>
            {MESSAGES.map((m) => (
              <View key={m.id} style={{ alignSelf: m.mine ? 'flex-end' : 'flex-start' }}>
                {PERF_OFF.has('bare') ? (
                  <View style={{ padding: 10, borderRadius: 18, backgroundColor: '#FFFFFF' }}>
                    <Text>{`${m.text} ${m.time}`}</Text>
                  </View>
                ) : (
                  <ChatBubble
                    text={m.text}
                    mine={m.mine}
                    first={m.first}
                    time={m.time}
                    delivery={m.mine ? 'read' : undefined}
                    onReply={() => undefined}
                  />
                )}
              </View>
            ))}
          </View>
        ) : null}
      </ChatKindContext.Provider>
    </SafeAreaView>
  );
}
