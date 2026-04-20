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
	newDialogue,
}: {
	httpUrl: string;
	wsUrl: string;
	activeDialID: string;
	setDialogues: React.Dispatch<React.SetStateAction<Dialogue[]>>;
	newDialogue: () => Promise<string>;
}) {
	const [waitingResponse, setWaitingResponse] = useState(false); //State to track if waiting for response from server (loading state)
	const [messages, setMessages] = useState<Message[]>([]); //Dialogue messages
	const [title, setTitle] = useState("");
	const [isFirst, setIsFirst] = useState(false);
	const ws = useRef<WebSocket | null>(null);
	const activeDialIDRef = useRef(activeDialID);
	const waitingResponseRef = useRef(false);
	const isNewDialogue = useRef(false);

	const sendMessage = async (prompt: string) => {
		let dialogueId = activeDialID;

		if (!dialogueId) {
			isNewDialogue.current = true;
			dialogueId = await newDialogue();
		}

		const socket = ws.current;
		if (socket && socket.readyState === WebSocket.OPEN && dialogueId) {
			setMessages((prev) => [...prev, { role: "user", content: prompt }]);
			setWaitingResponse(true);
			waitingResponseRef.current = true;
			socket.send(JSON.stringify({ dialogueId, prompt }));
		}
	};

	useEffect(() => {
		if (!wsUrl) return;

		const socket = new WebSocket(wsUrl);
		ws.current = socket;

		socket.onopen = () => {
			console.log("WebSocket opened");
		};

		socket.onmessage = (event) => {
			const { title, response } = JSON.parse(event.data);
			console.log("waiting res: ", waitingResponse);

			//If waiting, append to messages
			if (waitingResponseRef.current) {
				console.log("entered here!");
				//Update waiting response state
				setWaitingResponse(false);
				waitingResponseRef.current = false;
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

	//Get and update selected dialogue
	const getDialogue = async () => {
		console.log(activeDialID);
		await axios.get(`${httpUrl}/dialogues/${activeDialID}`).then((res) => {
			const resDialogue = res.data.dialogue;
			if (resDialogue) {
				setMessages(resDialogue.messages);
				setTitle(resDialogue.title);
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
			setTitle("");
		}
	}, [activeDialID]);

	return (
		<div className="flex flex-col flex-1 h-full bg-black relative">
			<div className="flex-1 absolute top-0 left-0 right-0 bottom-0">
				<div className="flex flex-1 flex-row select-none items-center bg-linear-to-r from-cf to-tbot justify-center w-full h-full">
					<img src={logo} className="w-xl opacity-50"></img>
				</div>
			</div>
			<Header title={title} />
			<Messages messages={messages} waitingResponse={waitingResponse} />
			<Input
				sendMessage={sendMessage}
				waitingResponse={waitingResponse}
			/>
		</div>
	);
}
