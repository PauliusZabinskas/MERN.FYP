import { Navigate } from 'react-router-dom';
import { useToast, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const toast = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          credentials: "include"
        });
        
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        
        if (!data.authenticated) {
          toast({
            title: "Authentication Required",
            description: "Please login to access this page",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        toast({
          title: "Authentication Error",
          description: "Failed to verify authentication status",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [toast]);
  
  if (isLoading) {
    return (
      <Center h="50vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Checking authentication...</Text>
        </VStack>
      </Center>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;