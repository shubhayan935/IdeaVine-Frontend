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
    if (isLoaded && isSignedIn && user) {
      console.log(user);
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

