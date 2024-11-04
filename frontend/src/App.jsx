import React from 'react'
import VideoCall from './Pages/VideoCall.jsx'
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
	return (
		<BrowserRouter>
			<Toaster position="top-right" />
			<Routes>
				<Route path="/" element={<VideoCall />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
