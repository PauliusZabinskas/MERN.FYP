import { create } from "zustand";

export const usefileAPI = create((set) => ({
	files: [],
	setFile: (files) => set({ files }),
	createFile: async (newFile) => {
		if (!newFile.name || !newFile.file_path || !newFile.owner || !newFile.security_level) {
			return { success: false, message: "Please fill in all fields." };
		}
		const res = await fetch("/api/file", {
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
	fetchfiles: async () => {
		const res = await fetch("/api/file");
		const data = await res.json();
		set({ files: data.data });
	},
	deleteFile: async (pid) => {
		const res = await fetch(`/api/file/${pid}`, {
			method: "DELETE",
		});
		const data = await res.json();
		if (!data.success) return { success: false, message: data.message };

		// update the ui immediately, without needing a refresh
		set((state) => ({ files: state.files.filter((file) => file._id !== pid) }));
		return { success: true, message: data.message };
	},
	updateFile: async (pid, updatedFile) => {
		const res = await fetch(`/api/file/${pid}`, {
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
			files: state.files.map((file) => (file._id === pid ? data.data : file)),
		}));

		return { success: true, message: data.message };
	},
}));