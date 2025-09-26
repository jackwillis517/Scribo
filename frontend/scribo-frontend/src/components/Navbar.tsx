import { Button } from "@/components/ui/button";
import { PenTool } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="bg-neutral-800 px-4 py-4 flex items-center justify-between border border-gray-500">
      {/* Left: Logo and App Name */}
      <div className="flex items-center space-x-2">
        {/* Replace with your logo image if you have one */}
        <PenTool className="h-8 w-8 text-orange-500" />
        <span
          className="text-3xl font-semibold bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent"
        >
          Scribo
        </span>
      </div>
      {/* Right: Google Sign-In Button */}
      <Button
        className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white font-medium px-4 py-4 rounded shadow hover:from-orange-600 hover:to-yellow-600 transition cursor-pointer"
        // onClick={handleGoogleSignIn} // Add your sign-in logic here
      >
        Sign in with Google
      </Button>
    </nav>
  );
};

export default Navbar;