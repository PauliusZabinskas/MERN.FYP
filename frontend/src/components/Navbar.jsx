import { Button, Container, Flex, HStack, Text, useColorMode, useToast } from '@chakra-ui/react';
import { Link, useNavigate } from "react-router-dom";
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
    const toast = useToast();

    // Check authentication status on component mount and when localStorage changes
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            setIsLoggedIn(!!token);
        };
        
        // Initial check
        checkAuth();
        
        // Listen for localStorage changes (when user logs in/out in another tab)
        window.addEventListener('storage', checkAuth);
        
        return () => {
            window.removeEventListener('storage', checkAuth);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        toast({
            title: "Logged out",
            description: "You have been successfully logged out",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
        navigate("/login");
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