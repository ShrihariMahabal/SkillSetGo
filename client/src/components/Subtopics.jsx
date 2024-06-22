import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FaYoutube } from "react-icons/fa";
import { Checkbox } from "@nextui-org/react";

function Subtopics() {
  const { moduleId } = useParams();
  const [module, setModule] = useState({});
  const [subtopics, setSubtopics] = useState([]);
  const admin = JSON.parse(localStorage.getItem("user_creds"))._id;
  const [completed, setCompleted] = useState([]);
  
  useEffect(() => {
    fetchSubtopics();
  }, []);
  
  useEffect(() => {
    if (completed.length && completed.every(item => item)) {
      updateModuleStatus();
    }
  }, [completed]);

  const fetchSubtopics = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/get_subtopics/${moduleId}/${admin}`);
      setModule(response.data.subtopics);
      setSubtopics(response.data.subtopics.subtopics);
      setCompleted(response.data.subtopics.isCompleted);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTick = async (index) => {
    try {
      await axios.post(`http://127.0.0.1:5000/complete_subtopic`, {
        moduleId: moduleId,
        admin: admin,
        subtopicIndex: index,
        length: subtopics.length,
      });
      const newCompleted = [...completed];
      newCompleted[index] = true;
      setCompleted(newCompleted);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUnTick = async (index) => {
    try {
      await axios.post(`http://127.0.0.1:5000/not_complete_subtopic`, {
        moduleId: moduleId,
        admin: admin,
        subtopicIndex: index,
        length: subtopics.length,
      });
      const newCompleted = [...completed];
      newCompleted[index] = false;
      setCompleted(newCompleted);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (index) => {
    if (completed[index]) {
      handleUnTick(index);
    } else {
      handleTick(index);
    }
  };

  const updateModuleStatus = async () => {
    try {
      const modules = JSON.parse(localStorage.getItem("roadmap"));
      const currentModule = JSON.parse(localStorage.getItem("currentModule"));
      // console.log(typeof(modules))
      // console.log(typeof(currentModule))
      const nextModule = modules[currentModule + 1].module;
      const subtopicNames =  modules[currentModule + 1].subtopics.map(subtopic => subtopic.subtopic);

      const response = await axios.post('http://127.0.0.1:5000/get_video', {
        module: nextModule,
        subtopics: subtopicNames,
        userId: admin,
      });
      localStorage.setItem("currentModule", currentModule + 1);
      console.log(response.data.message);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen w-[80%] ml-[20%] p-5 bg-gray-100">
      <div className="flex flex-col">
        <div className="overflow-hidden w-full rounded-xl h-[8rem] bg-gradient-to-r from-purple1 to-gray-500 relative font-pop">
          <h1 className="text-4xl text-gray-500 tracking-wider font-bold translate-x-10 translate-y-[3.2rem]">
            Learn
          </h1>
          <h1 className="text-3xl text-gray-500 tracking-wider font-bold translate-x-[6rem] translate-y-[-3.5rem]">
            Create
          </h1>
          <h1 className="text-5xl text-gray-500 tracking-wider font-bold translate-x-[36rem] translate-y-[-3rem]">
            Innovate
          </h1>
          <h1 className="absolute text-white text-2xl font-bold font-mont left-4 bottom-1">
            Module: {module.module}
          </h1>
        </div>

        {subtopics.map((subtopic, index) => (
          <Link
            to={`/courses/${moduleId}/${index}`}
            key={index}
            className="p-3 mt-4 font-mont w-full bg-white shadow-lg rounded-lg h-[5rem] flex justify-between items-center hover:bg-gray-50 hover:scale-[1.02] transition-all"
          >
            <div className="flex justify-between items-center">
              <FaYoutube size={24} />
              <div className="flex flex-col ml-4">
                <p className="text-sm text-gray-500 font-semibold">
                  Lecture {index + 1}
                </p>
                <p className="font-semibold font-mont text-lg text-black leading-tight mt-1">
                  {subtopic}
                </p>
              </div>
            </div>
            <Checkbox
              isSelected={completed[index]}
              onChange={() => handleChange(index)}
              className="mr-2"
              size="lg"
              color="default"
            ></Checkbox>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Subtopics;
