

import ImgToPdf from '../components/cards/ImgToPdf'
import PDFEditor from '../components/cards/PDFEditor'
import PdfMerger from '../components/cards/PdfMerger'
import PdfPasswordCard from '../components/cards/PdfPasswordCard'

const PDFHub = () => {
  return (
    <div>
        
      <div className='poppins-regular'>

        <ImgToPdf/>
        <PDFEditor/>
        <PdfMerger/>
        <PdfPasswordCard/>
      </div>
    </div>
  )
}

export default PDFHub