const puppeteer = require("puppeteer");
const { username, password } = require("./credentials");
const fs = require("fs");

var player = require("play-sound")((opts = {}));

let swipeCount = 0;
const filePath = "swipeInfo.json";

let swipeInfoObj = { swipes: 0, likes: 0, skipped: 0 };

let swipeInfo;

try {
  swipeInfo = JSON.parse(fs.readFileSync(filePath));
} catch (error) {
  swipeInfo = swipeInfoObj;
}

console.log("Running Tinder Bot");

(async () => {
  //set headless to false if you want to see the chrome
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--window-size=1920,1080"
      // "--no-sandbox",
      // "--disable-setuid-sandbox"
    ]
  });
  // create browser context
  const context = browser.defaultBrowserContext();
  // allow location permission for tinder.com
  await context.overridePermissions("https://tinder.com", ["geolocation"]);

  // open a new tab
  const page = await browser.newPage();
  // fix the size of window
  await page._client.send("Emulation.clearDeviceMetricsOverride");

  //open tinder
  await page.goto("https://tinder.com");

  // add your cordinates of location
  await page.setGeolocation({
    latitude: 28.588681897184927,
    longitude: 77.38302630354374
  });

  // wait for facebook login button to appear
  await page.waitForXPath(
    '(//*[@id="modal-manager"]/div/div/div/div/div[3]/div[2]/button)'
    // to get xpath right click on the element > copy > xpath
  );

  // select the login button
  const [FBLoginBtn] = await page.$x(
    '(//*[@id="modal-manager"]/div/div/div/div/div[3]/div[2]/button)'
  );

  // capture the FB login popup
  // const newPagePromise = new Promise(x =>
  //   browser.once("targetcreated", target => x(target.page()))
  // );

  const newPagePromise = new Promise(x => page.once("popup", x));
  //better way of capturing popup

  // click the login button
  await FBLoginBtn.click();
  const popup = await newPagePromise;

  // wait for email box to open
  await popup.waitForSelector("#email");

  // click on the input
  await popup.click("#email");
  // type the username/email in textfeild
  await popup.keyboard.type(username);

  // click on the password input and type password
  await popup.click("#pass");
  await popup.keyboard.type(password);

  // wait for login btn to appear and then click on it
  await popup.waitForSelector("#loginbutton");
  await popup.click("#loginbutton");

  // popup.on("close", () => {
  //   console.log("Logged in!");
  // });
  // popup.screenshot({ path: "login.png" });

  // await page.keyboard.press("Enter");

  // wait for the swipe card to appear


  setTimeout(() => {
    page.reload();
  }, 5000);
  // await page.waitForSelector("[aria-label='enable']");
  // page.click("[aria-label='enable']")
  // page.click("[aria-label='enable']")

  const checkForSwipeCard = async () => {
    try {
      await page.waitForXPath(
        '(//*[@id="content"]/div/div[1]/div/main/div[1]/div/div/div[1]/div/div[1]/div[3]/div[1]/div/div)',
        { timeout: 30000 }
      );
      swipeInfo.swipes++;
      swipeInfo.skipped = swipeInfo.swipes - swipeInfo.likes;
      fs.writeFileSync(filePath, JSON.stringify(swipeInfo), {
        flag: "w+"
      });
      // console.log("Logged into Tinder");
    } catch (err) {
      // login is failed now terminate the browser
      console.log("There is no card " + err);
      //play an audio before exiting if no card
      player.play("Wrong Buzzer.mp3", function(err) {
        if (err) throw err;
      });
      // process.exit();
    }
  };

  checkForSwipeCard();

  // return aria label of like or nope randomly
  const randomSwipeSelector = () => {
    const randomNum = Math.random() * 5;
    if (randomNum < 1) {
      return "[aria-label='Nope']";
    } else {
      return "[aria-label='Like']";
    }
  };

  // whenever the page will get a http response this will fire
  page.on("response", response => {
    //get the url of response
    const url = response.request().url();
    // regex pattern to match only https://api.gotinder.com/pass/
    const pattern = /https:\/\/api.gotinder.com\/like\/*/;

    //if it's  true then we liked it
    if (pattern.test(url)) {
      swipeInfo.likes++;
    }
  });

  // await page.screenshot({ path: "loggedin.png" });

  //now set an interval and click the like/nope button every ms

  setInterval(() => {
    page
      .click(randomSwipeSelector())
      .then(() => {
        checkForSwipeCard();
      })
      .catch(err => {
        console.log(err);
      });
  }, 1000);

  // await browser.close();
})();
