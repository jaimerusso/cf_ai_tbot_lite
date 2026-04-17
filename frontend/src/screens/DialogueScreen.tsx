import Sidebar from "../components/dialogue/Sidebar";
import Chat from "../components/dialogue/Chat";

export default function DialogueScreen({ IP }: { IP: string }) {
	return (
		<div className="flex flex-row h-screen w-full">
			<Sidebar />
			<Chat />
		</div>
	);
}
