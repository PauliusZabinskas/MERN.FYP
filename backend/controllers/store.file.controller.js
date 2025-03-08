// import multer from 'multer';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // working directory
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, '../uploads');
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname);
//   }
// });
// const upload = multer({ storage });

// export const uploadFile = upload.single('file');

// export const handleFileUpload = (req, res) => {
//   if (!req.file) {
//     return res.status(400).send('No file uploaded.');
//   }
//   console.log('File received:', req.file);
//   res.send('File uploaded');
// };

// export const getFile = (req, res) => {
//   const filename = req.params.filename;
//   const filePath = path.join(__dirname, '../uploads', filename);

//   if (fs.existsSync(filePath)) {
//     res.sendFile(filePath);
//   } else {
//     res.status(404).send('File not found');
//   }
// };

// export const getAllFiles = (req, res) => {
//   const uploadPath = path.join(__dirname, '../uploads');
//   fs.readdir(uploadPath, (err, files) => {
//     if (err) {
//       console.error('Failed to list files', err);
//       res.status(500).send('Failed to list files');
//     } else {
//       res.status(200).json({ files });
//     }
//   });
// }

// export const deleteFile = (req, res) => {
//   const filename = req.params.filename;
//   const filePath = path.join(__dirname, '../uploads', filename);

//   if (fs.existsSync(filePath)) {
//     fs.unlink(filePath, (err) => {
//       if (err) {
//         console.error('Failed to delete file', err);
//         res.status(500).send('Failed to delete file');
//       } else {
//         res.status(200).send('File deleted');
//       }
//     });
//   } else {
//     res.status(404).send('File not found');
//   }
// };
