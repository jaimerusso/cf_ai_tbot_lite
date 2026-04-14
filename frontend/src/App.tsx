import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";

import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import HomeScreen from "./screens/HomeScreen";

function App() {
    const [count, setCount] = useState(0);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="/home" element={<HomeScreen />} />
                {/* <Route
                    path="/knowledge"
                    element={<KnowledgeScreen IP={IP} />}
                /> */}
            </Routes>
        </Router>
    );
}

export default App;
