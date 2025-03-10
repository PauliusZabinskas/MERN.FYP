import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

// IPFS node endpoint
const ipfsEndpoint = 'http://localhost:5001/api/v0';

// Function to add a file to IPFS
export const addFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    // Create a form data object
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    // Add the file to IPFS
    const response = await axios.post(`${ipfsEndpoint}/add`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    const fileCid = response.data.Hash;
    res.send({ cid: fileCid });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('An error occurred while uploading the file.');
  }
};

// Function to retrieve a file from IPFS
export const getFile = async (req, res) => {
  try {
    const { cid } = req.params;

    // Retrieve the file from IPFS
    const response = await axios.post(`${ipfsEndpoint}/cat`, null, {
      params: { arg: cid },
      responseType: 'arraybuffer',
    });

    res.send(response.data);
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).send('An error occurred while retrieving the file.');
  }
};

// Function to get all files from IPFS (assuming you have a way to list all files)
export const getAllFiles = async (req, res) => {
  try {
    // This is a placeholder function. IPFS does not have a built-in way to list all files.
    // You would need to implement your own way to track and list all files.
    res.status(501).send('Not implemented');
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).send('An error occurred while retrieving the files.');
  }
};

export const downloadFile = async (req, res) => {
  try {
    const { cid } = req.params;

    // Retrieve the file from IPFS using axios (consistent with other functions)
    const response = await axios.post(`${ipfsEndpoint}/cat`, null, {
      params: { arg: cid },
      responseType: 'arraybuffer',
    });

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${cid}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(response.data);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
};