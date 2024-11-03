import React from 'react'
import VideoCall from './Pages/VideoCall.jsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<VideoCall />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
