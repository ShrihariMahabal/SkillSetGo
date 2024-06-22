import React from "react";
import { Link, NavLink } from "react-router-dom";
import Graduation from "../assets/graduation.png";
import Book from "../assets/book-text.png";
import Bot from "../assets/bot.png";
import Calendar from "../assets/calendar.png";
import Dashboard from "../assets/circle-gauge.png";
import User from "../assets/circle-user.png";
import Forum from "../assets/users.png";
import Map from "../assets/map.png";
import Mentor from "../assets/mentor.png";

function Nav() {
  return (
    <>
      <nav className="w-[20%] flex flex-col justify-between items-center h-screen fixed left-0 bg-purple1 py-10">
        <Link className="flex space-x-2 items-center">
          <img src={Graduation} className="h-12 ml-[-0.2rem]" alt="" />
          <div className="flex flex-col justify-center space-y-[-6px]">
            <h1 className="text-xl font-semibold text-white font-mont tracking-widest">
              SkillSetGo
            </h1>
            <p className="text-sm text-gray-400 tracking-tight">
              Chart Your Future
            </p>
          </div>
        </Link>

        <div className="flex flex-col items-center space-y-3 w-[100%]">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-white flex space-x-4 pl-[4%] py-2 w-[75%] rounded-lg justify-start items-center transition duration-100 ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            <img className="h-5" src={Dashboard} alt="" />
            <p className="text-sm font-pop">Dashboard</p>
          </NavLink>

          <NavLink
            to="/roadmapMain"
            className={({ isActive }) =>
              `text-white flex space-x-4 pl-[4%] py-2 w-[75%] rounded-lg justify-start items-center transition duration-100 ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            <img className="h-5" src={Map} alt="" />
            <p className="text-sm font-pop">Roadmap</p>
          </NavLink>

          <NavLink
            to="/courses"
            className={({ isActive }) =>
              `text-white flex space-x-4 pl-[4%] py-2 w-[75%] rounded-lg justify-start items-center transition duration-100 ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            <img className="h-5" src={Book} alt="" />
            <p className="text-sm font-pop">Courses</p>
          </NavLink>

          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `text-white flex space-x-4 pl-[4%] py-2 w-[75%] rounded-lg justify-start items-center transition duration-100 ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            <img className="h-5" src={Calendar} alt="" />
            <p className="text-sm font-pop">Calendar</p>
          </NavLink>

          <NavLink
            to="/mentor"
            className={({ isActive }) =>
              `text-white flex space-x-4 pl-[4%] py-2 w-[75%] rounded-lg justify-start items-center transition duration-100 ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            <img className="h-5" src={Mentor} alt="" />
            <p className="text-sm font-pop">Mentor</p>
          </NavLink>

          {/* <NavLink
            to="/jobs"
            className={({ isActive }) =>
              `text-white flex space-x-4 pl-[4%] py-2 w-[75%] rounded-lg justify-start items-center transition duration-100 ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            <img className="h-5" src={Mentor} alt="" />
            <p className="text-sm font-pop">Jobs</p>
          </NavLink> */}

          <NavLink
            to="/forum"
            className={({ isActive }) =>
              `text-white flex space-x-4 pl-[4%] py-2 w-[75%] rounded-lg justify-start items-center transition duration-100 ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            <img className="h-5" src={Forum} alt="" />
            <p className="text-sm font-pop">Forum</p>
          </NavLink>



          <NavLink
            to="/chatbot"
            className={({ isActive }) =>
              `text-white flex space-x-4 pl-[4%] py-2 w-[75%] rounded-lg justify-start items-center transition duration-100 ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            <img className="h-5" src={Bot} alt="" />
            <p className="text-sm font-pop">Chatbot</p>
          </NavLink>
        </div>

        <NavLink
          to="/account"
          className={({ isActive }) =>
            `text-white flex space-x-4 pl-[4%] py-2 w-[75%] rounded-lg justify-start items-center transition duration-100 ${
              isActive ? "bg-gray-700" : "hover:bg-gray-700"
            }`
          }
        >
          <img className="h-5" src={User} alt="" />
          <p className="text-sm font-pop">Account</p>
        </NavLink>
      </nav>
    </>
  );
}

export default Nav;
