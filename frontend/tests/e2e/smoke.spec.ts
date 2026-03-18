import { expect, test } from "@playwright/test";

test("quickstart runs first successful call", async ({ page }) => {
  await page.goto("/quickstart");

  await page.getByTestId("quickstart-run").click();

  await expect(page.getByText("Status: 200")).toBeVisible();
  await expect(page.getByText('"status": "success"')).toBeVisible();
});

test("catalog search to endpoint playground run", async ({ page }) => {
  await page.goto("/apis");

  await page.getByLabel("Search endpoints").fill("lead enrichment");
  await page.getByRole("link", { name: "Open endpoint" }).first().click();

  await page.getByTestId("run-playground").click();

  await expect(page.getByText("200 •")).toBeVisible();
  await expect(
    page.getByTestId("playground-response").getByText('"status": "success"'),
  ).toBeVisible();
});

test("dashboard navigation works on mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Developer Console" })).toBeVisible();
  await page.getByRole("link", { name: "API Keys" }).click();
  await expect(page.getByRole("heading", { name: "API Keys" })).toBeVisible();

  await page.getByRole("link", { name: "Logs" }).click();
  await expect(page.getByRole("heading", { name: "Execution Logs" })).toBeVisible();

  await page.getByRole("link", { name: "Billing" }).click();
  await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
});
