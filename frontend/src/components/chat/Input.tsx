import { useState } from "react";
import send from "../../assets/send.svg";

export default function Input({
	sendMessage,
	waitingResponse,
}: {
	sendMessage: (prompt: string) => void;
	waitingResponse: boolean;
}) {
	const [input, setInput] = useState("");

	const handleSend = () => {
		//Check if input is empty and do nothing if it is
		if (input.trim().length === 0) return;

		sendMessage(input);
		setInput("");
	};

	return (
		<div className="relative z-1 select-none">
			<div className="flex flex-row w-full absolute bottom-0 h-fill px-4 pb-3">
				<div className="bg-gray flex-1 flex flex-row rounded-full h-full px-4 py-3 gap-4">
					<input
						disabled={waitingResponse}
						className="w-full text-white px-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
						placeholder="Ask me anything..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleSend();
							}
						}}
					/>
					<a
						className="flex hover:cursor-pointer"
						onClick={handleSend}
					>
						<img src={send} alt="Send" />
					</a>
				</div>
			</div>
		</div>
	);
}
