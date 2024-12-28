// AccessDenied.tsx
import { Button } from "@/components/ui/button"
import { useUserInfo } from './context/UserContext'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'

export function AccessDenied() {
  const { userEmail } = useUserInfo();
  const navigate = useNavigate();

  if (!userEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Lock className="h-16 w-16 mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
        <p className="text-muted-foreground mb-4 text-center">
          Please sign in to access this mindmap
        </p>
        <Button onClick={() => navigate('/auth/sign-in')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Lock className="h-16 w-16 mb-4 text-muted-foreground" />
      <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground mb-4 text-center">
        You don't have permission to access this mindmap
      </p>
      <Button onClick={() => navigate('/mindmap')}>
        Back to Dashboard
      </Button>
    </div>
  );
}