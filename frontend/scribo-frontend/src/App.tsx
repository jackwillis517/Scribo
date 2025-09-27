import { StrictMode } from "react";
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "./auth/authProvider";
import './index.css';

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({ routeTree })

// Create a TanStack Query client
const queryClient = new QueryClient();

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const App = () => {
  return (
    <StrictMode>
        <QueryClientProvider client={queryClient}>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </GoogleOAuthProvider>
        </QueryClientProvider>
    </StrictMode>
  );
};

export default App;