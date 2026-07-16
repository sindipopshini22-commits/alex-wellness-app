// /login — auth landing page.
// Links from the root page route here. Supports anonymous sign-in and
// credential sign-in (credential path requires Auth.js v5 setup beyond
// the scope of this smoke test).

import LoginPage from "@/components/auth/LoginPage";

export default function Login() {
  return <LoginPage />;
}
