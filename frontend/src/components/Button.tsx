import { Link } from "react-router-dom";

export default function Button({
	link,
	text,
	color,
}: {
	link: string;
	text: string;
	color: "cf" | "tbot";
}) {
	const bgVariants = {
		cf: "bg-cf",
		tbot: "bg-tbot",
	};

	return (
		<Link
			to={link}
			className={`py-2 px-3 rounded-lg w-2/6 h-full ${bgVariants[color]} hover:opacity-50 flex flex-row justify-center`}
		>
			<p className="text-white font-bold text-xl size-fit transition">
				{text}
			</p>
		</Link>
	);
}
