import React, { useState } from "react";
import { Box, Button, Container, Heading, Input, useColorModeValue, useToast, VStack } from "@chakra-ui/react";
import Dropzone from "react-dropzone";
import { usefileAPI } from "../fetchAPI/fetch.file.js";
import axios from "axios";

const CreatePage = () => {
  const [newFile, setNewFile] = useState({
    name: "",
    owner: "",
    file:""
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const toast = useToast();
  const { createFile } = usefileAPI();

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type === "text/plain") {
      setSelectedFile(file);
      setNewFile({ ...newFile, name: file.name, owner: file.owner , file: file });
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

    const formData = new FormData();
    formData.append("file", selectedFile); // Ensure the field name is 'file'

    try {
      const response = await axios.post("/api/file-details", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewFile({ ...newFile, file_path: response.data.filePath });
      toast({
        title: "File uploaded successfully",
        description: `Uploaded: ${selectedFile.name}`,
        status: "success",
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        isClosable: true,
      });
    }
  };

  const handleAddFile = async () => {
    const { success, message } = await createFile(newFile);
    if (!success) {
      toast({
        title: "Error",
        description: message,
        status: "error",
        isClosable: true,
      });
    } else {
      toast({
        title: "Success",
        description: message,
        status: "success",
        isClosable: true,
      });
    }
    setNewFile({ name: "", owner:"", file: "" });
    setSelectedFile(null);
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
              placeholder='File Name'
              name='name'
              value={newFile.name}
              onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
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
            <Button colorScheme='blue' onClick={handleFileUpload} w='full'>Upload File</Button>
            <Button colorScheme='green' onClick={handleAddFile} w='full'>Add File</Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default CreatePage;