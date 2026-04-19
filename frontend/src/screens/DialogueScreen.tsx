import Sidebar from "../components/sidebar/Sidebar";
import Chat from "../components/chat/Chat";
import { useEffect, useState } from "react";
import axios from "axios";

export type Dialogue = {
	id: string;
	title: string;
};

export default function DialogueScreen({ IP }: { IP: string }) {
	const [dialogues, setDialogues] = useState<Dialogue[]>([]);
	const [activeDialID, setActiveDialID] = useState("");

	useEffect(() => {
		document.title = "Dialogue";

		axios.get(`http://${IP}/dialogues`).then((res) => {
			const resDialogues = res.data.dialogues;
			if (resDialogues) {
				setDialogues(resDialogues);
				console.log(resDialogues[0].id);
				setActiveDialID(resDialogues[0].id);
			}
		});
	}, []);

	useEffect(() => {
		console.log(dialogues);
	}, [dialogues]);

	return (
		<div className="flex flex-row h-screen w-full">
			<Sidebar
				dialogues={dialogues}
				activeDialID={activeDialID}
				selectDialogue={setActiveDialID}
				setDialogues={setDialogues}
				IP={IP}
			/>
			<Chat
				IP={IP}
				activeDialID={activeDialID}
				setDialogues={setDialogues}
			/>
		</div>
	);
}
