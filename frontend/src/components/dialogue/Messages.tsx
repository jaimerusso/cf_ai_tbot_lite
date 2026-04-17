import { useEffect, useRef } from "react";
import type { Message } from "./Chat";

export default function Messages({ messages }: { messages: Message[] }) {
	const containerRef = useRef<HTMLDivElement>(null);
	(useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTo({
				top: containerRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}),
		[messages]);

	return (
		<div
			className="flex flex-col px-5 pb-10 pt-5 relative overflow-y-auto relative z-1 flex-1 mb-3"
			ref={containerRef}
		>
			{messages.map((msg, index) => (
				<div
					key={index}
					className={`flex mb-6 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
				>
					<div className="rounded-2xl p-3 bg-gray w-fit max-w-[80%]">
						<p className="text-white">{msg.content}</p>
					</div>
				</div>
			))}
		</div>
	);
}
