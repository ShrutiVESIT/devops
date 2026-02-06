import React from 'react';
import { motion } from 'framer-motion';

interface Service {
  title: string;
  description: string;
}

const InfoCard: React.FC = () => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const services: Service[] = [
    {
      title: "Compression",
      description: "Optimize your images for faster load times and reduced bandwidth usage."
    },
    {
      title: "Analysis",
      description: "Leverage advanced algorithms for insightful data analysis."
    },
    {
      title: "Conversion",
      description: "Seamlessly convert files between multiple formats with ease."
    }
  ];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className=" mx-auto text-left bg-slate-800 rounded-lg shadow-xl "
    >


      <div className='flex justify-center flex-col md:flex-row'>
        <div className='p-6 my-4'>
      <h2 className="text-4xl font-semibold mb-4 text-gray-300">
        <span className='text-green-400'>NEOPACK</span> provides...
      </h2>
      <ul className="space-y-4">
        <div className='mt-10'>
        {services.map((service, index) => (
          <li key={index} className="flex items-start my-3">
            {/* <div className="w-3 h-3 mt-2 mr-3 bg-indigo-500 rounded-full flex-shrink-0"></div> */}
            <div>
              <h3 className="text-2xl font-light text-gray-700 dark:text-gray-300">
                {service.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 ">
                {service.description}
              </p>
            </div>
          </li>
        ))}
        </div>
      </ul>
        </div>

        <img src="/landing.png" className='md:w-[400px] rounded-r-md w-full' alt="" />
      </div>
    </motion.div>
  );
};

export default InfoCard;