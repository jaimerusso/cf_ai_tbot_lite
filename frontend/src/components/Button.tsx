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
            className={`p-5 rounded-lg w-full ${bgVariants[color]} hover:opacity-50 transition flex flex-row justify-center`}
        >
            <p className="text-white font-bold text-xl size-fit transition">
                {text}
            </p>
        </Link>
    );
}
