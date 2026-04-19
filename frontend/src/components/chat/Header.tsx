export default function Header({ title }: { title: string }) {
	return (
		<div className="bg-dark-gray p-4 z-1">
			<h1 className="text-xl font-bold h-7 text-white">{title}</h1>
		</div>
	);
}
