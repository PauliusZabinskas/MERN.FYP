import React, { useState } from "react";
import { Box, Button, Container, Heading, Input, useColorModeValue, useToast, VStack } from "@chakra-ui/react";

import { usefileAPI } from "../fetchAPI/fetch.file.js";

const CreatePage = () => {
  const [newFile, setNewFile] = React.useState({
    name: "",
    size: "",
    security_level: "",
    owner: "",
    file_path: ""
  });

  const toast = useToast();

	const { createFile } = usefileAPI();

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
		setNewFile({ name: "", size: "", security_level:"", owner:"" , file_path: "" });
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
							placeholder='File size'
							name='size'
              type="number"
							value={newFile.size}
							onChange={(e) => setNewFile({ ...newFile, size: e.target.value })}
						/>
            <Input
							placeholder='File security_level ( min:1- max:5)'
							name='security_level'
              type="number"
							value={newFile.security_level}
							onChange={(e) => setNewFile({ ...newFile, security_level: e.target.value })}
						/>
						<Input
							placeholder='file owner'
							name='owner'
							value={newFile.owner}
							onChange={(e) => setNewFile({ ...newFile, owner: e.target.value })}
						/>
						<Input
							placeholder='file URL'
							name='file_path'
							value={newFile.file_path}
							onChange={(e) => setNewFile({ ...newFile, file_path: e.target.value })}
						/>

						<Button colorScheme='blue' onClick={handleAddFile} w='full'>
							Add File
						</Button>
					</VStack>
				</Box>
			</VStack>
		</Container>
	);
};
export default CreatePage;