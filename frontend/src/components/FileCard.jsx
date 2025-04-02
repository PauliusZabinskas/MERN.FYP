import { DeleteIcon, EditIcon, DownloadIcon } from "@chakra-ui/icons";
import { FaShare } from "react-icons/fa"; // Import Share icon from react-icons
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
    Tag,
    Text,
    useColorModeValue,
    useDisclosure,
    useToast,
    VStack,
    Tooltip,
    Badge,
} from "@chakra-ui/react";
import { usefileAPI } from "../fetchAPI/fetch.file.js";
import { useState } from "react"
import ShareModal from './ShareModal';

const FileCard = ({ file }) => {
    const [updatedFile, setUpdatedFile] = useState(file);
    const [shareEmails, setShareEmails] = useState("");
    const [isOwner, setIsOwner] = useState(file.accessType === 'owner');

    const textColor = useColorModeValue("gray.600", "gray.200");
    const bg = useColorModeValue("white", "gray.800");

    const { deleteFile, updateFile, downloadFile, shareFile, unshareFile } = usefileAPI();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { 
      isOpen: isShareOpen, 
      onOpen: onShareOpen, 
      onClose: onShareClose 
    } = useDisclosure();

    const formatExpiryTime = (timestamp) => {
        if (!timestamp) return null;
        
        const expiryDate = new Date(timestamp * 1000);
        const now = new Date();
        
        // Calculate difference in days
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            return `${diffDays} days`;
        } else if (diffDays === 1) {
            return "1 day";
        } else {
            // Less than a day, show hours
            const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
            return diffHours > 0 ? `${diffHours} hours` : "< 1 hour";
        }
    };

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

    const handleDownloadFile = async () => {
        try {
            // Check if this is a file shared via token and we have necessary token info
            const downloadInfo = { ...file };
            
            // If this file was shared via token, find the token info
            if (file.tokenSharedWith && file.tokenSharedWith.length > 0 && !isOwner) {
                // Find token info for the current user
                const currentUser = JSON.parse(localStorage.getItem('user'));
                const userEmail = currentUser?.email;
                
                if (userEmail) {
                    const tokenInfo = file.tokenSharedWith.find(t => t.recipient === userEmail);
                    if (tokenInfo) {
                        // Add token info to download request
                        downloadInfo.shareToken = tokenInfo.token;
                        downloadInfo.recipient = userEmail;
                    }
                }
            }
            
            const { success, message } = await downloadFile(downloadInfo);
            
            if (!success) {
                throw new Error(message);
            }
            
            toast({
                title: "Download Successful",
                description: "File decrypted and downloaded successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
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

    const handleShareFile = async () => {
        if (!shareEmails.trim()) {
            toast({
                title: "Error",
                description: "Please enter at least one email",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Split by commas and trim whitespace
        const emailList = shareEmails.split(',').map(email => email.trim());
        
        const { success, message } = await shareFile(file._id, emailList);
        
        if (success) {
            toast({
                title: "Success",
                description: "File shared successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            setShareEmails("");
            onShareClose();
        } else {
            toast({
                title: "Error",
                description: message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleRemoveShare = async (email) => {
        const { success, message } = await unshareFile(file._id, [email]);
        
        if (success) {
            toast({
                title: "Success",
                description: `Sharing removed for ${email}`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Error",
                description: message,
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
                <HStack justify="space-between" mb={2}>
                    <Heading as='h3' size='md'>
                        {file.name}
                    </Heading>
                    {!isOwner && (
                    <HStack spacing={1} flexWrap="wrap">
                        <Badge colorScheme="purple">Shared with me</Badge>
                        {file.sharingMethod === 'temporary' && file.expiryInfo && (
                            <Tooltip label={`Expires in ${formatExpiryTime(file.expiryInfo.expiresAt)}`}>
                                <Badge colorScheme="orange" whiteSpace="nowrap">Temporary</Badge>
                            </Tooltip>
                        )}
                    </HStack>
                )}
                </HStack>

                <Text fontWeight='bold' fontSize='sm' color={textColor} mb={2}>
                    Description: {file.description}
                </Text>

                <Text fontSize='sm' color={textColor} mb={2}>
                    Owner: {file.owner}
                </Text>

                {isOwner && file.sharedWith && file.sharedWith.length > 0 && (
                    <Box mb={4}>
                        <Text fontSize='sm' fontWeight="bold" mb={1}>Shared with:</Text>
                        <HStack spacing={2} flexWrap="wrap">
                            {file.sharedWith.map((email, index) => (
                                <Tag 
                                    size="sm" 
                                    key={index}
                                    colorScheme="blue"
                                >
                                    {email}
                                    <Button
                                        size="xs"
                                        ml={1}
                                        onClick={() => handleRemoveShare(email)}
                                    >
                                        ✕
                                    </Button>
                                </Tag>
                            ))}
                        </HStack>
                    </Box>
                )}

                <HStack spacing={2} mt={4}>
                    {isOwner && (
                        <>
                            <Tooltip label="Edit file">
                                <IconButton 
                                    icon={<EditIcon />} 
                                    onClick={onOpen} 
                                    colorScheme='blue' 
                                    aria-label="Edit file"
                                />
                            </Tooltip>
                            
                            <Tooltip label="Delete file">
                                <IconButton
                                    icon={<DeleteIcon />}
                                    onClick={() => handleDeleteFile(file._id)}
                                    colorScheme='red'
                                    aria-label="Delete file"
                                />
                            </Tooltip>
                            
                            <Tooltip label="Share file">
                                <IconButton
                                    icon={<FaShare />} // Using FaShare instead of ShareIcon
                                    onClick={onShareOpen}
                                    colorScheme='green'
                                    aria-label="Share file"
                                />
                            </Tooltip>
                        </>
                    )}
                    
                    <Tooltip label="Download file">
                        <IconButton
                            icon={<DownloadIcon />}
                            onClick={handleDownloadFile}
                            colorScheme={isOwner ? 'green' : 'blue'}
                            aria-label="Download file"
                        />
                    </Tooltip>
                </HStack>
            </Box>

            {/* Edit Modal */}
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

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareOpen}
                onClose={onShareClose}
                file={file}
            />
        </Box>
    );
};

export default FileCard;