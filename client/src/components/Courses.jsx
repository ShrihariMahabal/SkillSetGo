import React, { useEffect, useState } from "react";
import Study1 from "../assets/study1.png";
import Study2 from "../assets/study2.jpg";
import axios from "axios";
import { Link } from "react-router-dom";
import { Progress, Tabs, Tab } from "@nextui-org/react";

function Courses() {
  const userId = JSON.parse(localStorage.getItem("user_creds"))._id;
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/fetch_modules/${userId}`
      );
      setVideos(response.data.videos);
      console.log(response.data.videos);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-[100vh] w-[80%] ml-[20%] p-5 bg-gray-100 flex flex-col">
      <h1 className="text-purple1 font-bold text-2xl font-mont">Courses</h1>
      <div className="grid grid-cols-3 2xl:grid-cols-4 gap-3 h-[19rem]">
        {videos.map((video, index) => (
          <Link
            to={`/courses/${video._id}`}
            key={index}
            className="p-3 w-full bg-white shadow-lg rounded-lg h-[100%] flex flex-col items-start justify-between hover:bg-gray-50 hover:scale-105 transition-all"
          >
            <img
              src={Study1}
              className="object-cover w-full h-[12rem] rounded-lg"
              alt=""
            />
            <p className="font-semibold font-mont text-lg text-black leading-tight mt-1">
              {video.module}
            </p>
            <p className="text-black">Progress:</p>
            <Progress
              classNames={{
                indicator: "bg-gradient-to-r from-purple1 to-purple-900",
              }}
              aria-label="Loading..."
              value={video.progress * 100}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Courses;
