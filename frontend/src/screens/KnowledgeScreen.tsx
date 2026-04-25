import { useEffect } from "react";
import DocListing from "../components/knowledge/DocListing";
export default function KnowledgeScreen({ httpUrl }: { httpUrl: string }) {
	useEffect(() => {
		document.title = "Knowledge base";
	}, []);

	return (
		<div className="flex-1">
			<DocListing httpUrl={httpUrl} />
		</div>
	);
}
