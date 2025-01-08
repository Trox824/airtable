import { shortest } from "@antiwork/shortest";

shortest("login with credentials", {
  description: "Should successfully login with credentials",
  username: "admin@admin.com",
  password: "123",
}).after(async ({ page }) => {
  await shortest("create a new base from landing page", {
    description: "Should successfully create a new base from landing page",
  });
});
