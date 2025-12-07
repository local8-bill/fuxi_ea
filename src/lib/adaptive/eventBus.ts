export type AdaptiveEventMap = {
  "ux_mode:set": { mode: string; step?: string };
};

type Handler<T> = (payload: T) => void;

const listeners = new Map<keyof AdaptiveEventMap, Set<Handler<any>>>();

function getListeners<E extends keyof AdaptiveEventMap>(event: E): Set<Handler<AdaptiveEventMap[E]>> {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  return listeners.get(event)!;
}

export function emitAdaptiveEvent<E extends keyof AdaptiveEventMap>(event: E, payload: AdaptiveEventMap[E]) {
  const queue = getListeners(event);
  queue.forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[adaptiveBus] handler failed", err);
    }
  });
}

export function subscribeAdaptiveEvent<E extends keyof AdaptiveEventMap>(event: E, handler: Handler<AdaptiveEventMap[E]>) {
  const queue = getListeners(event);
  queue.add(handler as Handler<any>);
  return () => queue.delete(handler as Handler<any>);
}
