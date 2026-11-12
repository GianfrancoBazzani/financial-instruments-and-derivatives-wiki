import { expect, test, type Locator, type Page } from "@playwright/test";
import { pages } from "../../site/pages";

const paths = ["/", ...pages.map((p) => `/${p.slug}/`)];
const themes = ["dark", "light"] as const;

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

/** Scrolls to the end in steps so every `client:visible` island hydrates, then back to the top. */
async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 600) await page.mouse.wheel(0, 600);
  await page.evaluate(() => window.scrollTo(0, 0));
}

const figure = (page: Page, name: string) => page.locator(`figure[data-grafico="${name}"]`);

/** Hydrated slider: the React `change` handler is attached once the island hydrated. */
async function moveFirstSlider(fig: Locator) {
  await fig.scrollIntoViewIfNeeded();
  const readouts = fig.locator("dd");
  const before = await readouts.allTextContents();
  const slider = fig.locator('input[type="range"]').first();
  const startValue = await slider.inputValue();
  await slider.focus();
  // Retry until the island is hydrated: a keypress before hydration moves the slider but not the read-outs.
  await expect(async () => {
    await slider.press("ArrowRight");
    expect(await slider.inputValue()).not.toBe(startValue);
    expect(await readouts.allTextContents()).not.toEqual(before);
  }).toPass();
}

for (const theme of themes) {
  test.describe(`360 px, ${theme} theme`, () => {
    test.use({ viewport: { width: 360, height: 740 } });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("starlight-theme", t), theme);
    });
    for (const path of paths) {
      test(`no horizontal page scroll on ${path}`, async ({ page }) => {
        await page.goto(path);
        await settle(page);
        await scrollThrough(page);
        await settle(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
      });
    }
  });
}

test("PriceYield responds to the keyboard on /renta-fija/", async ({ page }) => {
  await page.goto("/renta-fija/");
  const fig = figure(page, "PriceYield");
  const precio = fig.locator('[data-lectura="Precio"] dd');
  await fig.scrollIntoViewIfNeeded();
  const before = await precio.textContent();
  const slider = fig.locator('input[type="range"]').first();
  await slider.focus();
  await expect(async () => {
    await slider.press("ArrowRight");
    expect(await precio.textContent()).not.toBe(before);
  }).toPass();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("PriceYield svg is visible", async ({ page }) => {
    await page.goto("/renta-fija/");
    await expect(figure(page, "PriceYield").locator("svg").first()).toBeVisible();
  });
});

test.describe("theme", () => {
  test.use({ colorScheme: "light" });
  test("dark is the default and the reader's choice persists", async ({ page }) => {
    await page.goto("/renta-fija/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.locator("starlight-theme-select select:visible").selectOption("light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});

test("formulas: KaTeX sizing matches its stylesheet", async ({ page }) => {
  await page.goto("/renta-fija/");
  await settle(page);
  const small = page.locator(".katex .sizing.reset-size6.size3").first();
  await expect(small).toBeAttached();
  const sizes = await small.evaluate((el) => ({
    inner: parseFloat(getComputedStyle(el).fontSize),
    outer: parseFloat(getComputedStyle(el.closest(".katex")!).fontSize),
  }));
  expect(sizes.inner).toBeCloseTo(0.7 * sizes.outer, 1);
  expect(await page.locator(".katex-display").count()).toBeGreaterThan(0);
});

test("no console error and no hydration warning", async ({ page }) => {
  test.setTimeout(120_000);
  for (const path of paths) {
    const problems: string[] = [];
    const onConsole = (m: import("@playwright/test").ConsoleMessage) => {
      if (m.type() === "error" || /hydrat/i.test(m.text())) problems.push(`${m.type()}: ${m.text()}`);
    };
    const onError = (e: Error) => problems.push(`pageerror: ${e.message}`);
    page.on("console", onConsole);
    page.on("pageerror", onError);
    await page.goto(path);
    await settle(page);
    await scrollThrough(page);
    await settle(page);
    page.off("console", onConsole);
    page.off("pageerror", onError);
    expect(problems, path).toEqual([]);
  }
});

for (const p of pages.filter((p) => p.graphics.length > 0)) {
  test(`first graphic of /${p.slug}/ (${p.graphics[0]}) responds to the keyboard`, async ({ page }) => {
    await page.goto(`/${p.slug}/`);
    await moveFirstSlider(figure(page, p.graphics[0]));
  });
}
