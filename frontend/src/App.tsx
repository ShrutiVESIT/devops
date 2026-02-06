
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './fonts/Poppins-Regular.ttf'
import TopBar from './components/shared/TopBar'
import Synth from './pages/Synth'
import { LeftBar } from './components/shared/LeftBar'
import Snake from './pages/Snake'
import PDFHub from './pages/PdfHub'
import Trader from './pages/Trader'
import Home from './pages/Home'
import Download from './pages/Download'
import ImgHub from './pages/ImgHub'
function App() {

  return (
    <div>
      <BrowserRouter>
      
        <TopBar/>
        <LeftBar/>
            <main>
       <Routes>
        <Route path={"/"} element={<Home/>}></Route>
        {/* <Route path={"/download"} element={<Download/>}></Route> */}
        <Route path={"/image"} element={<ImgHub/>}></Route>
        {/* <Route path={"/synth"} element={<Synth/>}></Route> */}
        <Route path={"/pdf"} element={<PDFHub/>}></Route>
        <Route path={"/snake"} element={<Snake/>}></Route>
        <Route path={"/trader"} element={<Trader/>}></Route>
        <Route path='*' element={<Snake />} />
       </Routes>
    </main>
      </BrowserRouter>
 
    </div>
  )
}

export default App
