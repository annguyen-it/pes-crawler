const puppeteer = require('puppeteer');

module.exports = class Controller {
  constructor(url) {
    this.url = url;
  }

  async start() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();

    await this.page.goto(this.url);
  }

  async stop() {
    this.browser.close();
  }
};
