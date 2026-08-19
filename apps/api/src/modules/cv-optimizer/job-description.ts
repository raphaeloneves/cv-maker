import { badRequest } from "../../errors.js";

const STRIP_BLOCK_TAGS = ["script", "style", "noscript", "svg", "nav", "header", "footer", "form"];

/** Generic best-effort HTML→text extraction for a job-posting URL — no
 * external HTTP library, no site-specific selector list (unlike the
 * reference implementation this was ported from). Fetches the page once,
 * strips obviously-irrelevant tag blocks and all remaining markup, and
 * collapses whitespace. This is a heuristic, not a scraper tuned per ATS
 * platform — good enough to save the user a copy-paste, not guaranteed to
 * isolate just the JD on every layout. The one thing it deliberately does
 * NOT do is call out to Claude for this — see cv-optimizer.ts's contract
 * comment: fetching a URL, when given one, happens here, before the model
 * ever sees anything, not as a tool the model has access to. */
export async function fetchJobDescriptionText(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; CvMakerBot/1.0)" },
    });
  } catch {
    throw badRequest("Couldn't reach that job posting URL. Check the link and try again.", {
      jobDescriptionUrl: "unreachable",
    });
  }
  if (!response.ok) {
    throw badRequest(`That job posting URL returned an error (${response.status}).`, {
      jobDescriptionUrl: "unreachable",
    });
  }

  const html = await response.text();
  let stripped = html;
  for (const tag of STRIP_BLOCK_TAGS) {
    stripped = stripped.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "gi"), " ");
  }
  const text = stripped
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();

  if (text.length < 200) {
    throw badRequest(
      "Couldn't find enough text on that page to read as a job description. Try pasting the description instead.",
      { jobDescriptionUrl: "empty" },
    );
  }

  // Keep well within the prompt's variable-sanitization-disabled length —
  // truncate rather than reject an unusually long posting.
  return text.slice(0, 20_000);
}
