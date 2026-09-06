import { test, expect } from "@playwright/test";

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

function uniqueUser() {
  const stamp = Date.now().toString().slice(-8);
  return {
    username: `e2e${stamp}`,
    email: `e2e${stamp}@test.com`,
    password: "Test123!",
  };
}

async function registerAndLogIn(page) {
  const user = uniqueUser();

  await page.goto("/register");

  await page.getByPlaceholder("Email").fill(user.email);
  await page.getByPlaceholder("Username").fill(user.username);
  await page.getByPlaceholder("Password").fill(user.password);
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();

  await page.getByPlaceholder("Username").fill(user.username);
  await page.getByPlaceholder("Password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("heading", { name: "My Games" })).toBeVisible();

  return user;
}

test("an unknown route sends you to the login page", async ({ page }) => {
  await page.goto("/somewhere-that-does-not-exist");

  await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});

test("a new user can register and reach an empty library", async ({ page }) => {
  await registerAndLogIn(page);

  await expect(page.getByRole("link", { name: "Add Game" })).toBeVisible();
  await expect(page.locator(".gameCard")).toHaveCount(0);
});

test("a game with cover art shows up in the library", async ({ page }) => {
  await registerAndLogIn(page);

  const title = `Chrono Trigger ${Date.now().toString().slice(-5)}`;

  await page.getByRole("link", { name: "Add Game" }).click();
  await expect(page.getByRole("heading", { name: "Add Game" })).toBeVisible();

  await page.getByPlaceholder("Title").fill(title);
  await page.getByPlaceholder("Platform").fill("SNES");
  await page.getByPlaceholder("Year").fill("1995");
  await page.getByPlaceholder("Genre").fill("RPG");

  await page.locator('input[accept*="image"]').setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: PNG_1PX,
  });

  await expect(page.locator("img.artPreview")).toBeVisible();

  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("heading", { name: "My Games" })).toBeVisible();

  const card = page.locator(".gameCard", { hasText: title });
  await expect(card).toBeVisible();
  await expect(card.getByText("SNES")).toBeVisible();
  await expect(card.locator("img")).toBeVisible();
});

test("the backend refuses cover art that is not an image", async ({ page }) => {
  await registerAndLogIn(page);

  await page.getByRole("link", { name: "Add Game" }).click();

  await page.getByPlaceholder("Title").fill("Bad Art Game");
  await page.getByPlaceholder("Platform").fill("GameBoy");
  await page.getByPlaceholder("Year").fill("1996");
  await page.getByPlaceholder("Genre").fill("RPG");

  await page.locator('input[accept*="image"]').setInputFiles({
    name: "not-an-image.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("this is definitely not a png"),
  });

  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.locator(".formError")).toContainText(/unsupported art format/i);
});

test("a game can be opened and its cover art downloaded back", async ({ page }) => {
  await registerAndLogIn(page);

  const title = `Secret of Mana ${Date.now().toString().slice(-5)}`;

  await page.getByRole("link", { name: "Add Game" }).click();
  await page.getByPlaceholder("Title").fill(title);
  await page.getByPlaceholder("Platform").fill("SNES");
  await page.getByPlaceholder("Year").fill("1993");
  await page.getByPlaceholder("Genre").fill("Action RPG");

  await page.locator('input[type="file"]').first().setInputFiles({
    name: "mana.sfc",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("FAKE ROM DATA"),
  });

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "My Games" })).toBeVisible();

  await page.locator(".gameCard", { hasText: title }).click();

  await expect(page.getByRole("heading", { name: "Edit Game" })).toBeVisible();
  await expect(page.getByText("mana.sfc")).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).first().click();

  const file = await download;
  expect(file.suggestedFilename()).toBe("mana.sfc");
});
