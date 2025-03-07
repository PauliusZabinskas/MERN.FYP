import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from '@chainsafe/libp2p-noise';
import { TextDecoder } from 'util';


// Polyfill CustomEvent
global.CustomEvent = class CustomEvent extends Event {
  constructor(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    super(event, params);
    this.detail = params.detail;
  }
};

// Create a libp2p instance
const libp2p = await createLibp2p({
  transports: [tcp()],
  streamMuxers: [yamux()],
  connectionEncryption: [noise()]
});

// Create a Helia node with the libp2p instance
const helia = await createHelia({ libp2p });

// Create a UnixFS instance
const heliaFs = unixfs(helia);

// Initialize the root directory CID
let rootDirCid = await heliaFs.addDirectory();
console.log('Initialized root directory CID:', rootDirCid.toString());

// Function to add a file to IPFS
export const addFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    const data = new Uint8Array(req.file.buffer);
    const fileCid = await heliaFs.addBytes(data);
    
    // Check if file already exists, if so remove before adding
    try {
      await heliaFs.stat(`${rootDirCid}/${req.file.originalname}`);
      await heliaFs.rm(`${rootDirCid}/${req.file.originalname}`);
    } catch (err) {
      if (err.code !== 'ERR_NOT_FOUND') {
        throw err;
      }
    }
    
    
    rootDirCid = await heliaFs.cp(fileCid, rootDirCid, req.file.originalname);
    console.log('Updated root directory CID:', rootDirCid.toString());
    res.send({ cid: fileCid.toString() });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('An error occurred while uploading the file.');
  }
};

// Function to retrieve a file from IPFS
export const getFile = async (req, res) => {
  try {
    const { cid } = req.params;

    // Check if the CID exists
    try {
      await heliaFs.stat(cid);
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND') {
        return res.status(404).send('File not found');
      }
      throw err;
    }

    const decoder = new TextDecoder();
    let content = '';
    for await (const chunk of heliaFs.cat(cid)) {
      content += decoder.decode(chunk, { stream: true });
    }
    res.send({ content });
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).send('An error occurred while retrieving the file.');
  }
};

// Function to get all files from IPFS
export const getAllFiles = async (req, res) => {
  try {
    const files = [];
    for await (const file of heliaFs.ls(rootDirCid)) {
      files.push({ name: file.name, cid: file.cid.toString() });
    }
    res.send({ files });
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).send('An error occurred while retrieving the files.');
  }
};