import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { App } from "../src/App.js";

test("renders the default greeting", () => {
  assert.equal(renderToString(createElement(App)), "<h1>React container ready [default]</h1>");
});

test("renders the configured build suffix", () => {
  assert.equal(
    renderToString(createElement(App, { suffix: "runtime-check" })),
    "<h1>React container ready [runtime-check]</h1>",
  );
});

test("escapes content in the greeting", () => {
  assert.ok(renderToString(createElement(App, { suffix: "<script>" })).includes("&lt;script&gt;"));
});
