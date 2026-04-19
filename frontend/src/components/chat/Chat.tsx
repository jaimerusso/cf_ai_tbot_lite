import { act, useEffect, useRef, useState } from "react";
import Input from "./Input";
import logo from "../../assets/CFxtbot.png";
import axios, { formToJSON } from "axios";
import Messages from "./Messages";
import Header from "./Header";
import type { Dialogue } from "../../screens/DialogueScreen";

export type Message = {
	role: string;
	content: string;
};

export default function Chat({
	httpUrl,
	wsUrl,
	activeDialID,
	setDialogues,
}: {
	httpUrl: string;
	wsUrl: string;
	activeDialID: string;
	setDialogues: React.Dispatch<React.SetStateAction<Dialogue[]>>;
}) {
	const [waitingResponse, setWaitingResponse] = useState(false); //State to track if waiting for response from server (loading state)
	const [messages, setMessages] = useState<Message[]>([]); //Dialogue messages
	const [title, setTitle] = useState("");
	const ws = useRef<WebSocket | null>(null);
	const activeDialIDRef = useRef(activeDialID);

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

			console.log(
				"Sending message:",
				prompt,
				" for dialogue: ",
				activeDialID
			);
			socket.send(JSON.stringify({ dialogueId: activeDialID, prompt }));
		} else {
			console.log("WebSocket is not open");
			// ws.current = new WebSocket(`ws://${IP}`);
			// ws.current.send(prompt);
		}
	};

	useEffect(() => {
		activeDialIDRef.current = activeDialID;
		setWaitingResponse(false); //Turn off waiting because the user selected other dialogue
	}, [activeDialID]);

	useEffect(() => {
		if (!wsUrl) return;

		const socket = new WebSocket(wsUrl);
		ws.current = socket;

		socket.onopen = () => {
			console.log("WebSocket opened");
		};

		socket.onmessage = (event) => {
			const { title, response } = JSON.parse(event.data);

			//If waiting, append to messages
			if (waitingResponse) {
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
				if (title) {
					setTitle(title);
					console.log("active dial iD: ", activeDialIDRef.current);
					setDialogues((prev) =>
						prev.map((d) =>
							d.id === activeDialIDRef.current
								? { ...d, title }
								: d
						)
					);
				}
			}
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
	}, [wsUrl]);

	useEffect(() => {
		if (activeDialID) {
			axios.get(`${httpUrl}/dialogues/${activeDialID}`).then((res) => {
				const resDialogue = res.data.dialogue;
				if (resDialogue) {
					setMessages(resDialogue.messages);
					setTitle(resDialogue.title);
				}
			});
		} else {
			setTitle("");
		}
	}, [activeDialID]);

	return (
		<div className="flex flex-col flex-1 h-full bg-black relative">
			<div className="flex-1 absolute top-0 left-0 right-0 bottom-0">
				<div className="flex flex-1 flex-row select-none items-center bg-gradient-to-r from-cf to-tbot justify-center w-full h-full">
					<img src={logo} className="w-xl opacity-50"></img>
				</div>
			</div>
			<Header title={title} />
			<Messages messages={messages} waitingResponse={waitingResponse} />
			<Input sendMessage={sendMessage} />
		</div>
	);
}
