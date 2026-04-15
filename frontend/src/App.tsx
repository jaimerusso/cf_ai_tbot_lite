import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

import HomeScreen from "./screens/HomeScreen";
import DialogueScreen from "./screens/DialogueScreen";

function App() {
	//const [count, setCount] = useState(0);

	return (
		<Router>
			<Routes>
				<Route path="/" element={<Navigate to="/home" />} />
				<Route path="/home" element={<HomeScreen />} />
				<Route path="/dialogue" element={<DialogueScreen />} />
				{/* <Route
                    path="/knowledge"
                    element={<KnowledgeScreen IP={IP} />}
                /> */}
			</Routes>
		</Router>
	);
}

export default App;
