// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "sweetalert2/dist/sweetalert2.min.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Programs from "./pages/admin/Programs";
import Gallery from "./pages/admin/Gallery";
import Events from "./pages/admin/Events";
import HeroBanners from "./pages/admin/HeroBanners";
import News from "./pages/admin/News";
import AIChat from "./components/AIChat";
import AiAssistant from "./pages/admin/AiAssistant";
import AdminWhyChoose from "./pages/admin/AdminWhyChoose";
import CTA from "./pages/admin/Cta";
import About from "./pages/admin/About";
import Announcements from "./pages/admin/Announcements";
import GalleryPublic from "./pages/Gallery";
import Contact from "./pages/Contact";
import Messages from "./pages/admin/Messages";
import ContactInfo from "./pages/admin/ContactInfo";
import Users from "./pages/admin/Users";
import Departments from "./pages/admin/Departments";
import EventsPublic from "./pages/EventsPublic";
import NewsPublic from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import ProgramsPublic from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import AboutPublic from "./pages/About";
import Profile from "./pages/admin/Profile";
import DepartmentsPublic from "./pages/Departments";
import DepartmentDetail from "./pages/DepartmentDetail";
import Admissions from "./pages/Admissions";
import Register from "./pages/Register";
import Portals from "./pages/Portals";
import StaffMisLogin from "./pages/MisLogin";
import StudentLogin from "./pages/StudentLogin";
import Visitors from "./pages/admin/Visitors";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutPublic />} />
        <Route path="/gallery" element={<GalleryPublic />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/events" element={<EventsPublic />} />
        <Route path="/news" element={<NewsPublic />} />
        <Route path="/news/:slug" element={<NewsDetail />} />
        <Route path="/programs" element={<ProgramsPublic />} />
        <Route path="/programs/:slug" element={<ProgramDetail />} />
        <Route path="/departments" element={<DepartmentsPublic />} />
        <Route path="/departments/:slug" element={<DepartmentDetail />} />
        <Route path="/admissions" element={<Admissions />} />
        <Route path="/apply" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/staff/mis-login" element={<StaffMisLogin />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/staff" element={<Portals />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/programs" element={<Programs />} />
        <Route path="/admin/gallery" element={<Gallery />} />
        <Route path="/admin/events" element={<Events />} />
        <Route path="/admin/hero-banners" element={<HeroBanners />} />
        <Route path="/admin/news" element={<News />} />
        <Route path="/admin/ai-assistant" element={<AiAssistant />} />
        <Route path="/admin/why-choose" element={<AdminWhyChoose />} />
        <Route path="/admin/cta" element={<CTA />} />
        <Route path="/admin/about" element={<About />} />
        <Route path="/admin/announcements" element={<Announcements />} />
        <Route path="/admin/messages" element={<Messages />} />
        <Route path="/admin/contact-info" element={<ContactInfo />} />
        <Route path="/admin/departments" element={<Departments />} />
        <Route path="/admin/visitors" element={<Visitors />} />
        <Route path="/admin/profile" element={<Profile />} />
      </Routes>
      <AIChat />
    </Router>
  );
};

export default App;