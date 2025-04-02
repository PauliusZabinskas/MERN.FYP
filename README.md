# MERN.FYP
Secure File Sharing Application Design Documentation
Overview
This application is a secure file-sharing platform built using the MERN stack (MongoDB, Express.js, React, Node.js). It provides end-to-end encrypted file storage and sharing capabilities, with file content stored on IPFS (InterPlanetary File System) and metadata stored in MongoDB.

Architecture
Frontend (React)
The frontend is built with React and uses:

Chakra UI for component styling and theming
React Router for navigation
JWT for auth token management via HTTP-only cookies
Backend (Node.js/Express)
The backend provides:

REST API endpoints for user authentication, file management, and sharing
JWT authentication using HTTP-only cookies
MongoDB for storing user data and file metadata
IPFS integration for decentralized file storage
Core Features
User Authentication
Registration and Login: Users can create accounts and authenticate
Cookie-based JWT Auth: Tokens are stored in HTTP-only cookies for security
Session Verification: Server-side verification of user sessions
File Management
Upload: Users can upload and encrypt files
Download: Retrieve and decrypt files
Update: Modify file metadata
Delete: Remove files from the system
File Sharing
Multiple Sharing Methods: Permanent and temporary sharing options
Expirable Links: Time-limited access to shared files
Permission-based Access Control: Granular control over what shared users can do
Component Structure
Frontend Components
Pages:

RegisterPage: User registration
LoginPage: User authentication
HomePage: Dashboard showing owned and shared files
CreatePage: Interface for creating and uploading new files
SharedFilePage: View for accessing shared files
UI Components:

Navbar: Site navigation and user actions
FileCard: Display file information and actions
ShareModal: Interface for sharing files
Various UI elements (buttons, inputs, dialogs, etc.)
Backend Components
Controllers:

auth.controller.js: User authentication logic
ipfs.controller.js: IPFS storage operations
mongoDB.controller.js: Database operations
shareToken.controller.js: File sharing functionality
Models:

userModel.js: User data schema
file.model.js: File metadata schema
Middleware:

authMiddleware.js: Authentication and authorization checks
Security Features
End-to-End Encryption: Files are encrypted before storage
HTTP-Only Cookies: Prevents client-side access to auth tokens
Share Token Validation: Secure sharing with expirable tokens
Permission-Based Access: Granular control over shared file actions
Data Flow
Authentication Flow:

User submits credentials
Server validates credentials and issues JWT
Token stored in HTTP-only cookie
Frontend uses token for API requests
File Upload Flow:

Client encrypts file content
Uploads encrypted data to server
Server stores file in IPFS
Metadata saved to MongoDB
File Sharing Flow:

Owner generates share token with permissions and expiry
Recipient receives token via link
Server validates token on access
Access granted based on token permissions
State Management
Local component state for UI interactions
Context/hooks for managing authentication state
Server-side session validation
Testing Strategy
Unit Tests: Testing individual components and functions
API Tests: Testing endpoint behaviors
Authentication Tests: Verifying auth workflows and middleware
Technical Choices
Chakra UI: Provides accessible, responsive components with dark/light theme support
JWT with HTTP-only Cookies: Secure authentication that prevents XSS attacks
IPFS: Decentralized file storage that enhances security and availability
MongoDB: Flexible schema for evolving data requirements
Future Enhancements
Enhanced file preview capabilities
Multi-factor authentication
Advanced file permission management
Improved real-time collaboration features
Conclusion
This secure file sharing application combines modern web technologies with encryption and decentralized storage to provide a secure platform for sharing sensitive files. The authentication system based on HTTP-only cookies provides strong security against common web attacks, while the decentralized storage ensures data availability and integrity.