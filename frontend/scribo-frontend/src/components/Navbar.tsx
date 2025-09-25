import { Button } from "@/components/ui/button";
import { PenTool } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="bg-neutral-800 px-4 py-4 flex items-center justify-between">
      {/* Left: Logo and App Name */}
      <div className="flex items-center space-x-2">
        {/* Replace with your logo image if you have one */}
        <PenTool className="h-8 w-8 text-orange-400" />
        <span
          className="text-3xl font-semibold bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent"
        >
          Scribo
        </span>
      </div>
      {/* Right: Google Sign-In Button */}
      <Button
        className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white font-medium px-4 py-4 rounded shadow hover:from-orange-500 hover:to-yellow-500 transition"
        // onClick={handleGoogleSignIn} // Add your sign-in logic here
      >
        Sign in with Google
      </Button>
    </nav>
  );
};

export default Navbar;