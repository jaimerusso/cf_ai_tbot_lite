export default function Header({ title }: { title: string }) {
	return (
		<div className="bg-dark-gray p-4 z-1">
			<h1 className="text-xl font-bold text-white">{title}</h1>
		</div>
	);
}
