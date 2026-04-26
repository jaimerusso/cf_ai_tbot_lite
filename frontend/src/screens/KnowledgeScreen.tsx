import { useEffect } from "react";
import DocListing from "../components/knowledge/DocListing";
import Hero from "../components/knowledge/Hero";

export default function KnowledgeScreen({ httpUrl }: { httpUrl: string }) {
	const pageTitle = "Knowledge base";
	useEffect(() => {
		document.title = pageTitle;
	}, []);

	return (
		<div className="flex flex-col h-screen w-full relative">
			<Hero />
			<DocListing httpUrl={httpUrl} />
		</div>
	);
}
