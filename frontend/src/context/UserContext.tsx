// src/context/UserContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';

// Define the shape of the context data
interface UserContextType {
  userEmail: string | null;
  firstName: string | null;
  lastName: string | null;
}

// Create the context with default values
const UserContext = createContext<UserContextType>({
  userEmail: null,
  firstName: null,
  lastName: null,
});

// Create a provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);

  useEffect(() => {
    // Demo mode: use env-provided demo user
    const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE === 'true');
    if (DEMO_MODE) {
      const demoEmail = import.meta.env.VITE_DEMO_USER_EMAIL || 'demo@ideavine.test';
      const demoFirst = import.meta.env.VITE_DEMO_USER_FIRST || 'Demo';
      const demoLast = import.meta.env.VITE_DEMO_USER_LAST || 'User';
      setUserEmail(demoEmail);
      setFirstName(demoFirst);
      setLastName(demoLast);
      return;
    }

    if (isLoaded && isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress || null;
      setUserEmail(email);
      const fName = user.firstName || null;
      setFirstName(fName);
      const sName = user.lastName || null;
      setLastName(sName);
    } else {
      setUserEmail(null);
      setFirstName(null);
      setLastName(null);
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <UserContext.Provider value={{ userEmail, firstName, lastName }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUserInfo = () => useContext(UserContext);
