import React from "react";
import ReactDOM from "react-dom";
import reportWebVitals from "./reportWebVitals";
import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "@esri/calcite-components/dist/calcite/calcite.css";
import "./index.css";

import {
  applyPolyfills,
  defineCustomElements,
} from "@esri/calcite-components/dist/loader";

import "./i18n";
import { BrowserRouter } from "react-router-dom";

// if you're supporting older browsers, apply polyfills
applyPolyfills().then(() => {
  // define the custom tags on the window
  defineCustomElements(window);
  // after these are defined, render your app as you would normally
  // ReactDOM.render(<App />, document.getElementById("root"));
  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
    document.getElementById("root")
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
