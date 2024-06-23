import React from "react";
import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Tooltip, Progress } from "@nextui-org/react";
import Road from "../assets/road.png";
import useEmblaCarousel from "embla-carousel-react";
import "./Carousel.css";
import ArrowLeft from "../assets/arrow-left.png";
import ArrowRight from "../assets/arrow-right.png";
import LocateGreen from "../assets/locate-green.png";
import LocateRed from "../assets/locate-red.png";
import LocateBlue from "../assets/locate-blue.png";

function Roadmap() {
  const [roadmapFull, setRoadmapFull] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const navigate = useNavigate();

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  useEffect(() => {
    setRoadmap(chunkArray(roadmapFull, 5));
  }, [roadmapFull]);

  const fetchRoadmap = async () => {
    const userId = JSON.parse(localStorage.getItem("user_creds"))._id;
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/get_roadmap/${userId}`
      );
      if (response.status === 200) {
        setRoadmapFull(response.data.roadmap.roadmap);
      } else {
        console.log("Error fetching roadmap");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const chunkArray = (array, size) => {
    const len = array.length;
    const chunked = [];
    const temp = [];
    for (let i = 0; i < len; i += 1) {
      temp.push(array[i]);
      temp.push(array[i].project);
    }
    for (let i = 0; i < temp.length; i += size) {
      chunked.push(temp.slice(i, i + size));
    }
    console.log(chunked);
    return chunked;
  };

  const getPositionClasses = (idx) => {
    switch (idx) {
      case 0:
        return "top-[15.5rem] left-[4rem] 2xl:top-[18.0rem] 2xl: left-[4.6rem]";
      case 1:
        return "top-[8.6rem] left-[15.1rem] 2xl:top-[9.6rem] 2xl: left-[18.8rem]";
      case 2:
        return "top-[1rem] left-[23.8rem] 2xl:top-[2.6rem] 2xl: left-[34.3rem]";
      case 3:
        return "bottom-[12.5rem] left-[31.8rem] 2xl: bottom-[12.8rem] 2xl: left-[38.7rem]";
      case 4:
        return "top-[8rem] right-[9rem] 2xl:top-[9.0rem] 2xl: right-[10.0rem]";
      default:
        return "";
    }
  };

  return (
    <div className="mb-8 mt-3 w-[100%]">
      <div
        className="embla bg-gray-200 shadow-lg rounded-xl h-[25rem] 2xl:h-[27rem] relative"
        ref={emblaRef}
      >
        <div className="embla__container">
          {roadmap.map((window, index) => (
            <div
              className="embla__slide overflow-hidden relative 2xl:pb-5"
              key={index}
            >
              <img
                className="ml-4 2xl:ml-[7.2rem] scale-[1.25] 2xl:scale-[1.51] 2xl:my-8"
                src={Road}
                alt="road"
              />
              {window.map((course, idx) => (
                <>
                  <Tooltip
                    key={idx}
                    content={
                      <div className="bg-white rounded-xl p-2 flex flex-col items-start font-pop max-w-[19rem]">
                        {course.module ? (
                          <>
                            <h1 className="font-bold leading-tight text-lg text-wrap">
                              {course.module}
                            </h1>
                            <p className="self-start font-medium text-sm mt-4">
                              Module Duration:{" "}
                              <strong>{course.duration_weeks} weeks</strong>
                            </p>
                          </>
                        ) : (
                          <>
                            <h1 className="font-bold leading-tight text-lg text-wrap">
                              Project:{" "}
                            </h1>
                            <p className="text-sm mt-2">{course}</p>
                          </>
                        )}
                      </div>
                    }
                  >
                    <img
                      src={LocateGreen}
                      className={`z-3 absolute w-12 h-12 cursor-pointer hover:scale-125 transition-all ${getPositionClasses(
                        idx
                      )}`}
                      alt=""
                    />
                  </Tooltip>
                  {/* <img
                    src={LocateGreen}
                    className="z-3 absolute top-[8.6rem] left-[15.5rem] w-12 h-12"
                    alt=""
                  />
                  <img
                    src={LocateBlue}
                    className="z-3 absolute top-[3rem] left-[28.2rem] w-12 h-12"
                    alt=""
                  />
                  <img
                    src={LocateRed}
                    className="z-3 absolute bottom-[12.5rem] left-[32rem] w-12 h-12"
                    alt=""
                  />
                  <img
                    src={LocateRed}
                    className="z-3 absolute top-[8rem] right-[9rem] w-12 h-12"
                    alt=""
                  /> */}
                </>
              ))}
            </div>
          ))}
          {/* <div className="embla__slide overflow-hidden relative">
            <img className="ml-4 scale-125" src={Road} alt="road" />
            <Tooltip
              content={
                <div className="bg-white rounded-xl p-2 flex flex-col items-center font-pop">
                  <h1 className="truncate font-bold">HTML Basics</h1>
                  <p></p>
                  <button className="bg-purple1 py-1 px-3 text-white self-stretch rounded-xl mt-1">
                    Go to Course
                  </button>
                </div>
              }
            >
              <img
                src={LocateGreen}
                className="z-3 absolute top-[15.5rem] left-[4rem] w-12 h-12 cursor-pointer hover:scale-125 transition-all"
                alt=""
              />
            </Tooltip>
            <img
              src={LocateGreen}
              className="z-3 absolute top-[8.6rem] left-[15.5rem] w-12 h-12"
              alt=""
            />
            <img
              src={LocateBlue}
              className="z-3 absolute top-[3rem] left-[28.2rem] w-12 h-12"
              alt=""
            />
            <img
              src={LocateRed}
              className="z-3 absolute bottom-[12.5rem] left-[32rem] w-12 h-12"
              alt=""
            />
            <img
              src={LocateRed}
              className="z-3 absolute top-[8rem] right-[9rem] w-12 h-12"
              alt=""
            />
          </div> */}
          {/* <div className="embla__slide">
            <img className="ml-4 scale-125" src={Road} alt="road" />
          </div>
          <div className="embla__slide">
            <img className="ml-4 scale-125" src={Road} alt="road" />
          </div> */}
        </div>
        <button
          className="embla__prev z-2 absolute top-1/2 left-2"
          onClick={scrollPrev}
        >
          <img src={ArrowLeft} className="w-8 h-8" alt="" />
        </button>
        <button
          className="embla__next z-2 absolute top-1/2 right-2"
          onClick={scrollNext}
        >
          <img src={ArrowRight} className="w-8 h-8" alt="" />
        </button>
      </div>
    </div>
  );
}

export default Roadmap;
