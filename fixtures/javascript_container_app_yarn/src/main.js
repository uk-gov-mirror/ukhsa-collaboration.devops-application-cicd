import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "./App.js";

const root = document.getElementById("root");
hydrateRoot(root, createElement(App, { suffix: root.dataset.suffix }));
