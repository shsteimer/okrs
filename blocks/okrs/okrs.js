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
    data.OKRs.data.forEach((element) => {
      const percent = (data[element.Objective].total * 100) / element['FY24 Target'];
      output += `
        <hr>
        <div class=objective>${element.Objective}</div>
        <div class=desc>${element.KR}</div>
        <div class=desc></div>
        <div class=desc>${data[element.Objective].total} of ${element['FY24 Target']}
        -
        <a href='${element.Link}' target='_blank'>Add</a>
        </div>
        <div class='progressborder'>
            <div class='progressbar' style='width: ${percent}%'></div>
        </div>
      `;

      output += '<div class=container>';
      let headerDrawn = false;
      let i = 0;
      let row = '';
      data[element.Objective].data.forEach((metric) => {
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

        // display data from spreadsheet
        Object.values(metric).forEach((value) => {
          output += `<div class='item${row}'>${value}</div>`;
        });
      });
      output += '</div>';
    });

    block.innerHTML = output;
  }).catch(() => {
    block.innerHTML = 'Error retrieving OKR data.';
  });
}
