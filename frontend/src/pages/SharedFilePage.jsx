import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import {
    Box,
    Heading,
    Text,
    Button,
    VStack,
    useToast,
    Container,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { usefileAPI } from '../fetchAPI/fetch.file.js';

const SharedFilePage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [fileInfo, setFileInfo] = useState(null);
    const [error, setError] = useState(null);
    const location = useLocation();
    const toast = useToast();
    const { verifyShareToken, downloadFile } = usefileAPI();

    // Extract token and recipient from URL
    useEffect(() => {
        const checkToken = async () => {
            try {
                const params = new URLSearchParams(location.search);
                const token = params.get('token');
                const recipient = params.get('recipient');
                
                if (!token || !recipient) {
                    throw new Error('Invalid share link - missing token or recipient');
                }
                
                // Verify the token
                const result = await verifyShareToken(token);
                
                if (!result.success) {
                    throw new Error(result.message || 'This share link is invalid or expired');
                }
                
                // Set file info from successful verification
                setFileInfo({
                    ...result.fileInfo,
                    token,
                    recipient
                });
            } catch (err) {
                setError(err.message || 'Failed to verify share link');
                toast({
                    title: 'Error',
                    description: err.message || 'Failed to verify share link',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };
        
        checkToken();
    }, [location, verifyShareToken, toast]);
    
    const handleDownload = async () => {
        if (!fileInfo) return;
        
        try {
            console.log("Download requested for shared file:", fileInfo);
            
            if (!fileInfo.cid) {
                throw new Error("Missing file CID. Try refreshing the page.");
            }
            
            const result = await downloadFile({
                _id: fileInfo.fileId,
                name: fileInfo.fileName,
                cid: fileInfo.cid,
                shareToken: fileInfo.token,
                recipient: fileInfo.recipient
            });
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            toast({
                title: 'Success',
                description: 'File downloaded successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            console.error("Download error:", err);
            toast({
                title: 'Download Failed',
                description: err.message || 'Failed to download file',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Redirect if the user is not logged in
    // You can remove this if you want to allow access without authentication
    if (!isLoading && !localStorage.getItem('user')) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <Container maxW="container.md" py={8}>
            {isLoading ? (
                <VStack spacing={4} align="center">
                    <Spinner size="xl" />
                    <Text>Verifying share link...</Text>
                </VStack>
            ) : error ? (
                <Alert
                    status="error"
                    variant="subtle"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    height="200px"
                >
                    <AlertIcon boxSize="40px" mr={0} />
                    <AlertTitle mt={4} mb={1} fontSize="lg">
                        Share Link Error
                    </AlertTitle>
                    <AlertDescription maxWidth="sm">
                        {error}
                    </AlertDescription>
                </Alert>
            ) : (
                <VStack spacing={6} align="stretch">
                    <Heading size="lg">Shared File Access</Heading>
                    
                    <Box p={5} shadow="md" borderWidth="1px" rounded="md">
                        <Heading size="md">{fileInfo.fileName}</Heading>
                        <Text mt={2}>Shared by: {fileInfo.owner}</Text>
                        <Text>Your access: {fileInfo.permissions.join(', ')}</Text>
                        
                        <VStack mt={4} spacing={4} align="stretch">
                            {fileInfo.permissions.includes('download') && (
                                <Button colorScheme="blue" onClick={handleDownload}>
                                    Download File
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => window.history.back()}>
                                Go Back
                            </Button>
                        </VStack>
                    </Box>
                </VStack>
            )}
        </Container>
    );
};

export default SharedFilePage;