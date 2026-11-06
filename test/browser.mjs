// The ArticleComposer, checked in a real browser at phone width.
//
//   pnpm run demo && node test/browser.mjs
//
// A person writing on a phone needs: a microphone in the title and in the text,
// 16px text (iOS zooms below it), thumb-sized controls, nothing scrolling
// sideways at 320px, one primary action, writing help that keeps their text
// when it fails, a draft that survives a reload, and a publish that says what
// is wrong instead of failing silently.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};
const server = createServer(async (req, res) => {
  const path = normalize(
    join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)),
  );
  if (!path.startsWith(root)) return res.writeHead(403).end();
  try {
    const body = await readFile(path);
    res
      .writeHead(200, {
        "content-type": types[extname(path)] ?? "application/octet-stream",
      })
      .end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const base = `http://localhost:${server.address().port}/demo/composer.html`;

let failures = 0;
const check = (ok, what) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${what}`);
  if (!ok) failures++;
};

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
try {
  for (const [name, width, dark] of [
    ["phone", 390, false],
    ["narrow", 320, true],
    ["desktop", 1280, false],
  ]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    if (dark)
      await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForSelector(".wk-composer");
    // Put text in so Improve and the buttons are all on screen.
    await page
      .locator("textarea.ck-field-input")
      .first()
      .fill("A body of text that is long enough to improve.");
    await page.locator("input.ck-field-input").first().fill("A title");
    const m = await page.evaluate(() => {
      const small = [
        ...document.querySelectorAll(
          ".wk-tab, .wk-tool, .wk-btn, .ck-icon-btn, .ck-field-improve",
        ),
      ]
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width > 0 && (r.width < 44 || r.height < 44)).length;
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        mics: document.querySelectorAll(".ck-field .ck-mic").length,
        fontMin: Math.min(
          ...[...document.querySelectorAll(".ck-field-input")].map((e) =>
            parseFloat(getComputedStyle(e).fontSize),
          ),
        ),
        small,
        primaries: document.querySelectorAll(".wk-btn-primary").length,
        improves: document.querySelectorAll(".ck-field-improve").length,
        tools: [...document.querySelectorAll(".wk-tools .wk-tool")].map(
          (b) => b.textContent,
        ),
        toolsEven: new Set(
          [...document.querySelectorAll(".wk-tools .wk-tool")].map((b) =>
            Math.round(b.getBoundingClientRect().width),
          ),
        ).size,
      };
    });
    check(
      m.overflow <= 0,
      `${name}: no horizontal scroll (${m.overflow}px over)`,
    );
    check(
      m.mics === 2,
      `${name}: a microphone in the title and the text (${m.mics})`,
    );
    check(m.fontMin >= 16, `${name}: field text >= 16px (${m.fontMin}px)`);
    check(m.small === 0, `${name}: every control >= 44px (${m.small} smaller)`);
    check(
      m.primaries === 1,
      `${name}: exactly one primary action (${m.primaries})`,
    );
    check(
      m.improves === 2,
      `${name}: writing help on the title and the text (${m.improves})`,
    );
    check(m.toolsEven === 1, `${name}: the tools are equal cells (${m.tools})`);
    check(errors.length === 0, `${name}: no page errors ${errors.join(" | ")}`);
    await page.close();
  }

  // ── write, tools, writing help, undo ─────────────────────────────────────
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 900 },
    });
    await page.goto(base);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const body = page.locator("textarea.ck-field-input").first();
    const title = page.locator("input.ck-field-input").first();
    await body.fill("First paragraph.");
    await body.evaluate((el) =>
      el.setSelectionRange(el.value.length, el.value.length),
    );

    await page.getByRole("button", { name: "Photo", exact: true }).click();
    await page.getByRole("button", { name: "Use the dam photo" }).click();
    check(
      (await body.inputValue()).includes(
        '![A dam](https://example.org/dam.jpg "A dam — Ann, CC BY")',
      ),
      "photo: lands as a figure with its credit, on its own paragraph",
    );
    await page.getByRole("button", { name: "Chart", exact: true }).click();
    await page.getByRole("button", { name: "Insert the chart block" }).click();
    check(
      (await body.inputValue()).includes("```chart"),
      "chart: the block lands in the text",
    );

    await page.getByRole("button", { name: "Bold", exact: true }).click();
    check(
      (await body.inputValue()).includes("**bold**"),
      "format: bold wraps a placeholder",
    );

    await body.fill("Original text that is long enough.");
    await page
      .locator(".wk-body")
      .getByRole("button", { name: "Improve" })
      .click();
    await page.getByRole("button", { name: "Make it tighter" }).click();
    await page
      .waitForFunction(
        () =>
          document
            .querySelector("textarea.ck-field-input")
            .value.includes("[Make it tighter]"),
        null,
        { timeout: 5000 },
      )
      .catch(() => {});
    check(
      (await body.inputValue()) ===
        "Original text that is long enough. [Make it tighter]",
      "improve: one tap on a suggestion rewrites the text",
    );
    await page
      .locator(".wk-body")
      .getByRole("button", { name: "Undo" })
      .click();
    check(
      (await body.inputValue()) === "Original text that is long enough.",
      "improve: Undo restores the text",
    );

    // The brief becomes an article; Undo brings the writer's own text back.
    await title.fill("Mine");
    await page.getByRole("button", { name: "Speak", exact: true }).click();
    await page
      .getByLabel("What should it say?")
      .fill("an angry piece about floods");
    await page
      .getByRole("button", { name: "Write the article from this" })
      .click();
    await page
      .waitForFunction(
        () =>
          document
            .querySelector("textarea.ck-field-input")
            .value.startsWith("Drafted from"),
        null,
        { timeout: 5000 },
      )
      .catch(() => {});
    check(
      (await title.inputValue()) === "Drafted title",
      "speak: the brief becomes a titled article",
    );
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    check(
      (await body.inputValue()) === "Original text that is long enough." &&
        (await title.inputValue()) === "Mine",
      "speak: Undo brings back both title and text",
    );

    // Preview shows what readers will see.
    await page.getByRole("tab", { name: "Preview" }).click();
    check(
      (await page.locator(".wk-preview").innerText()).includes("Original text"),
      "preview: shows the article",
    );
    await page.getByRole("tab", { name: "Write" }).click();

    // The draft survives a reload.
    await page.waitForTimeout(900);
    await page.reload();
    await page.waitForSelector("textarea.ck-field-input");
    await page
      .waitForFunction(
        () =>
          document.querySelector("textarea.ck-field-input").value.length > 0,
        null,
        { timeout: 3000 },
      )
      .catch(() => {});
    check(
      (await page.locator("textarea.ck-field-input").first().inputValue()) ===
        "Original text that is long enough.",
      "draft: kept on the device and restored after a reload",
    );
    await page.close();
  }

  // ── publish: problems are said, a network failure is said, success clears ─
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 900 },
    });
    await page.goto(base);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const body = page.locator("textarea.ck-field-input").first();
    const title = page.locator("input.ck-field-input").first();
    const publish = page.getByRole("button", { name: "Publish", exact: true });
    check(
      await publish.isDisabled(),
      "publish: disabled until there is a title and a text",
    );
    await title.fill("T");
    await body.fill("short");
    await publish.click();
    await page.locator('[role="alert"]').waitFor({ timeout: 3000 });
    check(
      (await page.locator('[role="alert"]').innerText()).includes("too short"),
      "publish: the app’s problem is shown",
    );
    check(
      (await body.inputValue()) === "short",
      "publish: the text is kept after a problem",
    );
    await body.fill("boom goes the network");
    await publish.click();
    await page
      .waitForFunction(
        () =>
          document
            .querySelector('[role="alert"]')
            ?.textContent.includes("connection"),
        null,
        { timeout: 3000 },
      )
      .catch(() => {});
    check(
      (await page.locator('[role="alert"]').innerText()).includes("connection"),
      "publish: a network failure is said in words",
    );
    await body.fill("A real article.");
    await body.press("Control+Enter");
    await page
      .waitForFunction(() => window.published.length === 1, null, {
        timeout: 3000,
      })
      .catch(() => {});
    const sent = await page.evaluate(() => window.published);
    check(
      sent.length === 1 &&
        sent[0].status === "published" &&
        sent[0].title === "T",
      "publish: Ctrl+Enter publishes",
    );
    await page.getByRole("button", { name: "Save as draft" }).click();
    await page
      .waitForFunction(() => window.published.length === 2, null, {
        timeout: 3000,
      })
      .catch(() => {});
    check(
      (await page.evaluate(() => window.published[1])).status === "draft",
      "publish: Save as draft stores a draft",
    );
    await page.close();
  }

  // ── signed out: write freely, one way forward ────────────────────────────
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 900 },
    });
    await page.goto(base + "?anon");
    const text = await page.locator(".wk-composer").innerText();
    check(
      text.includes("Sign in to publish") && !text.includes("Save as draft"),
      "signed out: the one action is to sign in",
    );
    check(
      (await page.locator(".ck-field-improve").count()) === 0,
      "signed out: no writing-help button that cannot work",
    );
    await page.getByRole("button", { name: "Speak", exact: true }).click();
    check(
      (await page
        .getByRole("link", { name: /Sign in to have the article written/ })
        .getAttribute("href")) === "/sign-in",
      "signed out: the speak panel shows the way to sign in",
    );
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("all composer checks passed");
