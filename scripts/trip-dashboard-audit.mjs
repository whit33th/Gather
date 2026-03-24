import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUTPUT_DIR = path.resolve("artifacts", "trip-dashboard-audit");

async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

async function disableSplash(context) {
  await context.addInitScript(() => {
    window.sessionStorage.setItem("gather-splash-complete", "true");
  });
}

async function signInIfNeeded(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  if (!page.url().includes("/login")) {
    return;
  }

  await page
    .getByRole("button", { name: /sign in anonymously/i })
    .evaluate((element) => element.click());
  await page.waitForTimeout(2500);
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(15000);
}

async function createTripIfNeeded(page) {
  await page.waitForTimeout(12000);

  const tripLinkCount = await page.locator('a[href^="/trip/"]').count();
  if (tripLinkCount > 0) {
    const firstTripPath = await page.locator('a[href^="/trip/"]').first().getAttribute("href");
    if (!firstTripPath) {
      throw new Error("Trip link exists but href is missing.");
    }
    await page.goto(new URL(firstTripPath, BASE_URL).toString(), {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(6000);
    return;
  }

  const createButton = page
    .getByRole("button", { name: /create your first trip|add trip/i })
    .first();
  await createButton.click();

  await page.waitForTimeout(1000);
  await page.getByLabel("Title").fill("Playwright UX Audit Trip");
  await page.getByLabel("Destination").fill("Barcelona, Spain");
  await page.getByLabel("Start").fill("2026-06-18");
  await page.getByLabel("End").fill("2026-06-24");
  await page.getByRole("button", { name: /create trip/i }).click();
  await page.waitForURL(/\/trip\/[^/]+/, { timeout: 30000 });
  await page.waitForTimeout(6000);
}

async function resolveTripUrl(page) {
  await signInIfNeeded(page);
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await createTripIfNeeded(page);

  if (/\/trip\/[^/]+/.test(page.url())) {
    await page.waitForTimeout(6000);
    return page.url();
  }

  throw new Error("No /trip/<id> link found from the home page.");
}

async function captureSurface(page, name) {
  const metrics = await page.evaluate(() => {
    const header = document.querySelector("header");
    const firstSection = document.querySelector("section");
    const h1 = document.querySelector("h1");
    const buttons = Array.from(document.querySelectorAll("button")).map((button) =>
      button.textContent?.trim() || button.getAttribute("aria-label") || ""
    );

    return {
      url: window.location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        canScrollX:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        canScrollY:
          document.documentElement.scrollHeight > document.documentElement.clientHeight,
      },
      headerRect: header?.getBoundingClientRect() || null,
      firstSectionRect: firstSection?.getBoundingClientRect() || null,
      heroHeading: h1?.textContent?.trim() || null,
      buttons: buttons.filter(Boolean).slice(0, 20),
    };
  });

  const screenshotPath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  return {
    screenshotPath,
    metrics,
  };
}

const browser = await chromium.launch({ headless: true });

try {
  await ensureOutputDir();

  const desktopContext = await browser.newContext({
    viewport: { width: 1600, height: 1024 },
  });
  await disableSplash(desktopContext);
  const desktopPage = await desktopContext.newPage();
  const tripUrl = await resolveTripUrl(desktopPage);
  await desktopPage.goto(tripUrl, { waitUntil: "networkidle" });
  const desktop = await captureSurface(desktopPage, "desktop");

  const storageState = await desktopContext.storageState();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    storageState,
  });
  await disableSplash(mobileContext);
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(tripUrl, { waitUntil: "networkidle" });
  const mobile = await captureSurface(mobilePage, "mobile");

  console.log(
    JSON.stringify(
      {
        tripUrl,
        desktop,
        mobile,
      },
      null,
      2
    )
  );

  await desktopContext.close();
  await mobileContext.close();
} finally {
  await browser.close();
}
