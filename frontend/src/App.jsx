import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";

import { useAsgardeo } from "@asgardeo/react";

import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";

function App() {
  const { user, http, isSignedIn } = useAsgardeo();

  const authenticatedEmail =
    user?.email ||
    user?.emails?.[0] ||
    user?.username ||
    user?.userName ||
    user?.sub ||
    "";

  const [wso2Claims, setWso2Claims] = useState(null);
  const [claimsLoading, setClaimsLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      setWso2Claims(null);
      setClaimsLoading(false);
      return;
    }

    const fetchWso2Claims = async () => {
      try {
        setClaimsLoading(true);

        const response = await http.request({
          url: `${import.meta.env.VITE_WSO2_BASE_URL}/oauth2/userinfo`,
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        setWso2Claims(response.data);
      } catch (error) {
        console.error(
          "Unable to load WSO2 user claims:",
          error
        );

        setWso2Claims(null);
      } finally {
        setClaimsLoading(false);
      }
    };

    fetchWso2Claims();
  }, [http, isSignedIn]);

  const rawRoles =
    wso2Claims?.application_roles ??
    wso2Claims?.roles ??
    user?.application_roles ??
    user?.roles ??
    [];

  const normalizedRoles = Array.isArray(rawRoles)
    ? rawRoles
    : typeof rawRoles === "string"
      ? rawRoles
        .split(",")
        .map((role) => role.trim())
      : [];

  const isAdmin = normalizedRoles.some((role) => {
    if (typeof role === "string") {
      return (
        role.toLowerCase() ===
        "grantflow admin".toLowerCase()
      );
    }

    if (typeof role === "object" && role !== null) {
      const roleName =
        role.display ||
        role.name ||
        role.value ||
        "";

      return (
        roleName.toLowerCase() ===
        "grantflow admin".toLowerCase()
      );
    }

    return false;
  });

  if (claimsLoading) {
    return (
      <div className="app-loading">
        <p>Loading GrantFlow...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div>
            <h1>GrantFlow</h1>
            <p>Just-in-Time Access Management</p>
          </div>

          <nav className="top-navigation">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "nav-link nav-link-active"
                  : "nav-link"
              }
            >
              My Access
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive
                    ? "nav-link nav-link-active"
                    : "nav-link"
                }
              >
                Admin Dashboard
              </NavLink>
            )}
          </nav>

          <div className="user-summary">
            <span className="user-label">
              Signed in as
            </span>

            <strong>
              {user?.displayName ||
                user?.userName ||
                user?.username ||
                authenticatedEmail}
            </strong>

            <small>{authenticatedEmail}</small>

            {isAdmin && (
              <small className="admin-user-label">
                GrantFlow Admin
              </small>
            )}
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<UserDashboard />}
            />

            <Route
              path="/admin"
              element={
                isAdmin ? (
                  <AdminDashboard />
                ) : (
                  <Navigate
                    to="/"
                    replace
                  />
                )
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;