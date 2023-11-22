// import { readBlockConfig } from '../../scripts/aem.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // const cfg = readBlockConfig(block);
  block.innerHTML = '';

  // retrieve OKR data
  const okrs = new URL(`${window.location.protocol}//${window.location.host}/okrs.json`);

  fetch(okrs, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json()).then((data) => {
    let output = '';
    // output = '<button>Add</button>';
    data.OKRs.data.forEach((element) => {
      // prepare subset of metrics data for the current objective in the loop
      const objArray = [];
      data.Metrics.data.forEach((metric) => {
        if (element.Objective === metric.Objective) {
          const obj = {};
          obj.Who = metric.Who;
          obj.Date = metric.Date;
          obj.Summary = metric.Summary;
          obj.Notes = metric.Notes;
          objArray.push(obj);
        }
      });

      // objective header
      const percent = (objArray.length * 100) / element['FY24 Target'];
      output += `
        <hr>
        <div class=objective>${element.Objective}</div>
        <div class=desc>${element.KR}</div>
        <div class=desc>${objArray.length} of ${element['FY24 Target']}</div>
        <div class='progressborder'>
            <div class='progressbar' style='width: ${percent}%'></div>
        </div>
      `;

      output += '<div class=container>';
      let headerDrawn = false;
      let i = 0;
      let row = '';
      objArray.forEach((metric) => {
        // only draw header row once
        if (!headerDrawn) {
          Object.keys(metric).forEach((field) => {
            output += `<div class=header>${field}</div>`;
          });
          headerDrawn = true;
        }

        // used for table highlights
        if (i % 2 === 0) {
          row = '';
        } else {
          row = ' odd';
        }
        i += 1;

        // display metrics data
        Object.values(metric).forEach((value) => {
          output += `<div class='item${row}'>${value}</div>`;
        });
      });
      output += '</div>';
    });

    output += '<hr>';

    block.innerHTML = output;
  }).catch(() => {
    block.innerHTML = 'Error retrieving OKR data.';
  });
}
