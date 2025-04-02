import { Box, useColorModeValue } from "@chakra-ui/react"
import { Routes, Route } from "react-router-dom"
import CreatePage from "./pages/CreatePage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/protectRoute";
import SharedFilePage from './pages/SharedFilePage';

function App() {
  return (
    <Box minH={"100vh"} bg={useColorModeValue("gray.300", "gray.9000")}>
      <Navbar />
      <Routes>
        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <CreatePage />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RegisterPage />} />
        <Route path="/shared" element={<SharedFilePage />} />
      </Routes>
    </Box>
  );
}

export default App;