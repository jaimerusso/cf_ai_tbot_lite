import Sidebar from "../components/dialogue/Sidebar";
import Chat from "../components/dialogue/Chat";
import { useEffect, useState } from "react";

export default function DialogueScreen({ IP }: { IP: string }) {
	useEffect(() => {
		document.title = "Dialogue";
	}, []);

	return (
		<div className="flex flex-row h-screen w-full">
			<Sidebar />
			<Chat IP={IP} />
		</div>
	);
}
