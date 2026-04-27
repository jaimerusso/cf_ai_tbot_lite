import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Popup from "../Popup";
import newFile from "../../assets/newFile.svg";

type Document = {
	name: string;
	status: string;
	lastUpdated: string;
};

export default function DocListing({ httpUrl }: { httpUrl: string }) {
	const [documents, setDocuments] = useState<Document[]>([]);
	const [delName, setDelName] = useState("");
	const [loading, setLoading] = useState(true);
	const [popup, setPopup] = useState(false);
	const [infoPopup, setInfoPopup] = useState(() => {
		return localStorage.getItem("infoSeen") !== "true";
	});
	const [dragging, setDragging] = useState(false);

	const pollRef = useRef(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		request();
		startPolling();
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	//No drag, transparent div
	useEffect(() => {
		const handleDragEnter = () => setDragging(true);
		document.addEventListener("dragenter", handleDragEnter);
		return () => document.removeEventListener("dragenter", handleDragEnter);
	}, []);

	//Get documents, turn off poll if all are ready, turn on if there is at least one that isnt
	const request = () => {
		axios.get(`${httpUrl}/knowledge`).then((res) => {
			console.log("Received res");
			const resDocs = res.data.documents as Document[];
			setLoading(false);

			//If the res docs are different from the saved docs, it must check if needs to stop polling
			if (JSON.stringify(resDocs) !== JSON.stringify(documents)) {
				console.log("Stopping poll");
				const hasNonReady = resDocs.some((d) => d.status !== "ready");
				pollRef.current = hasNonReady;
				setDocuments(resDocs);
			}
		});
	};

	//Poll documents
	const startPolling = () => {
		if (intervalRef.current) return;
		pollRef.current = true;
		intervalRef.current = setInterval(() => {
			if (!pollRef.current) {
				clearInterval(intervalRef.current!);
				intervalRef.current = null;
				return;
			}
			request();
		}, 2000);
	};

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

	const deleteDocument = (name: string) => {
		setPopup(false);
		axios.delete(`${httpUrl}/knowledge/${name}`);
		pollRef.current = true;
		startPolling();
	};

	const confirmDelete = (name: string) => {
		setDelName(name);
		setPopup(true);
	};

	//TODO: Finish the upload information
	const handleUpload = async (files: FileList | null) => {
		if (!files) return;

		//The three possible errors
		const notPlain = [];
		const alreadyExists = [];
		const emptyFiles = [];

		const formData = new FormData();

		Array.from(files).forEach((file) => {
			formData.append("files", file);
		});

		axios.post(`${httpUrl}/knowledge`, formData).then((res) => {
			const resData = res.data;
			console.log(resData);
		});

		pollRef.current = true;
		startPolling();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);
		handleUpload(e.dataTransfer.files);
	};
	const handleDragOver = (e: React.DragEvent) => {
		setDragging(true);
		e.preventDefault();
	};

	const isReady = (status: string) => {
		return status === "ready";
	};

	return (
		<>
			<div
				onDrop={(e) => handleDrop(e)}
				onDragOver={(e) => handleDragOver(e)}
				onDragLeave={() => setDragging(false)}
				className={`absolute flex flex-row justify-center items-center w-full h-full z-40 opacity-0 border-white border-6 border-dashed ${dragging ? "bg-black/50 backdrop-blur-[1px] opacity-100" : ""}`}
				style={{ pointerEvents: dragging ? "all" : "none" }}
			>
				<p className="text-white text-4xl font-bold">
					Drop files to upload
				</p>
			</div>
			{infoPopup && (
				<Popup
					title={"Information"}
					description={
						<>
							<p>
								Only <strong>plain text files</strong> are
								supported.
								<br />
								The file must contain plain text. No formatting,
								images, or binary data.
							</p>
						</>
					}
					buttonText={"OK"}
					buttonColor={"green"}
					buttonFunc={() => {
						setInfoPopup(false);
						localStorage.setItem("infoSeen", "true");
					}}
					notHaveCancel={true}
				/>
			)}
			<div className="flex flex-col items-center w-full">
				<table className="w-full max-w-255 border-separate border-spacing-y-1 mb-5">
					<thead className="sticky top-0 bg-dark-gray text-gray-200 font-bold select-none z-1">
						<tr>
							<th className="px-3 py-2 text-left hover:bg-gray">
								Name
							</th>
							<th className="px-3 py-2 text-center hover:bg-gray w-px">
								Status
							</th>
							<th className="px-3 py-2 text-left whitespace-nowrap hover:bg-gray w-40">
								Last update
							</th>
						</tr>
					</thead>
					<tbody>
						{documents.map((doc) => (
							<tr
								key={doc.name}
								className={`group hover:bg-gray relative ${isReady(doc.status) ? "cursor-pointer" : ""}`}
								onClick={() => {
									if (isReady(doc.status))
										confirmDelete(doc.name);
								}}
							>
								<td
									className={`px-3 py-1 text-white rounded-l-xl ${isReady(doc.status) ? "group-hover:opacity-50" : ""}`}
								>
									{doc.name}
								</td>
								<td className="px-3 py-1">
									<div
										className={`flex justify-center select-none ${isReady(doc.status) ? "group-hover:opacity-50" : ""}`}
									>
										<Icon status={doc.status} />
									</div>
								</td>
								<td
									className={`px-3 py-1 text-white whitespace-nowrap rounded-r-xl ${isReady(doc.status) ? "group-hover:opacity-50" : ""}`}
								>
									{formatDate(doc.lastUpdated)}
								</td>
								{isReady(doc.status) && (
									<td className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
										<span className="text-red font-bold">
											DELETE
										</span>
									</td>
								)}
							</tr>
						))}
						{!loading && (
							<tr
								className="group hover:bg-gray  relative cursor-pointer"
								onClick={() => {
									inputRef.current?.click();
								}}
							>
								<td
									className="px-3 py-1 text-white group-hover:text-green rounded-xl font-bold"
									colSpan={3}
								>
									+ Add files
								</td>
							</tr>
						)}
					</tbody>
				</table>

				{loading && (
					<div className="absolute top-50">
						<Icon />
					</div>
				)}
			</div>

			<input
				ref={inputRef}
				type="file"
				className="hidden"
				multiple
				onChange={(e) => handleUpload(e.target.files)}
			/>

			{popup && (
				<Popup
					title={"Delete document?"}
					description={
						<p>
							Are you sure you want to delete the document:{" "}
							<strong>{delName}</strong>
						</p>
					}
					buttonText={"Delete"}
					buttonColor={"red"}
					buttonFunc={() => deleteDocument(delName)}
					cancelFunc={setPopup}
				/>
			)}
		</>
	);
}
