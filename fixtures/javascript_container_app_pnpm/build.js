import { mkdir, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { createElement } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { App } from "./src/App.js";

const suffix = process.env.FIXTURE_MESSAGE_SUFFIX || "default";
await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  minify: true,
  outfile: "dist/app.js",
  define: { "process.env.NODE_ENV": '"production"' },
});
const root = renderToStaticMarkup(
  createElement("div", {
    id: "root",
    "data-suffix": suffix,
    dangerouslySetInnerHTML: { __html: renderToString(createElement(App, { suffix })) },
  }),
);
await writeFile(
  "dist/index.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>React fixture</title></head><body>${root}<script src="/app.js" defer></script></body></html>`,
);
