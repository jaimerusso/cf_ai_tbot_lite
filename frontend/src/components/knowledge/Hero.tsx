import CommonButton from "../CommonButton";

export default function Hero() {
	return (
		<div className="w-full flex flex-row justify-center items-center py-3 text-white font-bold">
			<CommonButton to="/home" icon="home" text="Home" noHover={true} />
			<h1 className="text-2xl select-none px-20">Knowledge base</h1>
			<CommonButton
				to="/dialogue"
				icon="write"
				text="Chat "
				noHover={true}
			/>
		</div>
	);
}
