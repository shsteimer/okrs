// import { readBlockConfig } from '../../scripts/aem.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // const cfg = readBlockConfig(block);
  block.innerHTML = '';

  // before fetching the data, preview the sheet so it is accessible
  // TODO make this sequential, currently the data fetch happens before the preview
  const preview = new URL('https://admin.hlx.page/preview/langswei/okrs/main/okrs.json');
  fetch(preview, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    if (response.status === 200) {
      // preview successful
      // TODO determine if we should publish next
    } else {
      console.log('Preview not successful.');
    }
  }).catch(() => {
    console.log('Preview not successful.');
  });

  // retrieve OKR data
  const okrs = new URL(`${window.location.protocol}//${window.location.host}/okrs.json?sheet=OKRs&sheet=Metrics`);

  fetch(okrs, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json()).then((data) => {
    let output = '';

    // default date format yyyy-mm-dd
    const today = new Date().toISOString().split('T')[0];

    output += `
        <button id='showform'>Add</button>
        <div id='addform' class='content hide'>
            <label for='objective'>* Objective</label>
            <select id='objective' name='objective'>
                <option value=''>--Select One--</option>
                <option value='Helix Direct Customer Engagement'>Helix Direct Customer Engagement</option>
                <option value='Helix Customer Driven Innovation'>Helix Customer Driven Innovation</option>
                <option value='Helix ACS/Partner Success'>Helix ACS/Partner Success</option>
                <option value='Helix Data Intelligence Innovation'>Helix Data Intelligence Innovation</option>
                <option value='Helix Data User Interactions'>Helix Data User Interactions</option>
                <option value='Helix Knowledge Sharing'>Helix Knowledge Sharing</option>
                <option value='Technical Evangelism'>Technical Evangelism</option>
            </select>
            <label for='who'>* Who</label>
            <select id='who' name='who'>
                <option value=''>--Select One--</option>
                <option value='Amol'>Amol</option>
                <option value='Brian'>Brian</option>
                <option value='Bryan'>Bryan</option>
                <option value='Damian'>Damian</option>
                <option value='Darin'>Darin</option>
                <option value='Gillian'>Gillian</option>
                <option value='James'>James</option>
                <option value='Kiran'>Kiran</option>
                <option value='Kunwar'>Kunwar</option>
                <option value='Marquise'>Marquise</option>
                <option value='Sean'>Sean</option>
                <option value='Varun'>Varun</option>
            </select>
            <label for='date'>* Date</label>
            <input id='date' name='date' type='date' value='${today}'>
            <label for='summary'>* Summary</label>
            <input id='summary' name='summary' value=''>
            <label for='notes'>Notes</label>
            <textarea id='notes' name="notes" cols="40" rows="5"></textarea>
            <button id='add'>Add</button>
            <button id='cancel'>Cancel</button>
            <div id='results'></div>
        </div>
    `;

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

    // attach events
    block.querySelector('#showform').addEventListener('click', () => {
      block.querySelector('#showform').classList.add('hide');
      block.querySelector('#addform').classList.remove('hide');
    });

    block.querySelector('#cancel').addEventListener('click', () => {
      block.querySelector('#addform').classList.add('hide');
      block.querySelector('#showform').classList.remove('hide');
    });

    block.querySelector('#add').addEventListener('click', () => {
      // field validation

      const objective = block.querySelector('#objective').value;
      const who = block.querySelector('#who').value;
      const date = block.querySelector('#date').value;
      const summary = block.querySelector('#summary').value;
      const notes = block.querySelector('#notes').value;

      if (!objective || !who || !date || !summary) {
        block.querySelector('#results').innerHTML = 'All fields marked with * are required.';
      } else {
        // disable fields while processing
        block.querySelector('#add').classList.add('hide');
        block.querySelector('#cancel').classList.add('hide');
        block.querySelector('#objective').disabled = 'disabled';
        block.querySelector('#who').disabled = 'disabled';
        block.querySelector('#date').disabled = 'disabled';
        block.querySelector('#summary').disabled = 'disabled';
        block.querySelector('#notes').disabled = 'disabled';
        block.querySelector('#results').innerHTML = 'Saving...';

        // create new domain key by making API request
        const endpoint = new URL(`${window.location.protocol}//${window.location.host}/okrs`);
        const body = {
          data: {
            Objective: objective,
            Who: who,
            Date: date,
            Summary: summary,
            Notes: notes,
          },
        };

        fetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
          },
        }).then((response) => {
          if (response.status === 201) {
            block.querySelector('#results').innerHTML = 'Saved.  It takes time for the data to be processed, please refresh page in one minute, then again one minute afterward.';
          } else {
            block.querySelector('#results').innerHTML = 'Error, not saved.';
          }
        }).catch(() => {
          block.querySelector('#results').innerHTML = 'Error.';
        });
      }
    });
  }).catch(() => {
    block.innerHTML = 'Error retrieving OKR data.';
  });
}
