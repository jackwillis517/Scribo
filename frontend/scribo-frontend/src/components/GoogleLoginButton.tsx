import { Button } from "./ui/button"
import { useAuth } from "../auth/useAuth";

export const GoogleLoginButton = () => {
    const { login } = useAuth();

  return (
      <Button
        className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white font-medium px-4 py-4 rounded shadow hover:from-orange-600 hover:to-yellow-600 transition cursor-pointer"
        onClick={() => login()}
      >
        Sign in with Google
      </Button>
  )
}