const Controller = require('./controller.js');
const ExcelJS = require('exceljs');

module.exports = class Scrapper {
  constructor(configData) {
    this.configData = configData;
    this.rowIndex = 2;
  }

  async init() {
    this.workbook = new ExcelJS.Workbook();
    this.workSheet = this.workbook.addWorksheet('Data', {
      views: [{
        state: 'frozen',
        ySplit: 1
      }]
    });
  }

  async finish() {
    this.addColumnTitle();
    this.configWidth();

    await this.workbook.xlsx.writeFile('output.xlsx');
    console.log('\nDone!');
  }

  async scrapeHome(page) {
    const rows = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("#search-result-table .namelink"))
        .map(x => ({ href: x.href, name: x.textContent }));
    });

    console.log(`Founded ${ rows.length } result(s)`);

    for (const row of rows) {
      console.log(`\tDetails: ${ row.name }`);
      const detailsUrl = this.configData.url + row.href;
      await this.scrapeDetails(detailsUrl);
    }
  }

  async scrapeDetails(url) {
    const controller = new Controller(url);
    await controller.start();

    await controller.page.click('#levelIndicatorMax');

    const data = await controller.page.evaluate((configData, url) => {
      // console.log(document);
      const infoFields = Array.from(document.querySelectorAll('.player-info > tbody > tr'));
      const info = {};

      infoFields.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (Object.keys(configData.information).includes(cells[0]?.textContent)) {
          const prop = configData.information[cells[0].textContent];
          const value = prop === 'position' ? cells[1].textContent.split(' ')[0] : cells[1].textContent;
          info[prop] = prop === 'age' ? +value : value;
        }
      });

      const container = document.querySelector('.hexagon-positions-container');

      return ({
        name: document.querySelector('.ovr + *').textContent,
        lwf: +container.querySelector('.player-positions-row:nth-child(1) > *:not(.fw-0):nth-child(1) .stat')?.textContent,
        ss: +container.querySelector('.player-positions-row:nth-child(1) > *:not(.fw-0):nth-child(2) .stat')?.textContent,
        cf: +container.querySelector('.player-positions-row:nth-child(1) > *:not(.fw-0):nth-child(3) .stat')?.textContent,
        rwf: +container.querySelector('.player-positions-row:nth-child(1) > *:not(.fw-0):nth-child(4) .stat')?.textContent,
        lmf: +container.querySelector('.player-positions-row:nth-child(2) > *:not(.mf-0):nth-child(1) .stat')?.textContent,
        dmf: +container.querySelector('.player-positions-row:nth-child(2) > *:not(.mf-0):nth-child(2) .stat')?.textContent,
        cmf: +container.querySelector('.player-positions-row:nth-child(2) > *:not(.mf-0):nth-child(3) .stat')?.textContent,
        amf: +container.querySelector('.player-positions-row:nth-child(2) > *:not(.mf-0):nth-child(4) .stat')?.textContent,
        rmf: +container.querySelector('.player-positions-row:nth-child(2) > *:not(.mf-0):nth-child(5) .stat')?.textContent,
        lb: +container.querySelector('.player-positions-row:nth-child(3) > *:not(.df-0):nth-child(1) .stat')?.textContent,
        cb: +container.querySelector('.player-positions-row:nth-child(3) > *:not(.df-0):nth-child(2) .stat')?.textContent,
        rb: +container.querySelector('.player-positions-row:nth-child(3) > *:not(.df-0):nth-child(3) .stat')?.textContent,
        gk: +container.querySelector('.player-positions-row:nth-child(4) > *:not(.gk-0):nth-child(1) .stat')?.textContent,
        url,
        ...info
      });
    }, this.configData, url);

    const row = this.workSheet.getRow(this.rowIndex);

    Object.entries(data).forEach(([key, value]) => {
      const column = this.configData.excelColumns[key];
      const cell = row.getCell(column);
      if (this.shouldAlignCenter(value)) {
        cell.alignment = { 'horizontal': 'center' };
      }
      cell.value = value || '';
    });

    this.rowIndex++;

    await controller.stop();
  }

  addColumnTitle() {
    const row = this.workSheet.getRow(1);
    Object.entries(this.configData.excelColumns).forEach(([key, value]) => {
      const cell = row.getCell(value);
      let field = key
        .replace(/((?<!^)[A-Z](?![A-Z]))(?=\S)/g, ' $1')
        .replace(/^./, s => s.toUpperCase());
      if (2 <= value && value <= 14) {
        field = field.toUpperCase();
      }
      cell.value = field;
    });
  }

  shouldAlignCenter(column) {
    return (2 <= column && column <= 14) || column === 16 || column === 17;
  }

  configWidth() {
    Object.values(this.configData.excelColumns).forEach((value) => {
      const column = this.workSheet.getColumn(value);
      if (1 === value) {
        column.width = 17.2;
      }
      else if (2 <= value && value <= 14) {
        column.width = 5.8;
      }
      else if (15 === value) {
        column.width = 25;
      }
      else if (16 === value) {
        column.width = 3.8;
      }
      else if (17 === value) {
        column.width = 8;
      }
      else if (18 === value) {
        column.width = 14.5;
      }
      else if (19 === value) {
        column.width = 20;
      }
      if (this.shouldAlignCenter(value)) {
        column.alignment = { 'horizontal': 'center' };
      }
    });
  }
};
