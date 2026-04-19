import { Link } from "react-router-dom";
import write from "../../assets/write.svg";
import brain from "../../assets/brain.svg";
import home from "../../assets/home.svg";
import trash from "../../assets/trash.svg";

export default function Button({
	icon,
	text,
	to,
	active,
	func,
	deletable,
	deleteFunc,
}: {
	icon?: "write" | "brain" | "home";
	text: string;
	to?: string;
	active?: boolean;
	func?: () => void;
	deletable?: boolean;
	deleteFunc?: () => void;
}) {
	const icons = {
		write,
		brain,
		home,
	};

	const style =
		"w-full h-fit flex flex-row gap-3 hover:bg-gray hover:cursor-pointer rounded-xl px-3 py-1 relative group select-none " +
		(active ? "bg-gray" : "hover:bg-gray");

	const content = (
		<div className={style}>
			{icon && (
				<img src={icons[icon]} alt={text} className="w-[20px] h-auto" />
			)}
			<p
				className={`text-white text-l size-fit truncate ${deletable ? "group-hover:pr-6" : ""}`}
			>
				{text}
			</p>
			{deletable && (
				<img
					src={trash}
					alt=""
					className="h-[24px] absolute opacity-0 group-hover:opacity-100 right-3 top-1 display-none"
					onClick={(e) => {
						e.stopPropagation();
						deleteFunc?.();
					}}
				/>
			)}
		</div>
	);

	return to ? (
		<Link to={to}>{content}</Link>
	) : (
		<a onClick={() => func?.()}>{content}</a>
	);
}
