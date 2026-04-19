import { useEffect, useState } from "react";
import Button from "./Button";
import type { Dialogue } from "../../screens/DialogueScreen";
import Popup from "../Popup";
import axios from "axios";

export default function Sidebar({
	dialogues,
	activeDialID,
	selectDialogue,
	setDialogues,
	httpUrl,
}: {
	dialogues: Dialogue[];
	activeDialID: string;
	selectDialogue: (id: string) => void;
	setDialogues: React.Dispatch<React.SetStateAction<Dialogue[]>>;
	httpUrl: string;
}) {
	const [popup, setPopup] = useState(false);
	const [delDialogue, setDelDialogue] = useState<Dialogue>();

	const newDialogue = () => {
		axios.post(`${httpUrl}/dialogues`).then((res) => {
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

	const confirmDelete = (id: string, title: string) => {
		setDelDialogue({ id, title });
		setPopup(true);
	};

	const deleteDialogue = (id?: string) => {
		axios.delete(`${httpUrl}/dialogues/${id}`).then((res) => {
			const deletedId = res.data.dialogueId as string;
			if (deletedId) {
				setDialogues((prev) => {
					const updated = prev.filter((d) => d.id !== deletedId);
					if (updated.length > 0) {
						selectDialogue(updated[0].id);
					} else {
						selectDialogue("");
					}
					return updated;
				});
			}
		});

		setPopup(false);
	};

	return (
		<>
			<div className="w-64 bg-dark-gray flex flex-col ">
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
						<Button
							icon="write"
							text="New chat"
							func={newDialogue}
						/>
					</div>
				</div>
				<div className="flex flex-col gap-1 pt-2 overflow-y-auto">
					{dialogues &&
						dialogues.map((dialogue) => (
							<div className="px-2" key={dialogue.id}>
								<Button
									text={dialogue.title}
									active={
										dialogue.id === activeDialID
											? true
											: false
									}
									func={() => selectDialogue(dialogue.id)}
									deletable={true}
									deleteFunc={() =>
										confirmDelete(
											dialogue.id,
											dialogue.title
										)
									}
								/>
							</div>
						))}
				</div>
			</div>
			{popup && (
				<Popup
					title={"Delete chat?"}
					description={
						<p>
							Are you sure you want to delete:{" "}
							<strong>{delDialogue?.title}</strong>
						</p>
					}
					buttonText={"Delete"}
					buttonColor={"red"}
					buttonFunc={() => deleteDialogue(delDialogue?.id)}
					cancelFunc={setPopup}
				/>
			)}
		</>
	);
}
