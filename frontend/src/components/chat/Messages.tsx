import { useEffect, useRef } from "react";
import type { Message } from "./Chat";

export default function Messages({
	messages,
	waitingResponse,
}: {
	messages: Message[];
	waitingResponse: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);

	//Scroll to bottom when new messages are added
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTo({
				top: containerRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [messages]);

	return (
		<div
			className="flex flex-col px-5 pb-10 pt-5 overflow-y-auto relative z-1 flex-1 mb-3"
			ref={containerRef}
		>
			{messages
				.filter(
					(msg) =>
						(msg.role === "user" || msg.role === "assistant") &&
						!msg.name
				)
				.map((msg, index) => (
					<div
						key={index}
						className={`flex mb-6 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div className="rounded-2xl p-3 bg-gray w-fit max-w-[80%]">
							<p className="text-white">{msg.content}</p>
						</div>
					</div>
				))}

			{waitingResponse && (
				<div className="flex mb-6 justify-start">
					<div className="rounded-2xl p-3 bg-gray w-fit">
						<div className="flex gap-1 items-center">
							<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0ms]"></span>
							<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:150ms]"></span>
							<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:300ms]"></span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
