import { useState, useEffect } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { AuthContext } from "./authContext";
import type { User } from "./authContext";
import postLogin from "../api/postLogin.ts";
import getUser from "../api/getUser.ts";
import invalidateUser from "../api/invalidateUser.ts";

// function getCookie(name: string): string | null {
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) {
//     return parts.pop()?.split(';').shift() || null;
//   }
//   return null;
// }

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");

      if (storedUser) {
        // console.log("User found in local storage.");
        setUser(storedUser);
      }

      getUser()
      .then((user) => {
        // console.log("User verified:", user);
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
      })
      .catch((error) => {
        console.log("Failed to verify user authentication:", error);
        setUser(null);
        localStorage.removeItem("user");
      });
    }, []);

    const login = useGoogleLogin({
      flow: "auth-code",
      onSuccess: async (tokenResponse) => {
        try {
          const data = await postLogin(tokenResponse.code);

          const profile = {"id": data.google_id, "email": data.email, "name": data.name, "picture": data.picture};
          setUser({
              id: data.google_id,
              name: data.name,
              email: data.email,
              picture: data.picture,
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
    invalidateUser();
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}