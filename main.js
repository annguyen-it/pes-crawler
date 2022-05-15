const Controller = require('./controller.js');
const Scrapper = require('./scraper.js');
const fs = require('fs');

async function run() {
  const configData = JSON.parse(fs.readFileSync('./setup.json'));
  const homeController = new Controller(configData.url);
  await homeController.start();

  const scrapper = new Scrapper(configData);
  await scrapper.init();
  if (configData.onlyDefault) {
    await homeController.page.select('.search-area-container.open > :nth-child(3) select', 'default');
  }

  for (const name of configData.names) {
    console.log(`Searching: ${ name }`);
    const input = await homeController.page.$('input[data-id="name"]');
    await input.click({ clickCount: 3 });
    await input.type(name, { delay: 50 });

    // await controller.start();

    // controller.configData;
    const p = new Promise((resolve) =>
      setTimeout(async () => {
        resolve(await scrapper.scrapeHome(homeController.page));
      }, configData.homeTimeOut));
    await p;
    // await homeController.page.screenshot({ path: `${ name }.png`, fullPage: true });

    console.log(`Done: ${ name }\n`);

    // await controller.stop();
  }

  await scrapper.finish();
  await homeController.stop();
}

run();
