export default function Popup({
	title,
	description,
	buttonText,
	buttonColor,
	buttonFunc,
	cancelFunc,
}: {
	title: string;
	description: React.ReactNode; //HTML
	buttonText: string;
	buttonColor: string;
	buttonFunc: () => void;
	cancelFunc: (popup: false) => void;
}) {
	const buttonStyle = "rounded-full py-1 px-3 cursor-pointer";

	return (
		<div className="fixed bg-black/50 opacity backdrop-blur-[1px] w-full h-full z-2">
			<div className="bg-dark-gray rounded-lg absolute top-2/4 left-2/4 -translate-x-1/2 -translate-y-1/2 text-white p-4 flex-col flex max-w-1/3">
				<h2 className="text-white text-xl pb-2">{title}</h2>
				{description}

				<div className="w-full flex flex-row font-bold select-none pt-4 gap-3 justify-end ">
					<a
						className={`${buttonStyle} bg-gray outline-1 outline-gray-400
                    `}
						onClick={() => cancelFunc(false)}
					>
						Cancel
					</a>
					<a
						style={{ backgroundColor: buttonColor }}
						className={buttonStyle}
						onClick={() => buttonFunc?.()}
					>
						{buttonText}
					</a>
				</div>
			</div>
		</div>
	);
}
