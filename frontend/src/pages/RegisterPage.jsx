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
  
  const RegisterPage = () => {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();
    const bgColor = useColorModeValue("white", "gray.800");
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };
  
    // In your RegisterPage.jsx, update the fetch call:
    // In your handleSubmit function:

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        toast({
            title: "Error",
            description: "Please fill in all fields",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }
        
        if (formData.password !== formData.confirmPassword) {
        toast({
            title: "Error",
            description: "Passwords do not match",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }
        
        setIsSubmitting(true);
        
        try {
        // Use absolute URL with your backend port (5000)
        const response = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            username: formData.name,
            email: formData.email,
            password: formData.password
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }
        
        toast({
            title: "Account created",
            description: "You've successfully registered! You can now log in.",
            status: "success",
            duration: 5000,
            isClosable: true,
        });
        
        // Redirect to login page
        navigate("/login");
        
        } catch (error) {
        toast({
            title: "Error",
            description: error.message || "Something went wrong",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        } finally {
        setIsSubmitting(false);
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
            Create Your Account
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
                <FormControl id="name" isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </FormControl>
                
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
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </FormControl>
                
                <FormControl id="confirmPassword" isRequired>
                  <FormLabel>Confirm Password</FormLabel>
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </FormControl>
                
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  fontSize="md"
                  isLoading={isSubmitting}
                  loadingText="Creating Account"
                  width="full"
                  mt={4}
                >
                  Sign Up
                </Button>
                
                <Text align="center" mt={4}>
                  Already have an account?{" "}
                  <Link to="/login">
                    <Text as="span" color="blue.500" _hover={{ textDecoration: "underline" }}>
                      Sign in
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
  
  export default RegisterPage;