// Allows RegExps to be pretty printed.
Object.defineProperty(RegExp.prototype, "toJSON", {
  value: RegExp.prototype.toString
});

function wait(ms) {
  return new Promise(resolve => step_timeout(resolve, ms));
}

async function pollReports(endpoint) {
  const res = await fetch(`resources/report.py?endpoint=${endpoint.name}`, {cache: 'no-store'});
  if (res.status !== 200) {
    return;
  }
  for (const report of await res.json()) {
    endpoint.reports.push(report);
  }
}

function isObjectAsExpected(report, expectedReport) {
  if((report === undefined || report === null || expectedReport === undefined || expectedReport === null)
      && report !== expectedReport )
    return false;

  if(expectedReport instanceof RegExp && typeof report === "string") {
    return expectedReport.test(report);
  }

  // Perform this check now, as RegExp and strings above have different typeof.
  if(typeof report !== typeof expectedReport)
    return false;

  if(typeof expectedReport === 'object') {
    return Object.keys(expectedReport).every(key => {
      return isObjectAsExpected(report[key], expectedReport[key]);
    });
  }

  return report == expectedReport;
}

async function check_for_expected_report(expectedReport) {
  return new Promise( async (resolve, reject) => {
    const polls = 10;
    const waitTime = 200;
    for(var i=0; i < polls; ++i) {
      pollReports(expectedReport.endpoint);
      if(expectedReport.endpoint.reports.some((report) => { return isObjectAsExpected(report, expectedReport.report); }))
        resolve();
      await wait(waitTime);
    }
    reject("No report matched the expected report for endpoint: " + expectedReport.endpoint.name
      + ", expected report: " + JSON.stringify(expectedReport.report)
      + ", within available reports: " + JSON.stringify(expectedReport.endpoint.reports)
    );
  });
}

async function check_for_unwanted_report(unwantedReport) {
  return new Promise( async (resolve, reject) => {
    const polls = 10;
    const waitTime = 200;
    for(var i=0; i < polls; ++i) {
      pollReports(unwantedReport.endpoint);
      unwantedReport.endpoint.reports.forEach((report) => {
        if(isObjectAsExpected(report, unwantedReport.report)) {
          reject("Report matched the unwanted report for endpoint: " + unwantedReport.endpoint.name
            + ", unwanted report: " + JSON.stringify(unwantedReport.report)
            + ", matched: " + JSON.stringify(report)
          );
        }
      });
      await wait(waitTime);
    }
    resolve();
  });
}

function replace_from_regex_or_string(str, match, value) {
  if(str instanceof RegExp) {
    return RegExp(str.source.replace(match, value));
  }
  return str.replace(match, value);
}

function replace_values_in_expectedReport(expectedReport, channelName) {
  if(expectedReport.report.body !== undefined) {
    if(expectedReport.report.body["document-uri"] !== undefined) {
      expectedReport.report.body["document-uri"] = replace_from_regex_or_string(expectedReport.report.body["document-uri"], "CHANNEL_NAME", channelName);
    }
    if(expectedReport.report.body["navigation-uri"] !== undefined) {
      expectedReport.report.body["navigation-uri"] = replace_from_regex_or_string(expectedReport.report.body["navigation-uri"], "CHANNEL_NAME", channelName);
    }
  }
  if(expectedReport.report.url !== undefined) {
      expectedReport.report.url = replace_from_regex_or_string(expectedReport.report.url, "CHANNEL_NAME", channelName);
  }
  return expectedReport;
}

async function reporting_test(testFunction, channelName, expectedReports, unexpectedReports) {
    await new Promise( async resolve => {
      testFunction(resolve);
    });
    expectedReports = Array.from(expectedReports, report => replace_values_in_expectedReport(report, channelName) );
    unexpectedReports = Array.from(unexpectedReports, report => replace_values_in_expectedReport(report, channelName) );
    await Promise.all(
        Array.from(expectedReports, check_for_expected_report).concat(
          Array.from(unexpectedReports, check_for_unwanted_report))
    );
}

function coop_coep_reporting_test(testName, host, coop, coep, hasOpener, expectedReports, unexpectedReports){
  const channelName = `${testName.replace(/[ ;"=]/g,"-")}_to_${host.name}_${coop.replace(/[ ;"=]/g,"-")}_${coep}`;
  promise_test(async t=> {
    await reporting_test( (resolve) => {
      coop_coep_test(t, host, coop, coep, channelName,
          hasOpener, undefined /* openerDOMAccess */, resolve);
    }, channelName, expectedReports, unexpectedReports);
  }, `coop reporting test ${channelName}`);
}

function run_coop_reporting_test(testName, tests){
  tests.forEach( test => {
    coop_coep_reporting_test(testName, test[0], test[1], test[2], test[3], test[4], test[5]);
  });
}

const reportEndpoint = {
  name: "coop-report-endpoint",
  reports: []
}
const reportOnlyEndpoint = {
  name: "coop-report-only-endpoint",
  reports: []
}
const popupReportEndpoint = {
  name: "coop-popup-report-endpoint",
  reports: []
}
const popupReportOnlyEndpoint = {
  name: "coop-popup-report-only-endpoint",
  reports: []
}
const redirectReportEndpoint = {
  name: "coop-redirect-report-endpoint",
  reports: []
}
const redirectReportOnlyEndpoint = {
  name: "coop-redirect-report-only-endpoint",
  reports: []
}

