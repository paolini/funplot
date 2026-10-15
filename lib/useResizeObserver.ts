import { useLayoutEffect, useRef } from 'react';

function useResizeObserver<T extends HTMLElement>(
  callback: (target: T, entry: ResizeObserverEntry) => void
) {
  const ref = useRef<T>(null)
  const callbackRef = useRef(callback)
  useLayoutEffect(() => { callbackRef.current = callback }, [callback])

  useLayoutEffect(() => {
    const element = ref?.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      callbackRef.current(element, entries[0]);
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return ref
}

export default useResizeObserver;