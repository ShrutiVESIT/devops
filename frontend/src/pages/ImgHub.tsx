import React from 'react'
import CompressCard from '../components/cards/CompressCard'
import ConverCardIco from '../components/cards/ConvertCardIco'
import ConvertCardWtP from '../components/cards/ConvertCardWtP'
import StickerCard from '../components/cards/StickerCard'
const ImgHub = () => {
  return (
    <div>
        
      <div className='poppins-regular'>
        <CompressCard/>
        <ConverCardIco/>
        <ConvertCardWtP/>
        <StickerCard/>
      </div>
    </div>
  )
}

export default ImgHub