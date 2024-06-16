import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import Layout from './Layout.jsx'
import Home from './components/Home.jsx'
import About from './components/About.jsx'
import {divider, NextUIProvider} from '@nextui-org/react'
import Chatbot from './components/Chatbot.jsx'
import CalendarComponent from './components/Calendar.jsx'
import Mentorship from './components/mentorship.jsx'
import Register from './Register.jsx'
import Login from './Login.jsx'
import CommunityList from './components/CommunityList.jsx'
import MentorDetail from './components/MentorDetails.jsx'


const router = createBrowserRouter(
  createRoutesFromElements(
    <>
    <Route path='/login' element={<Login/>}/> 
    <Route path='/register' element={<Register/>}/>
    <Route path='/' element={<Layout/>}>
      <Route path='' element={<Home/>}/>
      <Route path='chatbot' element={<Chatbot/>}/>
      <Route path='calendar' element={<div style={{height: "100vh", width:"80%", marginLeft:"20%", padding:"1.25rem", background:"white"}}><CalendarComponent/></div>}/>
      <Route path='mentorship' element={<div style={{height: "100vh", width:"80%", marginLeft:"20%", padding:"1.25rem", background:"white"}}><Mentorship/></div>}/>
      <Route path='mentorship/:mentor_id' element={<div style={{height: "100vh", width:"80%", marginLeft:"20%", padding:"1.25rem", background:"white"}}><MentorDetail/></div>}/>
      <Route path='forum' element={<CommunityList/>}/>
    </Route>
    </>
  )
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NextUIProvider>
      <RouterProvider router={router}/>
    </NextUIProvider>
  </React.StrictMode>,
)
