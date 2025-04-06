import { 
    Container, 
    SimpleGrid, 
    Text, 
    VStack, 
    useToast, 
    Tabs, 
    TabList, 
    TabPanels, 
    Tab, 
    TabPanel, 
    Heading 
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usefileAPI } from "../fetchAPI/fetch.file.js";
import FileCard from "../components/FileCard.jsx";

const HomePage = () => {
    const { fetchFiles, files } = usefileAPI();
    const [isLoading, setIsLoading] = useState(true);
    const [ownedFiles, setOwnedFiles] = useState([]);
    const [sharedFiles, setSharedFiles] = useState([]);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const loadFiles = async () => {
            try {
                const result = await fetchFiles();
                
                if (!result.success) {
                    toast({
                        title: "Error",
                        description: result.message || "Failed to load files",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                    });
                    
                    // If unauthorized, redirect to login
                    if (result.message === "Authentication required") {
                        navigate("/login");
                    }
                } else {
                    // Separate files into owned and shared
                    const owned = files.filter(file => file.accessType === 'owner');
                    // Filter out temporary shared files
                    const shared = files.filter(file => 
                        file.accessType === 'shared' && 
                        file.sharingMethod !== 'temporary'
                    );
                    
                    setOwnedFiles(owned);
                    setSharedFiles(shared);
                }
            } catch (error) {
                console.error("Error fetching files:", error);
                toast({
                    title: "Error",
                    description: "Failed to load files",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };
        
        loadFiles();
    }, [fetchFiles, navigate, toast, files]);

    return (
        <Container maxW='container.xl' py={12}>
            <VStack spacing={8}>
                <Heading
                    fontSize={"30"}
                    fontWeight={"bold"}
                    bgGradient={"linear(to-r, cyan.400, blue.500)"}
                    bgClip={"text"}
                    textAlign={"center"}
                >
                    Secure File Sharing 🚀
                </Heading>

                {isLoading ? (
                    <Text>Loading...</Text>
                ) : (
                    <Tabs width="100%" isFitted variant="enclosed">
                        <TabList mb="1em">
                            <Tab>My Files ({ownedFiles.length})</Tab>
                            <Tab>Shared With Me ({sharedFiles.length})</Tab>
                        </TabList>
                        <TabPanels>
                            {/* My Files Tab */}
                            <TabPanel>
                                {ownedFiles.length > 0 ? (
                                    <SimpleGrid
                                        columns={{
                                            base: 1,
                                            md: 2,
                                            lg: 3,
                                        }}
                                        spacing={10}
                                        w={"full"}
                                    >
                                        {ownedFiles.map((file) => (
                                            <FileCard key={file._id} file={file} />
                                        ))}
                                    </SimpleGrid>
                                ) : (
                                    <Text fontSize='xl' textAlign={"center"} fontWeight='bold' color='gray.500'>
                                        You haven't created any files yet 😢{" "}
                                        <Link to={"/create"}>
                                            <Text as='span' color='blue.500' _hover={{ textDecoration: "underline" }}>
                                                Create a file
                                            </Text>
                                        </Link>
                                    </Text>
                                )}
                            </TabPanel>
                            
                            {/* Shared With Me Tab */}
                            <TabPanel>
                                {sharedFiles.length > 0 ? (
                                    <SimpleGrid
                                        columns={{
                                            base: 1,
                                            md: 2,
                                            lg: 3,
                                        }}
                                        spacing={10}
                                        w={"full"}
                                    >
                                        {sharedFiles.map((file) => (
                                            <FileCard key={file._id} file={file} />
                                        ))}
                                    </SimpleGrid>
                                ) : (
                                    <Text fontSize='xl' textAlign={"center"} fontWeight='bold' color='gray.500'>
                                        No files have been shared with you yet
                                    </Text>
                                )}
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                )}
            </VStack>
        </Container>
    );
};

export default HomePage;