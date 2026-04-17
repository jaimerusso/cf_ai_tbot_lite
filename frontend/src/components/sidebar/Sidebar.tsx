import Button from "./Button";

export default function Sidebar() {
	return (
		<div className="w-1/6 bg-dark-gray">
			<div className="flex flex-col gap-1 py-4">
				<div className="px-2">
					<Button to="/home" icon="home" text="Home" />
				</div>
				<div className="px-2">
					<Button
						to="/knowledge"
						icon="brain"
						text="Knowledge base"
					/>
				</div>
				<div className="px-2">
					<Button icon="write" text="New chat" />
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<div className="px-2">
					<Button text="Dialogue 1" />
				</div>
			</div>
		</div>
	);
}
