import { create } from "zustand";
import { encryptFile, decryptFile } from "../enc.dec/encryption.js";
import axios from 'axios';

export const usefileAPI = create((set) => ({
    files: [],
    setFile: (files) => set({ files }),

    shareFile: async (id, emails) => {
        try {
            const res = await fetch(`/api/file-details/${id}/share`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ emails }),
                credentials: 'include'
            });
            
            const data = await res.json();
            if (!data.success) return { success: false, message: data.message };
    
            // Update the file in state with new sharing settings
            set((state) => ({
                files: state.files.map((file) => (file._id === id ? data.data : file)),
            }));
            
            return { success: true, message: "File shared successfully" };
        } catch (error) {
            console.error("Error sharing file:", error);
            return { success: false, message: error.message || "Failed to share file" };
        }
    },
    
    unshareFile: async (id, emails) => {
        try {
            const res = await fetch(`/api/file-details/${id}/unshare`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ emails }),
                credentials: 'include'
            });
            
            const data = await res.json();
            if (!data.success) return { success: false, message: data.message };
    
            // Update the file in state with new sharing settings
            set((state) => ({
                files: state.files.map((file) => (file._id === id ? data.data : file)),
            }));
            
            return { success: true, message: "Sharing permission removed successfully" };
        } catch (error) {
            console.error("Error removing share:", error);
            return { success: false, message: error.message || "Failed to remove sharing permission" };
        }
    },
    
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
            
            // Use axios instead of fetch for consistent handling with credentials
            const response = await axios.post("/api/file-details", formData, {
                withCredentials: true, // This will send cookies automatically
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            // Axios automatically throws for non-2xx responses, so if we get here the request succeeded
            const data = response.data;
            
            if (!data.success) {
                return { success: false, message: data.message };
            }
    
            set((state) => ({ files: [...state.files, data.data] }));
            return { success: true, message: "Encrypted file uploaded successfully" };
        } catch (error) {
            console.error("Error in createFile:", error);
            
            // Check if it's a response error with a message
            if (error.response && error.response.data) {
                return { 
                    success: false, 
                    message: error.response.data.message || `Server returned ${error.response.status}`
                };
            }
            
            return { success: false, message: error.message || "Failed to encrypt and upload file" };
        }
    },
    
    downloadFile: async (file) => {
        try {
            console.log("Starting file download process for:", file.name);
            
            const response = await axios.get(`/api/ipfs/download/${file.cid}`, {
                responseType: 'blob',
                withCredentials: true, // This will send cookies automatically
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
        try {
            
            const res = await fetch("/api/file-details", {
                credentials: 'include' // This will send cookies automatically
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch files");
            }
            
            const data = await res.json();
            set({ files: data.data });
            return { success: true };
        } catch (error) {
            console.error("Error fetching files:", error);
            return { success: false, message: error.message };
        }
    },
    
    deleteFile: async (id) => {
        try {
           
            const res = await fetch(`/api/file-details/${id}`, {
                method: "DELETE",
                credentials: 'include' // This will send cookies automatically
            });
            
            const data = await res.json();
            if (!data.success) return { success: false, message: data.message };
    
            // update the ui immediately, without needing a refresh
            set((state) => ({ files: state.files.filter((file) => file._id !== id) }));
            return { success: true, message: data.message };
        } catch (error) {
            console.error("Error deleting file:", error);
            return { success: false, message: error.message || "Failed to delete file" };
        }
    },
    
    updateFile: async (id, updatedFile) => {
        try {
           
            const res = await fetch(`/api/file-details/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedFile),
                credentials: 'include' // This will send cookies automatically
            });
            
            const data = await res.json();
            if (!data.success) return { success: false, message: data.message };
    
            // update the ui immediately, without needing a refresh
            set((state) => ({
                files: state.files.map((file) => (file._id === id ? data.data : file)),
            }));
            
            return { success: true, message: data.message };
        } catch (error) {
            console.error("Error updating file:", error);
            return { success: false, message: error.message || "Failed to update file" };
        }
    },
}));