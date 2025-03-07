import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from '@chainsafe/libp2p-noise';
import fs from 'fs';
import { TextEncoder, TextDecoder } from 'util';
import { EventTarget, defineEventAttribute } from 'event-target-shim'; // Import EventTarget and defineEventAttribute

// Polyfill CustomEvent
global.CustomEvent = class CustomEvent extends Event {
  constructor(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    super(event, params);
    this.detail = params.detail;
  }
};

// Create a libp2p instance without the deprecated pnet protector
const libp2p = await createLibp2p({
  transports: [tcp()],
  streamMuxers: [yamux()],
  connectionEncryption: [noise()]
});

// Create a Helia node with the libp2p instance
const helia = await createHelia({ libp2p });

// Create a UnixFS instance
const heliaFs = unixfs(helia);

// Function to add a file to IPFS
export const addFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    const data = new Uint8Array(req.file.buffer);
    const cid = await heliaFs.addBytes(data);
    res.send({ cid: cid.toString() });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('An error occurred while uploading the file.');
  }
};

// Function to retrieve a file from IPFS
export const getFile = async (req, res) => {
  try {
    const { cid } = req.params;

    // Check if the file exists
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
    for await (const file of heliaFs.ls('/')) {
      files.push(file);
    }
    res.send({ files });
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).send('An error occurred while retrieving the files.');
  }
};