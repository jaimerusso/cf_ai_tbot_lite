import { Link } from "react-router-dom";
import write from "../../assets/write.svg";
import brain from "../../assets/brain.svg";
import home from "../../assets/home.svg";

export default function Button({
	icon,
	text,
	to,
	active,
	func,
}: {
	icon?: "write" | "brain" | "home";
	text: string;
	to?: string;
	active?: boolean;
	func?: () => void;
}) {
	const icons = {
		write,
		brain,
		home,
	};

	const style =
		"w-full h-fit flex flex-row gap-3 hover:bg-gray hover:cursor-pointer transition rounded-xl px-3 py-1 " +
		(active ? "bg-gray" : "hover:bg-gray");

	const content = (
		<div className={style}>
			{icon && (
				<img src={icons[icon]} alt={text} className="w-[20px] h-auto" />
			)}
			<p className="text-white text-l size-fit">{text}</p>
		</div>
	);

	return to ? (
		<Link to={to}>{content}</Link>
	) : (
		<a onClick={() => func?.()}>{content}</a>
	);
}
