import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ChatApp from "./ChatApp";

/**
 * Root component — sets up the auth context, router, and routes.
 *
 * Routes:
 *   /          → Protected → ChatApp (the existing chat UI)
 *   /login     → LoginPage  (redirects to / if already logged in)
 *   /register  → RegisterPage (redirects to / if already logged in)
 *   *          → /login
 */
export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ChatApp />} />
          <Route path="/c/:chatId" element={<ChatApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
