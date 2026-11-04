import { createContext, type ReactNode, useContext, useState } from 'react';

// Where a held message's layer (MessagePop) is drawn: the chat screen's root, outside the stream.
// Drawn inside the list's cell, its Modal changed the cell as it opened and the inverted list ran
// to its newest message (the owner's report, 4 Kasım: an old message's faces opened, the DM jumped
// to its end). Without a host (a stream outside ChatScreen), the bubble draws it itself.
type Render = (close: () => void) => ReactNode;
export type PopHost = { show: (render: Render) => void };

export const PopHostContext = createContext<PopHost | null>(null);

export function usePopHost(): PopHost | null {
  return useContext(PopHostContext);
}

// The host's state and what it draws; ChatScreen provides `host` and puts `layer` after the stream.
export function usePopHostState(): { host: PopHost; layer: ReactNode } {
  const [render, setRender] = useState<{ fn: Render } | null>(null);
  const [host] = useState<PopHost>(() => ({ show: (fn) => setRender({ fn }) }));
  const layer = render ? render.fn(() => setRender(null)) : null;
  return { host, layer };
}
