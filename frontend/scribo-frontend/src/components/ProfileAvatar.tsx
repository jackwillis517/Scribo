import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../auth/useAuth";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export const ProfileAvatar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <img
        // TODO: replace src with {user.picture} once the AuthProvider is fetching from the Go API
          src="../../assets/profile_pic.jpg"
          alt={user.name}
          className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>{user.name}</DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};