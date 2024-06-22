import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Progress, Chip } from "@nextui-org/react";
import Study1 from "../assets/study1.png";
import Study2 from "../assets/study2.jpg";

export const EmblaCarousel = () => {
  const admin = JSON.parse(localStorage.getItem("user_creds"))._id;
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      console.log(`Fetching videos for admin: ${admin}`);
      const response = await axios.get(
        `http://127.0.0.1:5000/fetch_modules/${admin}`
      );
      console.log("Response data:", response.data);
      setCourses(response.data.videos.slice(0, 2));
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  return (
    <>
      <div className="w-[100%]">
        <div className="flex space-x-2">
          <h1 className="text-purple1 font-bold text-xl mb-1 font-mont">
            Courses
          </h1>
          <Link to="/courses">
            <Chip size="sm" variant="flat" color="secondary">
              View All
            </Chip>
          </Link>
        </div>
        <div className="courses h-[20rem] flex justify-between space-x-4 2xl:space-x-6 items-center">
          {courses.map((course, index) => (
            <Link
              to={`/courses/${course._id}`}
              key={index}
              className="p-3 w-1/2 bg-white shadow-lg rounded-lg h-[100%] flex flex-col items-start justify-between hover:bg-gray-50 hover:scale-105 transition-all"
            >
              <img
                src={index % 2 === 0 ? Study1 : Study2} // Use different images based on index
                className="object-cover w-full h-[12rem] rounded-lg"
                alt=""
              />
              <p className="font-semibold font-mont text-lg text-black">
                {course.module || "Untitled Course"}
              </p>
              <p className="text-black">Progress:</p>
              <Progress
                classNames={{ indicator: "bg-gradient-to-r from-purple1 to-purple-900" }}
                aria-label="Loading..."
                value={course.progress * 100}
              />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};
