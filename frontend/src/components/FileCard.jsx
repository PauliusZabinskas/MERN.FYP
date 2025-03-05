import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
	Box,
	Button,
	Heading,
	HStack,
	IconButton,
	Image,
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

	return (
		<Box
			shadow='lg'
			rounded='lg'
			overflow='hidden'
			transition='all 0.3s'
			_hover={{ transform: "translateY(-5px)", shadow: "xl" }}
			bg={bg}
		>
			<Image src={file.image} alt={file.name} h={48} w='full' objectFit='cover' />

			<Box p={4}>
				<Heading as='h3' size='md' mb={2}>
					{file.name}
				</Heading>

				<Text fontWeight='bold' fontSize='xl' color={textColor} mb={4}>
					${file.price}
				</Text>

				<HStack spacing={2}>
					<IconButton icon={<EditIcon />} onClick={onOpen} colorScheme='blue' />
					<IconButton
						icon={<DeleteIcon />}
						onClick={() => handleDeleteFile(file._id)}
						colorScheme='red'
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
								placeholder='File Name'
								name='name'
								value={updatedFile.name}
								onChange={(e) => setUpdatedFile({ ...updatedFile, name: e.target.value })}
							/>
							<Input
								placeholder='File Size'
								name='size'
								type='number'
								value={updatedFile.size}
								onChange={(e) => setUpdatedFile({ ...updatedFile, size: e.target.value })}
							/>
							<Input
								placeholder='Security Level'
								name='security_level'
                                type='number'
								value={updatedFile.security_level}
								onChange={(e) => setUpdatedFile({ ...updatedFile, security_level: e.target.value })}
							/>
                            <Input
								placeholder='File Owner'
								name='owner'
								value={updatedFile.owner}
								onChange={(e) => setUpdatedFile({ ...updatedFile, owner: e.target.value })}
							/>
                            <Input
								placeholder='File URL'
								name='file_path'
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