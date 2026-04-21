import Button from "../components/Button";

export default function KnowledgeScreen({ httpUrl }: { httpUrl: string }) {
	return (
		<div className="flex flex-col w-full">
			<p className="text-lg text-white font-semibold">
				Page under development
			</p>
			<p className="text-lg text-white font-semibold"></p>
			<div className="w-full">
				<Button
					link="/dialogue"
					text="Try the dialogue chat instead!"
					color="tbot"
				/>
			</div>
		</div>
	);
}
