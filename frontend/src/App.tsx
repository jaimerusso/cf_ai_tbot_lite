import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

import HomeScreen from "./screens/HomeScreen";
import DialogueScreen from "./screens/DialogueScreen";
import KnowledgeScreen from "./screens/KnowledgeScreen";

function App() {
	const IP = import.meta.env.VITE_API_IP;
	const isSecure = window.location.protocol === "https:";
	const httpUrl = `${isSecure ? "https" : "http"}://${IP}`;
	const wsUrl = `${isSecure ? "wss" : "ws"}://${IP}`;

	return (
		<Router>
			<Routes>
				<Route path="/" element={<Navigate to="/home" />} />
				<Route path="/home" element={<HomeScreen />} />
				<Route
					path="/dialogue"
					element={<DialogueScreen httpUrl={httpUrl} wsUrl={wsUrl} />}
				/>
				<Route
					path="/knowledge"
					element={<KnowledgeScreen httpUrl={httpUrl} />}
				/>
			</Routes>
		</Router>
	);
}

export default App;
