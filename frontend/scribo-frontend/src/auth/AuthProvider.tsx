import { useState, useEffect } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { AuthContext } from "./authContext";
import type { User } from "./authContext";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("Google OAuth Token Response:", tokenResponse);

      try {
        // TODO: Fetch user info from Go API
        const profile = {"id": "123", "email": "user@example.com", "name": "John Doe", "picture": "https://example.com/profile.jpg"};
        setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            picture: profile.picture,
        })
        localStorage.setItem("user", JSON.stringify(profile));
         
      } catch (error) {
        console.error("Failed to fetch user info:", error);        
      }
    },
    onError: (error) => {
      console.error("Google OAuth Error:", error);
    },
  });

  const logout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem("user");
    //  TODO: Call Go API to invalidate auth cookie
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}