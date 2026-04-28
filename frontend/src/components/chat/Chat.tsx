import { useEffect, useRef, useState } from "react";
import Input from "./Input";
import logo from "../../assets/CFxtbot.png";
import axios from "axios";
import Messages from "./Messages";
import Header from "./Header";
import type { Dialogue } from "../../screens/DialogueScreen";

export type Message = {
	role: string;
	content: string;
	name?: string;
};

export default function Chat({
	httpUrl,
	wsUrl,
	activeDialID,
	setDialogues,
	newDialogue,
	dialogueTitle,
	setDialogueTitle,
}: {
	httpUrl: string;
	wsUrl: string;
	activeDialID: string;
	setDialogues: React.Dispatch<React.SetStateAction<Dialogue[]>>;
	newDialogue: () => Promise<string>;
	dialogueTitle: string;
	setDialogueTitle: React.Dispatch<React.SetStateAction<string>>;
}) {
	const [waitingResponse, setWaitingResponse] = useState(false); //State to track if waiting for response from server (loading state)
	const [messages, setMessages] = useState<Message[]>([]); //Current dialogue messages
	const ws = useRef<WebSocket | null>(null);
	const activeDialIDRef = useRef(activeDialID);
	const waitingResponseRef = useRef(false);
	const isNewDialogue = useRef(false);

	//Pre: ws.current is always a WebSocket
	const sendMessageRequest = async (prompt: string, dialogueId: string) => {
		const socket = ws.current as WebSocket;
		setMessages((prev) => [...prev, { role: "user", content: prompt }]);
		setWaitingResponse(true);
		waitingResponseRef.current = true;
		socket.send(JSON.stringify({ dialogueId, prompt }));
	};

	const sendMessage = async (prompt: string) => {
		let dialogueId = activeDialID;

		if (!dialogueId) {
			isNewDialogue.current = true;
			dialogueId = await newDialogue();
		}

		let socket = ws.current;
		if (socket && socket.readyState === WebSocket.OPEN && dialogueId) {
			sendMessageRequest(prompt, dialogueId);
		} else {
			socket = new WebSocket(wsUrl);
			ws.current = socket;
			setupSocket(socket, dialogueId, prompt); // <-- passa prompt e dialogueId
		}
	};

	const setupSocket = (
		socket: WebSocket,
		dialogueId?: string,
		prompt?: string
	) => {
		socket.onopen = () => {
			console.log("WebSocket opened");
			if (dialogueId && prompt) {
				sendMessageRequest(prompt, dialogueId);
			}
		};

		socket.onmessage = (event) => {
			const { title, response } = JSON.parse(event.data);
			if (waitingResponseRef.current) {
				setWaitingResponse(false);
				waitingResponseRef.current = false;
				setMessages((prev) => [
					...prev,
					{ role: "assistant", content: response },
				]);
				if (title) {
					setDialogueTitle(title);
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

		socket.onerror = (error) => console.error("WebSocket error:", error);
		socket.onclose = () => console.log("WebSocket closed");
	};

	useEffect(() => {
		if (!wsUrl) return;

		const socket = new WebSocket(wsUrl);
		ws.current = socket;
		setupSocket(socket);

		return () => {
			if (socket.readyState === WebSocket.OPEN) {
				socket.close();
			}
			ws.current = null;
		};
	}, [wsUrl]);

	//Get and update selected dialogue
	const getDialogue = async () => {
		console.log(activeDialID);
		await axios.get(`${httpUrl}/dialogues/${activeDialID}`).then((res) => {
			const resDialogue = res.data.dialogue;
			if (resDialogue) {
				setMessages(resDialogue.messages);
				setDialogueTitle(resDialogue.title);
			}
		});
	};

	useEffect(() => {
		activeDialIDRef.current = activeDialID;
		if (isNewDialogue.current) {
			isNewDialogue.current = false;
			return;
		}
		if (activeDialID) {
			getDialogue();
			setWaitingResponse(false);
			waitingResponseRef.current = false;
		} else {
			setMessages([]);
		}
	}, [activeDialID]);

	return (
		<div className="flex flex-col flex-1 h-full bg-black relative">
			<div className="flex-1 absolute top-0 left-0 right-0 bottom-0">
				<div className="flex flex-1 flex-row select-none items-center bg-linear-to-r from-cf to-tbot justify-center w-full h-full">
					<img src={logo} className="w-xl opacity-50"></img>
				</div>
			</div>
			<Header title={dialogueTitle} />
			<Messages messages={messages} waitingResponse={waitingResponse} />
			<Input
				sendMessage={sendMessage}
				waitingResponse={waitingResponse}
			/>
		</div>
	);
}
