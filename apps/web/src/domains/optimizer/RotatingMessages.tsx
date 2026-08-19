import { useEffect, useRef, useState } from "react";
import { clsx } from "@/components/ui";

const FADE_MS = 400;

interface RotatingMessagesProps {
  messages: string[];
  /** How long each message stays fully visible before fading to the next. */
  intervalMs?: number;
  className?: string;
}

/** A single line that cycles through `messages`, fading out and back in
 * between each — the same idea as the reference app's rotating status copy
 * during CV Optimizer generation, adapted to this app's own voice: specific
 * to what the evaluation is actually doing (checking the six objections,
 * the RAT framework, and so on — see llm.ts's SYSTEM_PROMPT), not generic
 * "optimizing your future" filler. Loops for as long as it's mounted; the
 * parent only renders this while the real wait is happening, so there's no
 * separate start/stop state to manage here. */
export function RotatingMessages({ messages, intervalMs = 3000, className }: RotatingMessagesProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const fadeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (messages.length <= 1) return;
    const cycle = setInterval(() => {
      setVisible(false);
      fadeTimeout.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setVisible(true);
      }, FADE_MS);
    }, intervalMs);
    return () => {
      clearInterval(cycle);
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    };
  }, [messages.length, intervalMs]);

  return (
    <p
      className={clsx("min-h-[2.5em] transition-opacity ease-standard", visible ? "opacity-100" : "opacity-0", className)}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      aria-live="polite"
    >
      {messages[index]}
    </p>
  );
}
