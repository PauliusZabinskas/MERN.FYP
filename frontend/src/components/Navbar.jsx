import { Button, Container, Flex, HStack, Text, useColorMode, useToast } from '@chakra-ui/react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { PlusSquareIcon } from "@chakra-ui/icons";
import { IoMoon } from "react-icons/io5";
import { LuSun } from "react-icons/lu";
import { MdHome, MdLogin, MdLogout } from "react-icons/md"; 
import { FaUserPlus } from "react-icons/fa";
import { useEffect, useState } from 'react';

const Navbar = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // Add this to detect route changes
    const toast = useToast();

    // Check authentication status when component mounts AND when route changes
    useEffect(() => {
        const checkAuth = async () => {
          try {
            console.log("Checking auth status...");
            const response = await fetch("/api/auth/verify", {
              credentials: "include"
            });
            
            const data = await response.json();
            console.log("Auth status:", data.authenticated);
            setIsLoggedIn(data.authenticated);
            
            if (data.authenticated && data.user) {
              localStorage.setItem("user", JSON.stringify(data.user));
            } else if (!data.authenticated) {
              // Clear user data if not authenticated
              localStorage.removeItem("user");
            }
          } catch (error) {
            console.error("Auth check error:", error);
            setIsLoggedIn(false);
          }
        };
        
        const timeoutId = setTimeout(() => {
            checkAuth();
          }, 5000); // 500ms delay
          
          return () => clearTimeout(timeoutId); // Cleanup
        }, [location.pathname]);
      
    // For logout:
    const handleLogout = async () => {
        try {
          const response = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Clear user data from localStorage
            localStorage.removeItem("user");
            
            // Update logged-in state
            setIsLoggedIn(false);
            
            toast({
              title: "Logged Out",
              description: "You have been successfully logged out",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            
            // Redirect to login page
            navigate("/login");
          }
        } catch (error) {
          console.error("Logout error:", error);
          toast({
            title: "Error",
            description: "Failed to log out",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
    };

    return (
        <Container maxW={"1140px"} px={4}>
            <Flex
                h={16}
                alignItems={"center"}
                justifyContent={"space-between"}
                flexDir={{
                    base: "column",
                    sm: "row",
                }}
            >
                <Text
                    fontSize={{ base: "22", sm: "28" }}
                    fontWeight={"bold"}
                    textTransform={"uppercase"}
                    textAlign={"center"}
                    bgGradient={"linear(to-r, cyan.400, blue.500)"}
                    bgClip={"text"}
                >
                    <Link to={isLoggedIn ? "/home" : "/"}>Secure File Share</Link>
                </Text>

                <HStack spacing={2} alignItems={"center"}>
                    {isLoggedIn ? (
                        // Buttons for logged-in users
                        <>
                            <Link to={"/home"}>
                                <Button>
                                    <MdHome fontSize={20} />
                                </Button>
                            </Link>
                            <Link to={"/create"}>
                                <Button>
                                    <PlusSquareIcon fontSize={20} />
                                </Button>
                            </Link>
                            <Button onClick={handleLogout}>
                                <MdLogout fontSize={20} />
                            </Button>
                        </>
                    ) : (
                        // Buttons for guests
                        <>
                            <Link to={"/login"}>
                                <Button>
                                    <MdLogin fontSize={20} />
                                </Button>
                            </Link>
                            <Link to={"/"}>
                                <Button>
                                    <FaUserPlus fontSize={16} />
                                </Button>
                            </Link>
                        </>
                    )}
                    
                    {/* Theme toggle button is always visible */}
                    <Button onClick={toggleColorMode}>
                        {colorMode === "light" ? <IoMoon /> : <LuSun size='20' />}
                    </Button>
                </HStack>
            </Flex>
        </Container>
    );
};

export default Navbar;