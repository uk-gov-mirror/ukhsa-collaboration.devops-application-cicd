import { createElement } from "react";

export function App({ suffix = "default" } = {}) {
  return createElement("h1", null, `React container ready [${suffix}]`);
}
