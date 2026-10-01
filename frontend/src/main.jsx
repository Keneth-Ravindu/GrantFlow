import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AsgardeoProvider } from "@asgardeo/react";

import App from "./App.jsx";
import AuthGate from "./AuthGate.jsx";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AsgardeoProvider
      clientId={import.meta.env.VITE_WSO2_CLIENT_ID}
      baseUrl={import.meta.env.VITE_WSO2_BASE_URL}
      scopes={["openid", "profile", "email", "roles"]}
      afterSignInUrl="http://localhost:5173"
      afterSignOutUrl="http://localhost:5173"
    >
      <AuthGate>
        <App />
      </AuthGate>
    </AsgardeoProvider>
  </StrictMode>
);