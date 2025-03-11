import { create } from "zustand";
import { encryptFile, decryptFile } from "../enc.dec/encryption.js";
import axios from 'axios';

export const usefileAPI = create((set) => ({
    files: [],
    setFile: (files) => set({ files }),
    createFile: async (newFile) => {
        if (!newFile.description || !newFile.owner || !newFile.file) {
            return { success: false, message: "Please fill in all fields." };
        }

        try {
            console.log("Starting file encryption process...");
            
            // Encrypt the file before uploading
            const encryptedFile = await encryptFile(newFile.file);
            console.log("File encrypted successfully:", encryptedFile.name);
            
            const formData = new FormData();
            formData.append('name', newFile.name);
            formData.append('description', newFile.description);
            formData.append('owner', newFile.owner);
            formData.append('file', encryptedFile);  // Use encrypted file
            
            console.log("Uploading encrypted file...");
            const res = await fetch("/api/file-details", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!data.success) {
                return { success: false, message: data.message };
            }

            set((state) => ({ files: [...state.files, data.data] }));
            return { success: true, message: "Encrypted file uploaded successfully" };
        } catch (error) {
            console.error("Error in createFile:", error);
            return { success: false, message: error.message || "Failed to encrypt and upload file" };
        }
    },
    
    downloadFile: async (file) => {
        try {
            console.log("Starting file download process for:", file.name);
            
            const response = await axios.get(`http://localhost:5000/api/ipfs/download/${file.cid}`, {
                responseType: 'blob',
                withCredentials: true
            });
                
            if (!response.data) {
                throw new Error('File not found');
            }
            
            console.log("File downloaded, starting decryption...");
            
            // Decrypt the file content
            const { content, fileName } = await decryptFile(response.data, file.name);
            console.log("File decrypted successfully:", fileName);
            
            // Create a download link for the decrypted content
            const url = window.URL.createObjectURL(new Blob([content]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return { success: true, message: "File downloaded and decrypted successfully" };
        } catch (error) {
            console.error("Download error:", error);
            return { success: false, message: error.message || "Failed to download and decrypt file" };
        }
    },
    
    fetchFiles: async () => {
        const res = await fetch("/api/file-details");
        const data = await res.json();
        set({ files: data.data });
    },
    
    deleteFile: async (id) => {
        const res = await fetch(`/api/file-details/${id}`, {
            method: "DELETE",
        });
        const data = await res.json();
        if (!data.success) return { success: false, message: data.message };

        // update the ui immediately, without needing a refresh
        set((state) => ({ files: state.files.filter((file) => file._id !== id) }));
        return { success: true, message: data.message };
    },
    
    updateFile: async (id, updatedFile) => {
        const res = await fetch(`/api/file-details/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedFile),
        });
        const data = await res.json();
        if (!data.success) return { success: false, message: data.message };

        // update the ui immediately, without needing a refresh
        set((state) => ({
            files: state.files.map((file) => (file._id === id ? data.data : file)),
        }));
        
        return { success: true, message: data.message };
    },
}));