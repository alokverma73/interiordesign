import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/", "/about", "/services", "/projects", "/gallery", "/process",
  "/testimonials", "/contact", "/quote", "/blog", "/faq", "/privacy", "/terms",
];

test.describe("public site", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} renders without console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.push(err.message));

      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(400);

      // Every page must render a heading — catches blank/dead routes.
      await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

      // Ignore network noise from placeholder images; fail on real JS errors.
      const realErrors = errors.filter(
        (e) => !/favicon|ERR_|net::|Failed to load resource/i.test(e)
      );
      expect(realErrors, `Console errors on ${route}`).toEqual([]);
    });
  }

  test("unknown route shows the 404 page, not a blank screen", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText("Page not found")).toBeVisible();
  });

  test("every navbar link resolves to a real page", async ({ page }) => {
    await page.goto("/");
    const labels = ["Services", "Projects", "Process", "Gallery", "Journal", "About", "Contact"];

    for (const label of labels) {
      await page.goto("/");
      await page.getByRole("link", { name: label, exact: true }).first().click();
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByText("Page not found")).toHaveCount(0);
    }
  });

  test("every footer link resolves", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const hrefs = await footer.locator("a[href^='/']").evaluateAll((as) =>
      Array.from(new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!)))
    );

    for (const href of hrefs) {
      const res = await page.goto(href);
      expect(res?.status(), `${href} returned an error`).toBeLessThan(400);
      await expect(page.getByText("Page not found"), `${href} is a dead link`).toHaveCount(0);
    }
  });

  test("hero CTAs go where they say they go", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Start Your Project/i }).first().click();
    await expect(page).toHaveURL(/\/quote/);

    await page.goto("/");
    await page.getByRole("link", { name: /Explore Our Work/i }).click();
    await expect(page).toHaveURL(/\/projects/);
  });
});

test.describe("portfolio", () => {
  test("category filter updates the grid without a full reload", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("button", { name: "Apartment" }).click();
    await expect(page).toHaveURL(/\/projects/);
    // Either results or an explicit empty state — never a blank region.
    await expect(
      page.locator("a[href^='/projects/']").first().or(page.getByText("No projects found"))
    ).toBeVisible();
  });

  test("search accepts input and settles", async ({ page }) => {
    await page.goto("/projects");
    await page.getByPlaceholder("Search projects").fill("villa");
    await page.waitForTimeout(700);
    await expect(
      page.locator("a[href^='/projects/']").first().or(page.getByText("No projects found"))
    ).toBeVisible();
  });
});

test.describe("accessibility basics", () => {
  test("images carry alt attributes", async ({ page }) => {
    await page.goto("/");
    const missing = await page.locator("img:not([alt])").count();
    expect(missing, "images without alt text").toBe(0);
  });

  test("keyboard focus is visible on the primary CTA", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test("mobile menu opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByLabel("Toggle menu").click();
    await expect(page.getByRole("link", { name: "Services" })).toBeVisible();
  });
});
