const puppeteer = require("puppeteer");
const prompts = require("prompts");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--window-size=1920,1080"]
  });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions("https://tinder.com", ["geolocation"]);

  const page = await browser.newPage();
  await page._client.send("Emulation.clearDeviceMetricsOverride");
  await page.goto("https://tinder.com");
  await page.setGeolocation({ latitude: 28.649944, longitude: 77.0997011 });

  await page.waitForSelector('[aria-label="Log in with phone number"]');


  await page.click('[aria-label="Log in with phone number"]');
  await page.waitForSelector('[name="phone_number"]');
  await page.type('[name="phone_number"]', "998880880");
  await page.keyboard.press("Enter");

  const otp = await prompts({
    type: "text",
    name: "value",
    message: "Type your OTP"
  });
  console.log(otp.value);
  await page.waitForSelector(
    '[aria-describedby="codeVerificationErrorMessage"]'
  );
  await page.keyboard.type(otp.value);
  await page.keyboard.press("Enter");

  await page.waitForSelector('[aria-label="Like"]');
  setInterval(() => {
    page
      .click('[aria-label="Like"]')
      .then(console.log("swiped"))
      .catch(err => {
        console.log(err);
      });
  }, 300);
  await page.screenshot({ path: "example.png" });

  // await browser.close();
})();
