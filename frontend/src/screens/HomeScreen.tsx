// import Navbar from "../components/Navbar";
import { useEffect } from "react";
import logo from "../assets/CFxtbot.png";

import Button from "../components/Button";

export default function HomeScreen() {
	useEffect(() => {
		document.title = "Home";
	}, []);

	return (
		<div className="flex flex-col items-center mt-7 px-30 gap-10">
			<div className="flex flex-col items-center gap-10 w-200 bg-white mb-10 p-10 rounded-lg drop-shadow-xl drop-shadow-cf">
				<div className="flex flex-col gap-2 items-center">
					<img src={logo} className="w-xl" alt="CFxtbot logo" />
					<div className="flex flex-col gap-2 items-center">
						<p className="size-fit text-center">
							A specialized interface showcasing a "lite" version
							of my{" "}
							<span className="text-tbot">
								tbot thesis project
							</span>
							. Developed specifically for the{" "}
							<span className="text-cf">
								Cloudflare Software Engineer Internship (Summer
								2026)
							</span>
							, this full-stack application was built and deployed
							entirely on Cloudflare's ecosystem, the frontend as
							a{" "}
							<a
								className="text-cf font-semibold "
								href="https://cf-ai-tbot-lite.pages.dev/"
								target="_blank"
							>
								Cloudflare Page
							</a>{" "}
							and the backend as a{" "}
							<a
								className="text-cf font-semibold "
								href="https://cf-ai-tbot-lite-backend.itsjaimerusso.workers.dev/"
								target="_blank"
							>
								Cloudflare Worker
							</a>
							, leveraging Workers AI for document ingestion and
							conversational dialogue. <br></br>
							<a
								className="text-blue-700 font-semibold "
								href="https://www.linkedin.com/in/jaime-russo-13053422b/"
								target="_blank"
							>
								- Jaime Russo
							</a>
						</p>
					</div>
				</div>
				<div className="flex flex-row justify-center items-center gap-7 h-fit w-full relative">
					<Button
						link="/knowledge"
						text="Knowledge base"
						color="cf"
					/>
					<Button link="/dialogue" text="Chat" color="tbot" />
				</div>
			</div>
		</div>
	);
}
