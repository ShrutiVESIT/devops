import * as React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

const variants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 }
    }
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 }
    }
  }
};

const colors = ["#FF008C", "#D309E1", "#9C1AFF", "#7700FF", "#4400FF"];

export const MenuItem = ({ i }) => {
  const style = { border: `1px solid ${colors[i.key]}`, color: `${colors[i.key]}` };
 
  return (
    <motion.li
      variants={variants}
      className="m-li"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div style={style} className={`icon-placeholder mx-1 rounded-full p-4 flex items-center justify-center text-purple-600 hover:bg-[${colors[i.key]}]`}>
        
        { <i.icon className={"hover:white"} size={"1.5em"} />}
      </div>
      <a href={i.route} className="block w-full">
  <div style={style} className="poppins-bold px-3 mx-auto w-full py-5 rounded-lg">
    {i.label}
  </div>
</a>
    </motion.li>
  );
};
