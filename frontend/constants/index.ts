// import { IoAddSharp } from "react-icons/io5";
// import { IoMdSettings } from "react-icons/io";
 
import { FaScissors } from "react-icons/fa6";



import { IconType } from "react-icons";
import { FaExchangeAlt } from "react-icons/fa";

import { RiChatVoiceLine, RiStockFill, RiDownload2Fill } from "react-icons/ri";
// import { GiSandSnake } from "react-icons/gi";
// import { FaCode } from "react-icons/fa";
// import { FaHeart } from "react-icons/fa";

export interface LinkType  {
    icon: IconType;
    route: string;
    label: string;
    key: number;
}
export const barLinks = [
    {
        icon: FaScissors,
        route: "/image",
        label: "Image Hub",
        key:1

    },
    // {
    //     icon: RiChatVoiceLine,
    //     route: "/synth",
    //     label: "Read Aloud",
    //     key:2

    // },
    {
        icon: RiStockFill,
        route: "/trader",
        label: "Analytica",
        key:2

    },
   

    {
        icon: FaExchangeAlt,
        route: "/pdf",
        label: "Pdf Hub",
        key:3

    },  
    // {
    //     icon: RiDownload2Fill,
    //     route: "/download",
    //     label: "Download",
    //     key:3

    // },


]