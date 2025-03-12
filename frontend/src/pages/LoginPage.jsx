import { 
  Container, 
  VStack, 
  Heading, 
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  Text, 
  useToast, 
  Box,
  useColorModeValue
} from "@chakra-ui/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const bgColor = useColorModeValue("white", "gray.800");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // In your LoginPage.jsx, update the fetch call:
const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation...
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      
      // Store token in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      toast({
        title: "Success",
        description: "Login successful!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect to homepage
      navigate("/");
      
    } catch (error) {
      // Error handling...
    }
  };

  return (
    <Container maxW="container.md" py={12}>
      <VStack spacing={8}>
        <Heading
          as="h1"
          fontSize={"4xl"}
          textAlign={"center"}
          bgGradient={"linear(to-r, cyan.400, blue.500)"}
          bgClip={"text"}
        >
          Sign In to Secure File Share
        </Heading>

        <Box
          p={8}
          width="100%"
          bg={bgColor}
          boxShadow={"lg"}
          rounded={"lg"}
        >
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="email" isRequired>
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </FormControl>
              
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                fontSize="md"
                isLoading={isSubmitting}
                loadingText="Signing in"
                width="full"
                mt={4}
              >
                Sign In
              </Button>
              
              <Text align="center" mt={4}>
                Don't have an account?{" "}
                <Link to="/register">
                  <Text as="span" color="blue.500" _hover={{ textDecoration: "underline" }}>
                    Register here
                  </Text>
                </Link>
              </Text>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
};

export default LoginPage;