import Button from "./Button";

export default function Sidebar() {
	return (
		<div className="w-1/6 bg-dark-gray">
			<div className="px-2">
				<Button to="/knowledge" icon="brain" text="New chat" />
			</div>
			<div className="px-2">
				<Button icon="write" text="New chat" />
			</div>
		</div>
	);
}
