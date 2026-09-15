import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./index.css"
import App from "./App.tsx"
import { AuthProvider } from "./store/AuthContext.tsx"
import { DataProvider } from "./store/DataContext.tsx"
import { ToastProvider } from "./store/ToastContext.tsx"
import { TutorialProvider } from "./store/TutorialContext.tsx"
import TutorialOverlay from "./components/TutorialOverlay.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <TutorialProvider>
              <App />
              <TutorialOverlay />
            </TutorialProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
)
