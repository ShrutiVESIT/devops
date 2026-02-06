import React, { useState } from 'react'
import { barLinks, LinkType }from '../../../constants/index.js'
import { motion, Variants } from 'framer-motion';

const TopBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const itemVariants: Variants = {
    open: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    closed: { opacity: 0, y: 20, transition: { duration: 0.2 } }
  };
  return (
    <div className='md:flex justify-center poppins-light hidden'>
      <nav className='
        fixed items-center flex-row top-2 py-2 px-3 
        md:w-[90%] mx-auto flex justify-between rounded-lg
        backdrop-blur-md bg-white/30 dark:bg-slate-800/30
        shadow-lg border border-white/20 dark:border-slate-700/20
        z-50 transition-all duration-300
      '>
        <a
  href="/"
  className="group brand md:block hidden hover:text-green-400 transition-colors font-semibold"
>
  N<span className='text-green-400 transition-all group-hover:text-white'>P</span>T
</a>
      
        <ul className='md:flex md:flex-row '>
          {barLinks.map((link: LinkType) => (
            <li key={link.route}>
              <a 
                href={link.route}  
                className='links flex flex-row items-center justify-center
                  px-4 py-2 rounded-md hover:bg-white/20 dark:hover:bg-slate-700/20
                  transition-all duration-200'
              >
                <span>
                  {<link.icon size={'1.5em'} className='' />}
                </span> 
                <p className='my-auto mx-2 md:hidden lg:block '>{link.label}</p>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default TopBar