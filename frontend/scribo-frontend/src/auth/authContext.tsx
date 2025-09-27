import { createContext } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  picture: string;
};

type AuthContextType = {
  user: User | null;
  login: () => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);