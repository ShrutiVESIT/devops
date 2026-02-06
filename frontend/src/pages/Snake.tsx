import React from 'react'
import GameCard from '../components/cards/GameCard'

const Snake = () => {
  return (
    <div className='w-full mt-[50px] md:w-[500px] poppins-regular'>
        {/* <h1 className='md:text-4xl'><span className='underline underline-offset-2 font-bold '>Hydra</span> Snakes</h1> */}
        <h1 className='md:text-sm text-gray-400'><span className='md:text-2xl text-gray-100 font-bold block'>Umm Sorry</span> looks like this page doesn't exist!</h1>
        <GameCard/>
        <div className="mx-auto flex flex-col justify-center">
          <a
            href="/"
            className="group md:block text-2xl hover:text-green-400 transition-colors font-semibold"
          >
            NEO
            <span className="text-green-400 transition-all group-hover:text-white">
              PACK
            </span>{" "}
            
          </a>
         
        </div>
    </div>
  )
}

export default Snake