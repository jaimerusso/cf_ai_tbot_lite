import { useState } from "react";
import Input from "./Input";
import logo from "../../assets/CFxtbot.png";

export default function Chat() {
	const [messages, setMessages] = useState([]);

	return (
		<div className="flex flex-col w-5/6 h-full bg-black relative">
			<div className="flex-1">
				<div className="flex flex-1 flex-row pointer-events-none items-center bg-gradient-to-r from-cf to-tbot justify-center w-full h-full">
					<img src={logo} className="w-xl opacity-50"></img>
				</div>
			</div>
			<Input />
		</div>
	);
}
