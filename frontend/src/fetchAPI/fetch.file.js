import { create } from "zustand";

export const usefileAPI = create((set) => ({
    files: [],
    setFile: (files) => set({ files }),
    createFile: async (newFile) => {
        if (!newFile.name || !newFile.file_path || !newFile.owner || !newFile.security_level) {
            return { success: false, message: "Please fill in all fields." };
        }
        const res = await fetch("/api/file-details", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newFile),
        });
        const data = await res.json();
        set((state) => ({ files: [...state.files, data.data] }));
        return { success: true, message: "File created successfully" };
    },
    fetchFiles: async () => {
        const res = await fetch("/api/file-details");
        const data = await res.json();
        set({ files: data.data });
    },
    deleteFile: async (id) => {
        const res = await fetch(`/api/file/${id}`, {
            method: "DELETE",
        });
        const data = await res.json();
        if (!data.success) return { success: false, message: data.message };

        // update the ui immediately, without needing a refresh
        set((state) => ({ files: state.files.filter((file) => file._id !== id) }));
        return { success: true, message: data.message };
    },
    updateFile: async (id, updatedFile) => {
        const res = await fetch(`/api/file/${id}`, {
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