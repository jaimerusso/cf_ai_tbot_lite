import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

import HomeScreen from "./screens/HomeScreen";
import DialogueScreen from "./screens/DialogueScreen";

function App() {
	// const IP = "https://cf-ai-tbot-lite-backend.itsjaimerusso.workers.dev/";
	const IP = "127.0.0.1:8787";

	return (
		<Router>
			<Routes>
				<Route path="/" element={<Navigate to="/home" />} />
				<Route path="/home" element={<HomeScreen />} />
				<Route path="/dialogue" element={<DialogueScreen IP={IP} />} />
				{/* <Route
                    path="/knowledge"
                    element={<KnowledgeScreen IP={IP} />}
                /> */}
			</Routes>
		</Router>
	);
}

export default App;
