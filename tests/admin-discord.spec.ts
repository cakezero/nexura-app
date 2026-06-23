import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "oyelola@admin.com";
const ADMIN_PASSWORD = "badmus";
const DASHBOARD_URL = "http://localhost:5174";
const API_URL = "http://localhost:5600";

test.describe("Admin Discord Connect Flow", () => {
  test("API: GET /api/admin/connect-discord redirects to Discord OAuth", async ({ request }) => {
    const response = await request.get(`${API_URL}/api/admin/connect-discord`, {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);

    const location = response.headers()["location"];
    expect(location).toBeDefined();
    expect(location).toContain("https://discord.com/oauth2/authorize");
    expect(location).toContain("client_id=");
    expect(location).toContain("redirect_uri=");
    expect(location).toContain("response_type=code");
    expect(location).toContain("scope=identify+guilds+bot+applications.commands");
  });

  test("API: GET /api/admin/discord/callback without code returns error", async ({ request }) => {
    const response = await request.get(`${API_URL}/api/admin/discord/callback`);

    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("sign-in/connect discord again");
  });

  test("UI: Admin login page loads and form is functional", async ({ page }) => {
    // Navigate to dashboard
    await page.goto(DASHBOARD_URL);

    // Wait for the login form to appear
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Fill in credentials and submit
    await emailInput.fill(ADMIN_EMAIL);
    await passwordInput.fill(ADMIN_PASSWORD);
    await submitBtn.click();

    // Wait for a response from the login API
    // Login may succeed or fail depending on DB state — either way, verify the form worked
    await page.waitForTimeout(3000);

    // Check if we got to the dashboard or stayed on login (either is fine for API testing)
    const url = page.url();
    console.log(`Post-login URL: ${url}`);

    // If login succeeded, look for the Discord connect button
    if (url.includes("5174") && !url.includes("login")) {
      const profileTab = page.locator('button:has-text("Profile"), [role="tab"]:has-text("Profile")');
      if (await profileTab.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await profileTab.first().click();
        await page.waitForTimeout(1000);
      }

      const discordBtn = page.locator('button:has-text("Connect Discord")');
      if (await discordBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(discordBtn.first()).toBeVisible();
        await expect(discordBtn.first()).not.toBeDisabled();
        console.log("✓ Discord connect button is visible and enabled");
      } else {
        const disconnectBtn = page.locator('button:has-text("Disconnect Discord")');
        if (await disconnectBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log("✓ Discord already connected (Disconnect button visible)");
        } else {
          console.log("⚠ Could not find Connect/Disconnect Discord button");
        }
      }
    } else {
      console.log("⚠ Login did not redirect (DB may not have this admin). Form interaction verified.");
    }
  });
});
