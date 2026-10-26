import { test, expect } from "@playwright/test";
import { locales, localeNames, translate } from "../../src/lib/i18n/messages";
test("native components browse, sign in, preserve form entries and post with a bearer credential", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let submitted: any;
  const user = {
    id: "native-ui-citizen",
    name: "UI Test Citizen",
    email: "citizen@example.test",
    role: "CITIZEN",
    bio: "",
    skills: [],
    interests: [],
  };
  const problem = {
    id: "native-ui-report",
    title: "A broken footpath beside the school",
    description:
      "The broken path affects students and older residents every day and needs safe repairs.",
    category: "Infrastructure",
    status: "REPORTED",
    city: "Pune",
    state: "Maharashtra",
    area: "School lane",
    population: 100,
    images: [],
    comments: [],
    proposals: [],
  };
  await page.route("https://civicbridge.example.test/api/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    let body: any = {};
    if (path === "/api/mobile/session")
      body = {
        token: "cbm_" + "a".repeat(43),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        user,
      };
    else if (path === "/api/dashboard")
      body = { user, problems: submitted ? [problem] : [], proposals: [] };
    else if (path === "/api/platform/problems" && request.method() === "POST") {
      expect(request.headers().authorization).toBe("Bearer cbm_" + "a".repeat(43));
      submitted = request.postDataJSON();
      body = { ...problem, ...submitted };
    } else if (path === "/api/platform/problems")
      body = { items: [{ ...problem, status: "OPEN" }], total: 1, pages: 1 };
    else if (path.startsWith("/api/platform/problems/")) body = { ...problem, ...submitted };
    else if (path === "/api/platform/proposals") body = [];
    await route.fulfill({ status: 200, json: body, headers });
  });
  await page.goto("/");
  await expect(page.getByText("Community", { exact: true })).toBeVisible();
  await expect(page.getByText(problem.title, { exact: true })).toBeVisible();
  let currentLocale: (typeof locales)[number] = "en";
  for (const locale of locales) {
    await page
      .getByRole("button", { name: translate("Choose language", currentLocale), exact: true })
      .click();
    await page.getByRole("button", { name: localeNames[locale], exact: true }).click();
    await expect(page.getByText(translate("Community", locale), { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 320, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      locale,
    ).toBe(true);
    currentLocale = locale;
  }
  await page
    .getByRole("button", { name: translate("Choose language", currentLocale), exact: true })
    .click();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/native/native-home.png" });
  await page.getByRole("button", { name: "Post a problem", exact: true }).click();
  await page.getByLabel("Email address", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("NativeTesting@2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/activity$/);
  await page.goBack();
  await page.getByRole("button", { name: "Post a problem", exact: true }).click();
  await page.getByLabel("Problem title", { exact: true }).fill(problem.title);
  await page.getByLabel("What’s happening?", { exact: true }).fill(problem.description);
  await page.getByRole("button", { name: "Choose language", exact: true }).click();
  await page.getByRole("button", { name: "हिन्दी", exact: true }).click();
  await expect(page.getByLabel(translate("Problem title", "hi"), { exact: true })).toHaveValue(
    problem.title,
  );
  await page.getByRole("button", { name: translate("Choose language", "hi"), exact: true }).click();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("State / union territory", { exact: true }).fill("Maharashtra");
  await page.getByLabel("City / village", { exact: true }).fill("Pune");
  await page.getByLabel("Area / locality", { exact: true }).fill("School lane");
  await page.getByLabel("Latitude", { exact: true }).fill("18.52");
  await page.getByLabel("Longitude", { exact: true }).fill("73.85");
  await page.getByRole("button", { name: "Back", exact: true }).last().click();
  await expect(page.getByLabel("Problem title", { exact: true })).toHaveValue(problem.title);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("City / village", { exact: true })).toHaveValue("Pune");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.screenshot({ path: "test-results/native/native-review.png" });
  await page.getByRole("button", { name: "Submit report", exact: true }).click();
  await expect(page).toHaveURL(/\/problems\/native-ui-report$/);
  expect(submitted).toMatchObject({
    category: "Infrastructure",
    city: "Pune",
    latitude: 18.52,
    longitude: 73.85,
    imageIds: [],
  });
  expect(errors).toEqual([]);
});
