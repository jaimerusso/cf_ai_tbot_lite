import { useEffect, useRef, useState } from "react";
import Input from "./Input";
import logo from "../../assets/CFxtbot.png";
import axios from "axios";
import Messages from "./Messages";
import Header from "./Header";

export interface Message {
	role: string;
	content: string;
}

export default function Chat({ IP }: { IP: string }) {
	const [waitingResponse, setWaitingResponse] = useState(false); //State to track if waiting for response from server (loading state)
	const [messages, setMessages] = useState<Message[]>([]); //Dialogue messages
	const ws = useRef<WebSocket | null>(null);

	const sendMessage = (prompt: string) => {
		const socket = ws.current;

		//Send message if socket is open
		if (socket && socket.readyState === WebSocket.OPEN) {
			//Update messages with user prompt
			setMessages((prev) => [
				...prev,
				{
					role: "user",
					content: prompt,
				},
			]);

			setWaitingResponse(true);

			console.log("Sending message:", prompt);
			socket.send(prompt);
		} else {
			console.log("WebSocket is not open");
			// ws.current = new WebSocket(`ws://${IP}`);
			// ws.current.send(prompt);
		}
	};

	useEffect(() => {
		// if (!IP || dialogueID === -1) return;
		if (!IP) return;

		const socket = new WebSocket(`ws://${IP}`);
		ws.current = socket;

		socket.onopen = () => {
			console.log("WebSocket opened");
		};

		socket.onmessage = (event) => {
			const response = event.data;
			console.log("Received message:", response);

			//Update waiting response state
			setWaitingResponse(false);
			//Update messages with assistant response
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: response,
				},
			]);
		};

		socket.onerror = (error) => {
			console.error("WebSocket error:", error);
		};

		socket.onclose = () => {
			console.log("WebSocket closed");
		};

		return () => {
			if (socket.readyState === WebSocket.OPEN) {
				socket.close();
			}
			ws.current = null;
		};
	}, [IP]);

	return (
		<div className="flex flex-col w-5/6 h-full bg-black relative">
			<div className="flex-1 absolute top-0 left-0 right-0 bottom-0">
				<div className="flex flex-1 flex-row pointer-events-none items-center bg-gradient-to-r from-cf to-tbot justify-center w-full h-full">
					<img src={logo} className="w-xl opacity-50"></img>
				</div>
			</div>
			<Header />
			<Messages messages={messages} waitingResponse={waitingResponse} />
			<Input sendMessage={sendMessage} />
		</div>
	);
}
