import { Link } from "react-router-dom";
import write from "../../assets/write.svg";
import brain from "../../assets/brain.svg";
import home from "../../assets/home.svg";

export default function Button({
	icon,
	text,
	to,
}: {
	icon?: "write" | "brain" | "home";
	text: string;
	to?: string;
}) {
	const icons = {
		write,
		brain,
		home,
	};

	const content = (
		<div className="w-full h-fit flex flex-row gap-3 hover:bg-gray hover:cursor-pointer transition rounded-xl px-3 py-1">
			{icon && (
				<img src={icons[icon]} alt={text} className="w-[20px] h-auto" />
			)}
			<p className="text-white text-l size-fit transition">{text}</p>
		</div>
	);

	return to ? <Link to={to}>{content}</Link> : <a>{content}</a>;
}
