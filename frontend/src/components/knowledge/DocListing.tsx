import axios from "axios";
import { useEffect, useState } from "react";
import StatusIcon from "./StatusIcon";
import logo from "../../assets/CFxtbot.png";

type Document = {
	name: string;
	status: string;
	lastUpdated: string;
};

export default function DocListing({ httpUrl }: { httpUrl: string }) {
	const [documents, setDocuments] = useState<Document[]>([]);

	//TODO: Websocket to keep the status updated in real time (sleep 1s in server)
	useEffect(() => {
		axios.get(`${httpUrl}/knowledge`).then((res) => {
			const resDocs = res.data.documents as Document[];
			setDocuments(resDocs);
		});
	}, []);

	const formatDate = (value: string) => {
		return new Date(value)
			.toLocaleString("pt-PT", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
			.replace(",", "");
	};

	//TODO: Fix and simplify this component
	return (
		<div className="flex flex-col gap-1.5">
			<div className="sticky top-0 bg-[#1f1d1d]">
				<div className="flex flex-row items-center justify-between text-gray-200 font-bold select-none w-full ">
					<div className="hover:bg-gray w-full h-full py-1 pl-6">
						<p>Name</p>
					</div>

					<div className="flex flex-row items-center">
						<div className="hover:bg-gray w-fit h-full py-1">
							<p>Status</p>
						</div>
						<div className="hover:bg-gray w-36 h-full py-1 pr-3">
							<p className="pl-2.5">Last update</p>
						</div>
					</div>
				</div>
			</div>
			<div className="flex flex-col w-full gap-1 overflow-y-auto pl-4">
				{documents.map((doc, index) => (
					<div key={index}>
						<div className="flex flex-row items-center justify-between rounded-xl p-1 px-3 text-white select-none hover:bg-gray w-full ">
							<p className="">{doc.name}</p>
							<div className="flex flex-row items-center">
								<StatusIcon status={doc.status} />
								<p className="pl-2.5">
									{formatDate(doc.lastUpdated)}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
