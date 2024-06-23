import React, { useEffect, useState } from "react";
import axios from "axios";
import Graduate from "../assets/graduate.png";
import { Progress, Badge } from "antd";
import linked from "../assets/linkedin-logo.png";
import Git from "../assets/github-sign.png";
import Email from "../assets/email.png";
import Roadmap from "../assets/roadmap.png";
import { Button } from "@nextui-org/react";
import { useNavigate, Link } from "react-router-dom";

const twoColors = {
  "0%": "#108ee9",
  "100%": "#87d068",
};

const conicColors = {
  "0%": "#108ee9",
  "25%": "#87d068",
  "50%": "#1890ff",
  "75%": "#f0f",
  "100%": "#f759ab",
};

const GetAccount = () => {
  const [account, setAccount] = useState({});
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const adminData = localStorage.getItem("user_creds");
        if (adminData) {
          const adminData1 = JSON.parse(adminData);
          const admin = adminData1._id;
          const Username = adminData1.username;
          setUsername(Username);
          const response = await axios.get(
            `http://127.0.0.1:5000/account/${admin}`
          );
          setAccount(response.data.Account);
        } else {
          setError("No data");
        }
      } catch (err) {
        setError("Error fetching account information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-5 pt-0 pb-4">
      <div className="bg-gray-100 rounded-lg shadow-lg row-span-3 h-full grid pt-6 px-4">
        <div className="flex justify-center">
          <img
            src="https://www.shutterstock.com/image-photo/head-shot-handsome-millennial-30s-600nw-1854710668.jpg"
            alt=""
            className="w-40 h-40 border-5 border-purple1 rounded-full object-cover" // Adjust size as needed
          />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-center">{username}</h1>
        <div className="flex items-center justify-center mt-2">
          <img src={Graduate} alt="" className="w-6 h-6 mr-2" />
          <h3 className="text-gray-600 mt-2 text-md">
            B-Tech, {account.curFieldOfStudy}
          </h3>
        </div>
        <h3 className="text-gray-600 text-md text-center">
          {account.currentYear}
        </h3>
        <hr className="border-gray-300 mt-5 w-full" />
        <div className="mt-6 ml-7 flex items-center">
          <Progress
            type="circle"
            percent={account.gpa * 10}
            width={80}
            strokeWidth={8}
            strokeColor={{
              "0%": "#108ee9",
              "100%": "#87d068",
            }}
          />
          <div className="ml-4">
            <h2 className="text-xl font-semibold">CGPA</h2>
            <p className="text-gray-600">{account.gpa}</p>{" "}
          </div>
        </div>
        <hr className="border-gray-300 mt-5 w-full" />
        <div className="grid grid-cols-3 gap-4 p-6">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold">2</span>
            <span className="text-gray-600 text-center">Ongoing Courses</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold">3</span>
            <span className="text-gray-600 text-center">Doubts Solved</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold">2</span>
            <span className="text-gray-600 text-center">
              Projects Completed
            </span>
          </div>
        </div>
        <hr className="border-gray-300 mt-3 w-full" />
        <div className="flex flex-col justify-center p-4 space-y-4 mt-4 ml-3">
          <div className=" flex items-center">
            <img src={Git} alt="GitHub" className="w-5 h-5 mr-2" />
            <a
              href="https://github.com/your-profile"
              className="text-gray-600 hover:underline"
            >
              Github
            </a>
          </div>
          <div className="flex items-center">
            <img src={Email} alt="Email" className="w-5 h-5 mr-2" />
            <a
              href="mailto:your-email@example.com"
              className="text-gray-600 hover:underline"
            >
              Email
            </a>
          </div>
          <div className="flex items-center">
            <img src={linked} alt="LinkedIn" className="w-5 h-5 mr-2" />
            <a
              href="https://linkedin.com/in/profile"
              className="text-gray-600 hover:underline"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 rounded-lg shadow-lg col-span-2 row-span-3 col-start-2 row-start-1">
        <h2 className="text-xl font-bold mt-4 ml-4">Desired Job Role</h2>
        <div className="p-4">
          <p className="text-lg font-semibold mb-2">Job Role:</p>
          <p className="text-gray-800">{account.jobRole}</p>
        </div>

        <div className="border-t border-gray-200 p-4">
          <p className="text-lg font-semibold mb-2">Achievements:</p>
          <p className="text-gray-800">{account.achievements}</p>
        </div>

        <div className="border-t border-gray-200 p-4">
          <p className="text-lg font-semibold mb-2">Coursework:</p>
          <p className="text-gray-800">{account.coursework}</p>
        </div>

        <div className="border-t border-gray-200 p-4">
          <p className="text-lg font-semibold mb-2">Projects:</p>
          <p className="text-gray-800">{account.projects}</p>
        </div>

        <div className="border-t border-gray-200 p-4">
          <p className="text-lg font-semibold mb-2">Previous Experience:</p>
          <p className="text-gray-800">{account.prevExperience}</p>
        </div>
        <div className="border-t border-gray-200 grid grid-cols-2 gap-2 p-3 mt-8 ">
          <div className="ml-5 mt-[1.3rem]">
            <h2 className="text-xl font-bold">
              Not sure about your career goals?
            </h2>
            <h2 className="text-xl font-bold">
              your career goals?
            </h2>
          </div>
          <div className="flex justify-center items-center">
          <Link to="/changeQuestions">
            <Button color="primary">
              Change Roadmap
            </Button>
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetAccount;
