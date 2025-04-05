import CryptoJS from 'crypto-js';

// Fixed encryption key - replace with a strong key in production
const ENCRYPTION_KEY = 'a2SdfGH67*kLp0qWerty123!@#';

/**
 * Encrypts the content of a text file
 * @param {string} content - The content of the file to encrypt
 * @returns {string} - The encrypted content as a string
 */
export const encryptContent = (content) => {
  try {
    // Encrypt the content using AES with the fixed key
    const encrypted = CryptoJS.AES.encrypt(content, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt content');
  }
};

/**
 * Decrypts the content of a text file
 * @param {string} encryptedContent - The encrypted content
 * @returns {string} - The decrypted content
 */
export const decryptContent = (encryptedContent) => {
  try {
    // Decrypt the content using AES with the fixed key
    const bytes = CryptoJS.AES.decrypt(encryptedContent, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Failed to decrypt data - possibly corrupted');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt content: ' + error.message);
  }
};

/**
 * Processes a file for encryption before uploading
 * @param {File} file - The file object to process
 * @returns {Promise<File>} - A new File object with encrypted content
 */
export const encryptFile = async (file) => {
    console.log("encryptFile called with:", file.name, file.type, file.size);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          console.log("File content read:", content.substring(0, 50) + (content.length > 50 ? "..." : ""));
          
          // Now try to encrypt the actual file content
          const encrypted = encryptContent(content);
          console.log("Encrypted content:", encrypted.substring(0, 50) + "...");
          
          // Create a new file with encrypted content
          const encryptedFile = new File(
            [encrypted], 
            file.name + '.encrypted', 
            { type: 'text/plain' }
          );
          
          console.log("Created encrypted file:", encryptedFile.name, encryptedFile.type, encryptedFile.size);
          
          resolve(encryptedFile);
        } catch (error) {
          console.error("Encryption error in reader.onload:", error);
          reject(error);
        }
      };
      
      reader.onerror = (event) => {
        console.error("FileReader error:", event);
        reject(new Error('Failed to read file: ' + event.target.error));
      };
      
      console.log("Starting to read file as text...");
      reader.readAsText(file);
    });
};

/**
 * Decrypts a downloaded file
 * @param {Blob} encryptedBlob - The encrypted file content as a Blob
 * @param {string} originalFileName - The original file name
 * @returns {Promise<{content: string, fileName: string}>} - The decrypted content and filename
 */
export const decryptFile = async (encryptedBlob, originalFileName) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const encryptedContent = event.target.result;
        const decrypted = decryptContent(encryptedContent);
        
        // Remove .encrypted extension if present
        const fileName = originalFileName.endsWith('.encrypted') 
          ? originalFileName.slice(0, -10) 
          : originalFileName;
        
        resolve({ content: decrypted, fileName });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read encrypted file'));
    };
    
    reader.readAsText(encryptedBlob);
  });
};

// Test function - can be called from browser console
window.testEncryption = async () => {
    const testContent = "This is a test of the encryption system.";
    
    // Test encryption
    const encrypted = encryptContent(testContent);
    console.log("Encrypted:", encrypted);
    
    // Test decryption
    const decrypted = decryptContent(encrypted);
    console.log("Decrypted:", decrypted);
    
    return { 
      original: testContent, 
      encrypted: encrypted, 
      decrypted: decrypted,
      success: testContent === decrypted
    };
  };