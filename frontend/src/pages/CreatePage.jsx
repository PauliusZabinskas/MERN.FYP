import React, { useState } from "react";
import { Box, Button, Container, Heading, Input, useColorModeValue, useToast, VStack } from "@chakra-ui/react";
import Dropzone from "react-dropzone";
import { usefileAPI } from "../fetchAPI/fetch.file.js";
import { encryptFile } from "../enc.dec/encryption.js";

const CreatePage = () => {
  const [newFile, setNewFile] = useState({
    name: "",
    description: "",
    owner: "",
    file: null
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();
  const { createFile } = usefileAPI();

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

    if (!newFile.description || !newFile.owner) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        status: "error",
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Use the store's createFile function
      const { success, message } = await createFile(newFile);
      
      if (!success) {
        throw new Error(message);
      }
      
      setNewFile({ name: "", description: "", owner: "", file: null });
      setSelectedFile(null);
      toast({
        title: "File uploaded successfully",
        description: `Uploaded: ${selectedFile.name} (encrypted)`,
        status: "success",
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong",
        status: "error",
        isClosable: true,
      });
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
            <Input
              placeholder='File owner'
              name='owner'
              value={newFile.owner}
              onChange={(e) => setNewFile({ ...newFile, owner: e.target.value })}
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