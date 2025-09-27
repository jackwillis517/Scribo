import { useAuth } from "../auth/useAuth";
import { ProfileAvatar } from "./ProfileAvatar";
import { PenTool } from "lucide-react";
import { GoogleLoginButton } from "./GoogleLoginButton";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="bg-neutral-800 px-4 py-4 flex items-center justify-between border border-gray-500">
      <div className="flex items-center space-x-2">
        <PenTool className="h-8 w-8 text-orange-500" />
        <span
          className="text-3xl font-semibold bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent"
        >
          Scribo
        </span>
      </div>
      {user ? (
        <ProfileAvatar />  
      ) : (
        <GoogleLoginButton />
      )}
    </nav>
  );
};

export default Navbar;