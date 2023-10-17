import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client";

import App from "./App.jsx";
import client from "./client.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <Suspense>
        <App />
      </Suspense>
    </ApolloProvider>
  </React.StrictMode>
);
