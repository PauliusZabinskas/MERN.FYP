import React, { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Input,
    VStack,
    Text,
    useToast,
    HStack,
    Checkbox,
    Divider,
    InputGroup,
    InputRightElement,
    IconButton,
    Box,
    Tooltip,
    Badge,
    Select
} from '@chakra-ui/react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { usefileAPI } from '../fetchAPI/fetch.file.js';

// Expiration options in seconds
const expirationOptions = {
    "5 minutes": 5 * 60,
    "1 hour": 60 * 60,
    "1 day": 24 * 60 * 60,
    "7 days": 7 * 24 * 60 * 60
};

// Badge colors for different expiration times
const expirationColors = {
    "5 minutes": "red",
    "1 hour": "orange",
    "1 day": "blue",
    "7 days": "purple"
};

const ShareModal = ({ isOpen, onClose, file }) => {
    const [email, setEmail] = useState('');
    const [shareLink, setShareLink] = useState('');
    const [permissions, setPermissions] = useState({ read: true, download: true });
    const [expiration, setExpiration] = useState("7 days"); // Default to 7 days
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const { shareFile, createShareLink } = usefileAPI();
    const toast = useToast();

    // For regular sharing (adding to sharedWith array)
    const handleRegularShare = async () => {
        if (!email.trim()) {
            toast({
                title: "Error",
                description: "Please enter an email address",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);
        const { success, message } = await shareFile(file._id, [email]);
        setIsLoading(false);

        toast({
            title: success ? "Success" : "Error",
            description: message,
            status: success ? "success" : "error",
            duration: 3000,
            isClosable: true,
        });

        if (success) {
            setEmail('');
        }
    };

    // For token-based sharing (generating a link)
    const handleGenerateLink = async () => {
        if (!email.trim()) {
            toast({
                title: "Error",
                description: "Please enter a recipient email address",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);
        
        // Get the selected permissions
        const permissionsArray = [];
        if (permissions.read) permissionsArray.push('read');
        if (permissions.download) permissionsArray.push('download');
        
        // Get the expiration time in seconds
        const expiresIn = expirationOptions[expiration];
        
        // Generate the share link
        const result = await createShareLink(file._id, email, permissionsArray, expiresIn);
        
        setIsLoading(false);
        
        if (result.success) {
            setShareLink(result.shareLink);
            setCopied(result.copied);
            
            toast({
                title: "Success",
                description: result.message,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Error",
                description: result.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            toast({
                title: "Success",
                description: "Link copied to clipboard",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to copy to clipboard",
                status: "error",
                duration: 2000,
                isClosable: true,
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Share {file?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text fontWeight="bold">Add to shared users list</Text>
                        <Input
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button 
                            colorScheme="blue" 
                            isLoading={isLoading} 
                            onClick={handleRegularShare}
                        >
                            Share with this user
                        </Button>
                        
                        <Divider my={3} />
                        
                        <Text fontWeight="bold">OR Generate a share link</Text>
                        <Text fontSize="sm">
                            Create a secure link that allows temporary access to this file
                        </Text>
                        
                        <Box>
                            <Text mb={2}>Recipient email:</Text>
                            <Input
                                placeholder="recipient@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                mb={3}
                            />
                            
                            <Text mb={2}>Permissions:</Text>
                            <HStack spacing={5} mb={4}>
                                <Checkbox
                                    isChecked={permissions.read}
                                    onChange={(e) => setPermissions({...permissions, read: e.target.checked})}
                                >
                                    Read
                                </Checkbox>
                                <Checkbox
                                    isChecked={permissions.download}
                                    onChange={(e) => setPermissions({...permissions, download: e.target.checked})}
                                >
                                    Download
                                </Checkbox>
                            </HStack>
                            
                            <Text mb={2}>Link expiration:</Text>
                            <Select 
                                value={expiration}
                                onChange={(e) => setExpiration(e.target.value)}
                                mb={4}
                            >
                                {Object.keys(expirationOptions).map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </Select>
                            
                            <Button 
                                colorScheme="green" 
                                isLoading={isLoading} 
                                onClick={handleGenerateLink}
                                disabled={!permissions.read && !permissions.download}
                                mb={4}
                                width="100%"
                            >
                                Generate Share Link
                            </Button>
                        </Box>
                        
                        {shareLink && (
                            <Box mt={2}>
                                <Text fontSize="sm" fontWeight="bold" mb={1}>
                                    Share link: <Badge colorScheme={expirationColors[expiration]}>Expires in {expiration}</Badge>
                                </Text>
                                <InputGroup>
                                    <Input 
                                        value={shareLink} 
                                        isReadOnly 
                                    />
                                    <InputRightElement>
                                        <Tooltip label={copied ? "Copied!" : "Copy to clipboard"}>
                                            <IconButton
                                                icon={copied ? <CheckIcon /> : <CopyIcon />}
                                                onClick={handleCopyLink}
                                                size="sm"
                                                colorScheme={copied ? "green" : "blue"}
                                                aria-label="Copy share link"
                                            />
                                        </Tooltip>
                                    </InputRightElement>
                                </InputGroup>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ShareModal;