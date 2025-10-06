import { useState, useEffect } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { AuthContext } from "./authContext";
import type { User } from "./authContext";
import postLogin from "../api/postLogin.ts";
import getUser from "../api/getUser.ts";
import invalidateUser from "../api/invalidateUser.ts";

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const jwtToken = getCookie("auth_token");
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");

        if (jwtToken && storedUser) {
          setUser(storedUser);
          return;
        }

        if (jwtToken && !storedUser) {
          getUser()
          .then((res) => {
            if (!res.ok) throw new Error("Failed to get user data");
            return res.json();
          })
          .then((user) => {
            setUser(user);
            localStorage.setItem("user", JSON.stringify(user));
          })
          .catch(async () => {
            setUser(null);
            localStorage.removeItem("user");
            invalidateUser();
          });
          return;
        } 

        if (!jwtToken && !storedUser) {
          setUser(null);
          return;
        }
        
        if (!jwtToken && storedUser) {
          setUser(null);
          localStorage.removeItem("user");
          return;
        }
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
    invalidateUser()
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}