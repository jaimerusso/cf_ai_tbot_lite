import { useEffect, useState } from "react";
import Button from "./Button";
import type { Dialogue } from "../../screens/DialogueScreen";
import axios from "axios";

export default function Sidebar({
	dialogues,
	activeDialID,
	selectDialogue,
	setDialogues,
	IP,
}: {
	dialogues: Dialogue[];
	activeDialID: string;
	selectDialogue: (id: string) => void;
	setDialogues: React.Dispatch<React.SetStateAction<Dialogue[]>>;
	IP: string;
}) {
	const newDialogue = () => {
		axios.post(`http://${IP}/dialogues`).then((res) => {
			const resDialogue = res.data.dialogue as Dialogue;
			if (resDialogue) {
				setDialogues((prev) => [
					{ id: resDialogue.id, title: resDialogue.title },
					...prev,
				]);

				selectDialogue(resDialogue.id);
			}
		});
	};

	return (
		<div className="w-1/6 bg-dark-gray flex flex-col">
			<div className="flex flex-col gap-1 pt-4 pb-2">
				<div className="px-2">
					<Button to="/home" icon="home" text="Home" />
				</div>
				<div className="px-2">
					<Button
						to="/knowledge"
						icon="brain"
						text="Knowledge base"
					/>
				</div>
				<div className="px-2">
					<Button icon="write" text="New chat" func={newDialogue} />
				</div>
			</div>
			<div className="flex flex-col gap-1 pt-2 overflow-y-auto">
				{dialogues &&
					dialogues.map((dialogue) => (
						<div className="px-2" key={dialogue.id}>
							<Button
								text={dialogue.title}
								active={
									dialogue.id === activeDialID ? true : false
								}
								func={() => selectDialogue(dialogue.id)}
							/>
						</div>
					))}
			</div>
		</div>
	);
}
