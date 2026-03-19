import ImgToPdf from '../components/cards/ImgToPdf'
import PdfEditor from '../components/cards/PdfEditor'
import PdfMerger from '../components/cards/PdfMerger'
import PdfPasswordCard from '../components/cards/PdfPasswordCard'

const PdfHub = () => {
  return (
    <div>
      <div className='poppins-regular'>
        <ImgToPdf/>
        <PdfEditor/>
        <PdfMerger/>
        <PdfPasswordCard/>
      </div>
    </div>
  )
}

export default PdfHub