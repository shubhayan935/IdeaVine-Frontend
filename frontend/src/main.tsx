// main.tsx

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import { UserProvider } from './context/UserContext';
import { Analytics } from "@vercel/analytics/react"

// Import your publishable key (allow demo mode)
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const Root = (
  <StrictMode>
    <Analytics />
    <UserProvider>
      <App />
    </UserProvider>
  </StrictMode>
)

if (!PUBLISHABLE_KEY && !DEMO_MODE) {
  throw new Error("Missing Publishable Key");
}

if (PUBLISHABLE_KEY) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Analytics />
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <UserProvider>
          <App />
        </UserProvider>
      </ClerkProvider>
    </StrictMode>
  );
} else {
  // Demo mode: render without ClerkProvider
  createRoot(document.getElementById("root")!).render(Root);
}
