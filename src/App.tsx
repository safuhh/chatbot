import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ChatApp from "./ChatApp";
import ProductFeaturesPage from "./pages/ProductFeaturesPage";
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
          <Route path="/" element={<ChatApp showSidebar={false} showSidebarToggle={false} showVoiceMode={false} showTemporaryChat={false} showFeaturesPage={true} redirectOnSend={true} />} />
          <Route path="/chat" element={<ChatApp showSidebar={true} showSidebarToggle={true} showVoiceMode={true} showTemporaryChat={true} />} />
          <Route path="/c/:chatId" element={<ChatApp showSidebar={true} showSidebarToggle={true} showVoiceMode={true} showTemporaryChat={true} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/features" element={<ProductFeaturesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
