import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PersonalInfo, UpdatePersonalInfo } from "@cv-maker/contracts";
import type { SaveState } from "@/components/ui";
import { getPersonalInfo, savePersonalInfo } from "@/domains/personal-info/api";

const AUTOSAVE_DELAY_MS = 1200;

export const EMPTY_PERSONAL_INFO: UpdatePersonalInfo = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  phone: "",
  postalCode: "",
  city: "",
  dateOfBirth: null,
  placeOfBirth: "",
  drivingLicence: "",
  gender: null,
  genderSelfDescribed: "",
  nationality: "",
  maritalStatus: "",
  linkedin: "",
  website: "",
  photoUrl: null,
  photoCrop: null,
};

/**
 * Owns the Personal Info step's form state + debounced (~1.2s) autosave,
 * with a `SaveStatus`-compatible `saveState` — replacing the reference
 * product's silent explicit-Save-button pattern (features/01, features/16).
 *
 * Every call to `update(patch)` merges the patch into local state
 * immediately (so inputs feel instant) and (re)starts a 1.2s debounce timer;
 * if the merged form actually differs from what's already persisted, a PUT
 * fires when the timer elapses. Rapid keystrokes just keep pushing the
 * timer back, so a fast typist produces one save, not one per keystroke.
 *
 * `saveNow(patch?)` bypasses the debounce for explicit, discrete actions
 * (e.g. the photo cropper's "Save" button) — those should feel immediate,
 * not wait out the same debounce as a stray keystroke.
 */
export function usePersonalInfoAutosave(cvId: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["personal-info", cvId] as const, [cvId]);

  const query = useQuery({
    queryKey,
    queryFn: () => getPersonalInfo(cvId),
  });

  const [form, setForm] = useState<UpdatePersonalInfo | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedSerialized = useRef<string>("");
  const debounceHandle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (form === null && query.data !== undefined) {
      const initial = query.data ?? EMPTY_PERSONAL_INFO;
      setForm(initial);
      lastSavedSerialized.current = JSON.stringify(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (input: UpdatePersonalInfo) => savePersonalInfo(cvId, input),
    onMutate: () => setSaveState("saving"),
    onSuccess: (saved: PersonalInfo) => {
      lastSavedSerialized.current = JSON.stringify(saved);
      setSaveState("saved");
      queryClient.setQueryData(queryKey, saved);
    },
    onError: () => setSaveState("error"),
  });

  const flush = useCallback(
    (next: UpdatePersonalInfo) => {
      const serialized = JSON.stringify(next);
      if (serialized !== lastSavedSerialized.current) {
        mutation.mutate(next);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cvId],
  );

  const update = useCallback(
    (patch: Partial<UpdatePersonalInfo>) => {
      setForm((prev) => {
        const next = { ...(prev ?? EMPTY_PERSONAL_INFO), ...patch };
        if (debounceHandle.current) clearTimeout(debounceHandle.current);
        debounceHandle.current = setTimeout(() => flush(next), AUTOSAVE_DELAY_MS);
        return next;
      });
    },
    [flush],
  );

  /** Save immediately, bypassing the debounce — for discrete actions like
   * confirming a cropped photo, not passive field typing. */
  const saveNow = useCallback(
    (patch: Partial<UpdatePersonalInfo>) => {
      if (debounceHandle.current) clearTimeout(debounceHandle.current);
      setForm((prev) => {
        const next = { ...(prev ?? EMPTY_PERSONAL_INFO), ...patch };
        flush(next);
        return next;
      });
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      if (debounceHandle.current) clearTimeout(debounceHandle.current);
    };
  }, []);

  return {
    form,
    update,
    saveNow,
    saveState,
    isLoading: query.isLoading || form === null,
    isError: query.isError,
  };
}
