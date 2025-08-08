import * as React from "react";

export function useAutosave<T>(value: T, onSave: (val: T) => void, delay = 600) {
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => onSave(value), delay);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [value, onSave, delay]);
}
