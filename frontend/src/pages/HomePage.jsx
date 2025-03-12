import { Container, SimpleGrid, Text, VStack, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usefileAPI } from "../fetchAPI/fetch.file.js";
import FileCard from "../components/FileCard.jsx";

const HomePage = () => {
    const { fetchFiles, files } = usefileAPI();
    const [isLoading, setIsLoading] = useState(true);
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
    }, [fetchFiles, navigate, toast]);

    return (
        <Container maxW='container.xl' py={12}>
            <VStack spacing={8}>
                <Text
                    fontSize={"30"}
                    fontWeight={"bold"}
                    bgGradient={"linear(to-r, cyan.400, blue.500)"}
                    bgClip={"text"}
                    textAlign={"center"}
                >
                    Current Files 🚀
                </Text>

                {isLoading ? (
                    <Text>Loading...</Text>
                ) : (
                    <SimpleGrid
                        columns={{
                            base: 1,
                            md: 2,
                            lg: 3,
                        }}
                        spacing={10}
                        w={"full"}
                    >
                        {files.map((file) => (
                            <FileCard key={file._id} file={file} />
                        ))}
                    </SimpleGrid>
                )}

                {!isLoading && files.length === 0 && (
                    <Text fontSize='xl' textAlign={"center"} fontWeight='bold' color='gray.500'>
                        No files found 😢{" "}
                        <Link to={"/create"}>
                            <Text as='span' color='blue.500' _hover={{ textDecoration: "underline" }}>
                                Create a file
                            </Text>
                        </Link>
                    </Text>
                )}
            </VStack>
        </Container>
    );
};

export default HomePage;