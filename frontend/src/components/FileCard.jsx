import { DeleteIcon, EditIcon, DownloadIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Heading,
    HStack,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useColorModeValue,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { usefileAPI } from "../fetchAPI/fetch.file.js";
import { useState } from "react";
import axios from 'axios';

const FileCard = ({ file }) => {
    const [updatedFile, setUpdatedFile] = useState(file);

    const textColor = useColorModeValue("gray.600", "gray.200");
    const bg = useColorModeValue("white", "gray.800");

    const { deleteFile, updateFile } = usefileAPI();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleDeleteFile = async (id) => {
        const { success, message } = await deleteFile(id);
        if (!success) {
            toast({
                title: "Error",
                description: message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Success",
                description: message,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleUpdateFile = async (id, updatedFile) => {
        const { success, message } = await updateFile(id, updatedFile);
        onClose();
        if (!success) {
            toast({
                title: "Error",
                description: message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Success",
                description: "File updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleDownloadFile = async (cid) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/ipfs/download/${cid}`, {
                responseType: 'blob',
                withCredentials: true
            });
                
            if (!response.data) {
                throw new Error('File not found');
            }
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name);
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            toast({
                title: "Download Failed",
                description: error.message || "Could not download the file",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box
            shadow='lg'
            rounded='lg'
            overflow='hidden'
            transition='all 0.3s'
            _hover={{ transform: "translateY(-5px)", shadow: "xl" }}
            bg={bg}
        >

            <Box p={4}>
                <Heading as='h3' size='md' mb={2}>
                    {"Name: " + file.name}
                </Heading>

				<Text fontWeight='bold' fontSize='xxl' color={textColor} mb={4}>
                    {"Description: " + file.description}
                </Text>

                <Text fontWeight='bold' fontSize='xxl' color={textColor} mb={4}>
                    {"Owner: " + file.owner}
                </Text>

                <Text fontWeight='bold' fontSize='xxl' color={textColor} mb={4}>
                    {"File: " + file.cid}
                </Text>

                <HStack spacing={2}>
                    <IconButton icon={<EditIcon />} onClick={onOpen} colorScheme='blue' />
                    <IconButton
                        icon={<DeleteIcon />}
                        onClick={() => handleDeleteFile(file._id)}
                        colorScheme='red'
                    />
                    <IconButton
                        icon={<DownloadIcon />}
                        onClick={() => handleDownloadFile(file.cid)}
                        colorScheme='green'
                    />
                </HStack>
            </Box>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />

                <ModalContent>
                    <ModalHeader>Update File</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <Input
                                placeholder='Description'
                                name='description'
                                value={updatedFile.description}
                                onChange={(e) => setUpdatedFile({ ...updatedFile, description: e.target.value })}
                            />
                            <Input
                                placeholder='File Owner'
                                name='owner'
                                value={updatedFile.owner}
                                onChange={(e) => setUpdatedFile({ ...updatedFile, owner: e.target.value })}
                            />
                            <Input
                                placeholder='File'
                                name='file'
                                value={updatedFile.file_path}
                                onChange={(e) => setUpdatedFile({ ...updatedFile, file_path: e.target.value })}
                            />
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            colorScheme='blue'
                            mr={3}
                            onClick={() => handleUpdateFile(file._id, updatedFile)}
                        >
                            Update
                        </Button>
                        <Button variant='ghost' onClick={onClose}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default FileCard;