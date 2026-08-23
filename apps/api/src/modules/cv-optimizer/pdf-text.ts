import pdfParse from "pdf-parse";
import { badRequest } from "../../errors.js";

/** Extracts plain text from an uploaded CV PDF — the "upload a CV" path's
 * equivalent of `getRenderData()` for the "pick an existing CV" path. Same
 * approach as the reference implementation this was ported from: no attempt
 * to parse the PDF into structured sections/entries (arbitrary CV layouts
 * make that unreliable), just the raw text, which the evaluation prompt
 * reads just as well as it reads a description of structured data. */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  let text: string;
  try {
    const result = await pdfParse(buffer);
    text = result.text;
  } catch {
    throw badRequest("Couldn't read this PDF. Make sure it's not corrupted or password-protected.", {
      cvFile: "unreadable",
    });
  }

  // Some PDFs embed a TrueType font with a broken glyph→Unicode mapping —
  // pdf-parse (via pdf.js) falls back to emitting a NUL character for those
  // glyphs instead of skipping them (the "TT: undefined function" warning
  // this logs is that happening). Postgres's text columns reject a NUL byte
  // outright (error 22021, "invalid byte sequence"), which surfaced as a
  // 500 on every upload of a PDF with this kind of font — strip it before
  // this string ever reaches a query.
  const cleaned = text.replace(/\u0000/g, "").trim();
  if (!cleaned) {
    throw badRequest("Couldn't find any text in this PDF — it may be a scanned image rather than a text document.", {
      cvFile: "empty",
    });
  }
  return cleaned;
}
