import { Navigate } from 'react-router-dom';
import { useToast } from "@chakra-ui/react";
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const toast = useToast();
  const token = localStorage.getItem("token");
  
  useEffect(() => {
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please login to view this page",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [token, toast]);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;