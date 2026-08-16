import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveState } from "@/components/ui";

/** Generic ~1.2s debounced-autosave hook for single-value field-editing
 * surfaces (freeform rich text, section rename, etc) — every field-editing
 * surface in the builder autosaves rather than requiring an explicit Save
 * button (features/15's biggest flagged data-loss risk). Call `setValue` on
 * every keystroke/change; saves are debounced, exposed as a `SaveState` for
 * the shared <SaveStatus/> indicator, and a `beforeunload` warning fires as a
 * backstop while a save is still in flight. */
export function useDebouncedAutosave<T>(
  initialValue: T,
  save: (value: T) => Promise<unknown>,
  delayMs = 1200,
) {
  const [value, setValueState] = useState(initialValue);
  const [state, setState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(async (v: T) => {
    setState("saving");
    try {
      await saveRef.current(v);
      setState("saved");
    } catch {
      setState("error");
    }
  }, []);

  const setValue = useCallback(
    (v: T) => {
      setValueState(v);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(v), delayMs);
    },
    [delayMs, flush],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Backstop: warn on tab close/navigate-away while a save is in flight.
  useEffect(() => {
    if (state !== "saving") return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state]);

  return { value, setValue, state };
}
