import { Container, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { usefileAPI } from "../fetchAPI/fetch.file.js";
import FileCard from "../components/FileCard.jsx";

const HomePage = () => {
    const { fetchFiles, files } = usefileAPI();

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);
    console.log("files", files);

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

                {files.length === 0 && (
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