import Sidebar from "../components/sidebar/Sidebar";
import Chat from "../components/chat/Chat";
import { useEffect, useState } from "react";
import axios from "axios";

export type Dialogue = {
	id: string;
	title: string;
};

export default function DialogueScreen({
	httpUrl,
	wsUrl,
}: {
	httpUrl: string;
	wsUrl: string;
}) {
	const [dialogues, setDialogues] = useState<Dialogue[]>([]);
	const [activeDialID, setActiveDialID] = useState("");

	useEffect(() => {
		document.title = "Dialogue";

		axios.get(`${httpUrl}/dialogues`).then((res) => {
			const resDialogues = res.data.dialogues;
			if (resDialogues.length > 0) {
				setDialogues(resDialogues);
				console.log(resDialogues[0].id);
				setActiveDialID(resDialogues[0].id);
			}
		});
	}, []);

	const newDialogue = async (): Promise<string> => {
		const res = await axios.post(`${httpUrl}/dialogues`);
		const resDialogue = res.data.dialogue as Dialogue;
		if (resDialogue) {
			setDialogues((prev) => [
				{ id: resDialogue.id, title: resDialogue.title },
				...prev,
			]);
			setActiveDialID(resDialogue.id);
			return resDialogue.id;
		}
		return "";
	};

	return (
		<div className="flex flex-row h-screen w-full relative">
			<Sidebar
				dialogues={dialogues}
				activeDialID={activeDialID}
				selectDialogue={setActiveDialID}
				setDialogues={setDialogues}
				httpUrl={httpUrl}
				newDialogue={newDialogue}
			/>
			<Chat
				httpUrl={httpUrl}
				wsUrl={wsUrl}
				activeDialID={activeDialID}
				setDialogues={setDialogues}
				newDialogue={newDialogue}
			/>
		</div>
	);
}
