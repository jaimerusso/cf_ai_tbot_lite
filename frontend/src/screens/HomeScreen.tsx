// import Navbar from "../components/Navbar";
import { useEffect } from "react";
import logo from "../assets/CFxtbot.png";

import Button from "../components/Button";

export default function HomeScreen() {
    useEffect(() => {
        document.title = "t_bot lite - Jaime Russo";
    }, []);

    return (
        <div className="flex flex-col items-center mt-7 px-30 gap-10">
            {/* <Navbar page={"Início"} /> */}
            <img src={logo} className="w-4xl" />
            <div className="flex flex-col items-center gap-5 size-fit">
                <Button
                    link="/knowledge"
                    text="Document ingestion backoffice"
                    color="cf"
                />
                <Button link="/dialogue" text="Dialogue" color="tbot" />
                {/* <Link to="/knowledge" className="inline-block">
                    <div className="p-5 border-4 rounded-[20px] text-tinsight border border-tinsight bg-white w-max hover:bg-tinsight hover:text-white transition">
                        <p className="color-tinsight font-bold text-xl">
                            Documentos do assistente
                        </p>
                    </div>
                </Link> */}
            </div>
        </div>
    );
}
