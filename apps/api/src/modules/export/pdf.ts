import { existsSync } from "node:fs";
import puppeteer from "puppeteer";

const SYSTEM_CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
];

/** In the production Docker image, Puppeteer's own bundled Chromium is
 * installed (see plan: "headless Chromium, bundled in the API Docker
 * image") and this resolves to `undefined`, letting Puppeteer use it. In
 * local dev, where that download step hasn't run, fall back to an
 * already-installed system Chrome so export works without a new
 * multi-hundred-MB download. Always overridable via
 * `PUPPETEER_EXECUTABLE_PATH`. */
function resolveExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (existsSync(puppeteer.executablePath())) return undefined;
  return SYSTEM_CHROME_CANDIDATES.find((path) => existsSync(path));
}

export interface RenderedPdf {
  buffer: Buffer;
  pageCount: number;
}

/** Counts `/Type /Page` object dictionaries in the raw PDF bytes (excluding
 * `/Type /Pages`, the tree-node object) — a cheap, dependency-free way to
 * report `X-Page-Count` without a full PDF parser. */
function countPages(pdf: Uint8Array): number {
  const text = Buffer.from(pdf).toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?!s)/g);
  return matches ? matches.length : 1;
}

export async function renderHtmlToPdf(html: string): Promise<RenderedPdf> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveExecutablePath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return { buffer: Buffer.from(pdf), pageCount: countPages(pdf) };
  } finally {
    await browser.close();
  }
}
