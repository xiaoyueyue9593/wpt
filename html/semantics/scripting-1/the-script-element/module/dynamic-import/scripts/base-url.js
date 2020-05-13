"use strict";

// Dynamic imports should use referencing script's base URL == response URL for resolving specifiers.

const source = document.currentScript ? "classic script" : "module script";

promise_test(t =>
  promise_rejects_js(t, TypeError, import("../../imports-a.js?label=" + source), "Fetch should fail due to CORS"),
  `Dynamic imports from ${source} (CORS fail)`);

promise_test(() => {
    return import("../../imports-a.js?pipe=header(Access-Control-Allow-Origin,*)&?label=" + source)
      .then(module => {
          assert_true(window.evaluated_imports_a);
          assert_equals(module.A["from"], "imports-a.js");
        });
  },
  `Dynamic imports from ${source} (CORS success)`);
