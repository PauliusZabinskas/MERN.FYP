import React, { useState, useEffect } from "react";
import { Box, Button, Container, Heading, Input, useColorModeValue, useToast, VStack, Text } from "@chakra-ui/react";
import Dropzone from "react-dropzone";
import { usefileAPI } from "../fetchAPI/fetch.file.js";
import { useNavigate } from "react-router-dom";

const CreatePage = () => {
  const [newFile, setNewFile] = useState({
    name: "",
    description: "",
    owner: "", // We'll populate this automatically
    file: null
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { createFile } = usefileAPI();
  
  // Fetch the current user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get user from verification API
        const response = await fetch("/api/auth/verify", {
          credentials: "include"
        });
        
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          // Set the owner automatically using the user's email
          setNewFile(prev => ({ 
            ...prev, 
            owner: data.user.email 
          }));
        } else {
          // If not authenticated, redirect to login
          toast({
            title: "Authentication Required",
            description: "Please login to create files",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        toast({
          title: "Error",
          description: "Could not verify your identity",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    
    fetchUser();
  }, [navigate, toast]);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type === "text/plain") {
      setSelectedFile(file);
      setNewFile({ ...newFile, name: file.name, file: file });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file only.",
        status: "error",
        isClosable: true,
      });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select or drag a .txt file.",
        status: "error",
        isClosable: true,
      });
      return;
    }

    if (!newFile.description) {
      toast({
        title: "Missing information",
        description: "Please provide a file description.",
        status: "error",
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    
    try {
      console.log("Creating file with data:", { 
        name: newFile.name,
        description: newFile.description,
        owner: newFile.owner
      });
      
      // Use the store's createFile function
      const { success, message } = await createFile(newFile);
      
      if (!success) {
        throw new Error(message);
      }
      
      setNewFile(prev => ({ 
        name: "", 
        description: "", 
        owner: currentUser?.email || "", // Keep the owner email for future uploads
        file: null 
      }));
      setSelectedFile(null);
      toast({
        title: "File uploaded successfully",
        description: `Uploaded: ${selectedFile.name} (encrypted)`,
        status: "success",
        isClosable: true,
      });
      
      // Redirect to home page to see the new file
      navigate("/home");
    } catch (error) {
      console.error("Upload error:", error);
      
      // Check if it's an auth error
      if (error.message && (
        error.message.includes("Authentication") || 
        error.message.includes("Unauthorized") ||
        error.message.includes("token")
      )) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue",
          status: "error",
          isClosable: true,
        });
        navigate("/login");
      } else {
        toast({
          title: "Upload failed",
          description: error.message || "Something went wrong",
          status: "error",
          isClosable: true,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Container maxW={"container.sm"}>
      <VStack spacing={8}>
        <Heading as={"h1"} size={"2xl"} textAlign={"center"} mb={8}>
          Create New File
        </Heading>

        <Box w={"full"} bg={useColorModeValue("white", "gray.800")} p={6} rounded={"lg"} shadow={"md"}>
          <VStack spacing={4}>
             <Input
              placeholder='File description'
              name='description'
              value={newFile.description}
              onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
            />
            {/* Display owner as read-only input */}
            <Input
              placeholder='File owner'
              name='owner'
              value={newFile.owner}
              isReadOnly
              bgColor="gray.100"
            />
            <Dropzone onDrop={onDrop} accept=".txt">
              {({ getRootProps, getInputProps }) => (
                <Box {...getRootProps()} border="2px dashed gray" p={4} textAlign="center" cursor="pointer">
                  <input {...getInputProps()} />
                  <p>Drag & drop a .txt file here, or click to select one</p>
                </Box>
              )}
            </Dropzone>
            {selectedFile && <p>Selected file: {selectedFile.name}</p>}
            <Button 
              colorScheme='blue' 
              onClick={handleFileUpload} 
              w='full'
              isLoading={isUploading}
              loadingText="Encrypting & Uploading"
            >
              Upload Encrypted File
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default CreatePage;