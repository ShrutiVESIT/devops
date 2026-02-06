

import ImgToPdf from '../components/cards/ImgToPdf'
import PDFEditor from '../components/cards/PDFEditor'
import PdfMerger from '../components/cards/PdfMerger'

const PDFHub = () => {
  return (
    <div>
        
      <div className='poppins-regular'>

        <ImgToPdf/>
        <PDFEditor/>
        <PdfMerger/>
      </div>
    </div>
  )
}

export default PDFHub