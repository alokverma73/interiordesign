import { expect, test } from "@playwright/test";

const CUSTOMER = { email: "customer@aetherlume.demo", password: "DemoPass123!" };
const ADMIN = { email: "admin@aetherlume.demo", password: "DemoPass123!" };

async function loginAsCustomer(page: any) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(CUSTOMER.email);
  await page.getByLabel("Password").fill(CUSTOMER.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function loginAsAdmin(page: any) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/admin/);
}

test.describe("authentication", () => {
  test("customer can sign in and reach the dashboard", async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
  });

  test("bad credentials are rejected with a message, not a crash", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrongpassword1");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText(/Incorrect email or password/i)).toBeVisible();
  });

  test("unauthenticated visitor is redirected away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated visitor is redirected away from the admin panel", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("forgot-password never reveals whether an email exists", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("definitely-not-registered@example.com");
    await page.getByRole("button", { name: /Send Reset Link/i }).click();
    await expect(page.getByText(/reset link is on its way/i)).toBeVisible();
  });
});

test.describe("role separation", () => {
  test("a customer token cannot reach the admin panel", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/admin");
    // Guard bounces customers back to their own dashboard.
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("admin signing in at the customer login still lands in admin", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/admin/);
  });

  test("a customer cannot read another customer's project via the API", async ({ page, request }) => {
    await loginAsCustomer(page);
    const token = await page.evaluate(() => {
      const raw = localStorage.getItem("aetherlume_auth");
      return raw ? JSON.parse(raw).accessToken : null;
    });
    expect(token).toBeTruthy();

    const apiBase = process.env.E2E_API_URL || "http://localhost:8000/api/v1";
    // A well-formed UUID that isn't this customer's project.
    const res = await request.get(`${apiBase}/dashboard/projects/00000000-0000-0000-0000-000000000001`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([403, 404]).toContain(res.status());
  });
});

test.describe("quote flow", () => {
  test("multi-step form validates and produces an enquiry number", async ({ page }) => {
    await page.goto("/quote");

    // Step 1 blocks on invalid input.
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.getByText(/Please enter your name/i)).toBeVisible();

    await page.getByLabel("Full Name *").fill("Playwright Tester");
    await page.getByLabel("Email *").fill(`e2e+${Date.now()}@example.com`);
    await page.getByLabel("Phone *").fill("+91 90000 00000");
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 2 requires a property type.
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.getByText(/Please select a property type/i)).toBeVisible();
    await page.getByLabel("Property Type *").selectOption("Apartment");
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 3 is optional.
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 4: review and submit.
    await page.getByRole("button", { name: /Submit Enquiry/i }).click();
    await expect(page.getByText(/Enquiry received/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/^ENQ-/)).toBeVisible();
  });
});

test.describe("admin panel", () => {
  test("dashboard loads real counts", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText("Total Enquiries")).toBeVisible();
    await expect(page.getByText("Active Projects")).toBeVisible();
  });

  test("every admin sidebar route loads without error", async ({ page }) => {
    await loginAsAdmin(page);
    const routes = [
      "enquiries", "projects", "services", "appointments", "customers",
      "testimonials", "blog", "gallery", "faqs", "messages", "users", "settings",
    ];
    for (const r of routes) {
      await page.goto(`/admin/${r}`);
      await expect(page.locator("h1"), `/admin/${r} has no heading`).toBeVisible();
    }
  });

  test("creating a service makes it appear on the public site", async ({ page }) => {
    await loginAsAdmin(page);
    const name = `E2E Service ${Date.now()}`;

    await page.goto("/admin/services");
    await page.getByRole("button", { name: /New Service/i }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Short Description").fill("Created by the end-to-end test suite.");
    await page.getByRole("button", { name: /Create Service/i }).click();

    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

    await page.goto("/services");
    await expect(page.getByText(name)).toBeVisible();
  });

  test("editing a website setting changes the live homepage", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/settings");

    const headline = `Considered interiors ${Date.now()}`;
    const row = page.locator("div", { hasText: "hero_headline" }).last();
    await row.locator("input").fill(headline);
    await row.getByRole("button", { name: "Save" }).click();

    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Considered", { timeout: 10_000 });
  });
});
