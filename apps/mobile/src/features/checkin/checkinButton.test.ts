import { describe, expect, it } from 'vitest';

import { checkinButton } from './checkinButton';

const idle = {
  locating: false,
  sending: false,
  sent: false,
  spotsLoading: false,
  needsSpot: false,
};

describe('checkinButton', () => {
  it('is idle and on at the start', () => {
    expect(checkinButton(idle)).toEqual({ busy: false, off: false });
  });

  it('is off until a venue with spots has its spot, then on', () => {
    expect(checkinButton({ ...idle, needsSpot: true })).toEqual({ busy: false, off: true });
    expect(checkinButton({ ...idle, spotsLoading: true })).toEqual({ busy: false, off: true });
    expect(checkinButton({ ...idle, needsSpot: false })).toEqual({ busy: false, off: false });
  });

  it('waits without a break from the position to the server to Mekan', () => {
    const steps = [
      { ...idle, locating: true },
      // The position taken, the call sent: both at once for a moment.
      { ...idle, locating: true, sending: true },
      { ...idle, locating: true, sending: true, sent: false },
      // The server took it; on the way to Mekan.
      { ...idle, locating: true, sending: false, sent: true },
      { ...idle, sent: true },
    ];
    for (const s of steps) expect(checkinButton(s)).toEqual({ busy: true, off: false });
  });

  it('turns back idle after a problem', () => {
    expect(checkinButton({ ...idle, locating: false, sending: false })).toEqual({
      busy: false,
      off: false,
    });
  });
});
