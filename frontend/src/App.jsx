import { Box, useColorModeValue } from "@chakra-ui/react"
import { Routes, Route } from "react-router-dom"
import CreatePage from "./pages/CreatePage";
import HomePage from "./pages/HomePage";
import Navbar from "./components/Navbar";


function App() {

  return (
    <Box minH={"100vh"} bg={useColorModeValue( "gray.300", "gray.9000")}>
     {/* <Navbar/> */}
     <Navbar/>
     <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/create" element={<CreatePage/>} />
     </Routes>
    </Box>
  );
}

export default App
