import React, { useState } from "react";
import {
  DatePicker,
  Textarea,
  Progress,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Questions() {
  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem("user_creds"))._id;
  const [questions, setQuestions] = useState({
    currentYear: "",
    jobRole: "",
    industry: "",
    techInterests: "",
    aspirations: "",
    curFieldOfStudy: "",
    gpa: "",
    achievements: "",
    coursework: "",
    projects: "",
    prevExperience: "",
    studyDuration: 0,
  });

  const [placementTime, setPlacementTime] = useState();
  const [studyFrequency, setStudyFrequency] = useState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gap, setGap] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(Array.from(selectedKeys)[0])
    if (
      !questions.currentYear ||
      !questions.jobRole ||
      !questions.industry ||
      !questions.techInterests ||
      !questions.aspirations ||
      !questions.curFieldOfStudy ||
      !questions.gpa ||
      !questions.achievements ||
      !questions.coursework ||
      !questions.projects ||
      !questions.prevExperience ||
      !questions.studyDuration ||
      !placementTime ||
      selectedKeys.size === 0
    ) {
      console.log("All fields are required");
      return;
    }
    setLoading(true);

    const responseAnalysis = await axios.post("http://127.0.0.1:5000/analysis", {
      userId: userId,
      currentYear: questions.currentYear,
      jobRole: questions.jobRole,
      industry: questions.industry,
      techInterests: questions.techInterests,
      aspirations: questions.aspirations,
      curFieldOfStudy: questions.curFieldOfStudy,
      gpa: questions.gpa,
      achievements: questions.achievements,
      coursework: questions.coursework,
      projects: questions.projects,
      prevExperience: questions.prevExperience,
      studyDuration: questions.studyDuration,
      placementTime: placementTime.toString(),
      currentDate: new Date().toString(),
      prefStudyDays: Array.from(selectedKeys)
    });
    console.log(responseAnalysis.data.message);
    if (responseAnalysis.data.message == 'Invalid Date' || responseAnalysis.data.message == 'Unrelated Job Role' || responseAnalysis.data.message == 'Insufficient Time') {
      setError(responseAnalysis.data.message);
      return;
    }
    setGap(responseAnalysis.data.message);

    const response = await axios.post('http://127.0.0.1:5000/make_roadmap', {
      userId: userId,
      currentYear: questions.currentYear,
      jobRole: questions.jobRole,
      industry: questions.industry,
      techInterests: questions.techInterests,
      aspirations: questions.aspirations,
      curFieldOfStudy: questions.curFieldOfStudy,
      gpa: questions.gpa,
      achievements: questions.achievements,
      coursework: questions.coursework,
      projects: questions.projects,
      prevExperience: questions.prevExperience,
      studyDuration: questions.studyDuration,
      placementTime: placementTime.toString(),
      currentDate: new Date().toString(),
      prefStudyDays: Array.from(selectedKeys)
    });

    console.log(response.data.message);
    const roadmapGen = await response.data.response;
    localStorage.setItem("roadmap", JSON.stringify(roadmapGen.roadmap));
    localStorage.setItem("currentModule", 0);
    const roadmap = roadmapGen.roadmap[0];
    console.log(roadmap);
    console.log(roadmap.subtopics[0].subtopic);

    const subtopics = [];
    roadmap.subtopics.forEach((subtopic) => {
      subtopics.push(subtopic.subtopic);
    });

    const courseResponse = await axios.post("http://127.0.0.1:5000/get_video", {
      userId: userId,
      module: roadmap.module,
      subtopics: subtopics,
    });
    console.log(courseResponse.data.message);
    setLoading(false);
    navigate("/");
  };

  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));

  const selectedValue = React.useMemo(
    () => Array.from(selectedKeys).join(", ").replaceAll("_", " "),
    [selectedKeys]
  );

  return (
    <>
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-50 flex flex-col justify-center items-center">
          <img
            className="h-[20rem]"
            src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
            alt=""
          />
          <p className="font-mont text-lg font-semibold mt-5">
            Please Wait While We Generate Your Roadmap
          </p>
          <Progress
            size="sm"
            isIndeterminate
            aria-label="Loading..."
            className="max-w-md mt-2"
          />
        </div>
      )}
      {
        error && (
          <div className="fixed top-0 left-0 w-full h-full bg-white z-50 flex flex-col justify-center items-center">
            <p className="font-mont text-2xl max-w-[60%] font-semibold">Error: {error}</p>
          </div>
        )
      }
      {
        gap && (
          <div className="fixed top-0 left-0 w-full min-h-full bg-white z-50 flex flex-col justify-center items-center">
            <p className="font-mont text-sm max-w-[60%] font-semibold">{gap}</p>
          </div>
        )
      }
      <div className="w-[100%] min-h-[100%] bg-white">
        <div className="flex flex-col items-start p-5 w-[100%] font-mont">
          <h1 className="text-3xl font-bold text-purple1 self-center">
            Getting To Know You
          </h1>
          <p className="text-lg text-gray-700 font-medium self-center">
            Please answer the following questions candidly, as your responses
            will help us better understand your needs and expectations.
          </p>
          <div className="px-20 pt-5 pb-10 w-[100%]">
            <div className="grid grid-cols-2 gap-x-10 gap-y-4">
              <div className="w-full col-span-1">
                <label
                  htmlFor="curYear"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Current Year of Engineering
                </label>
                <input
                  type="text"
                  id="curYear"
                  value={questions.currentYear}
                  onChange={(e) =>
                    setQuestions((q) => ({ ...q, currentYear: e.target.value }))
                  }
                  placeholder="Ex: Second Year"
                  className="w-full mt-1 py-2 px-3 border-2 bg-white border-gray-200 rounded-xl shadow-sm hover:border-gray-400 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                />
              </div>
              <div className="w-full col-span-1">
                <label
                  htmlFor="jobRole"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Desired Job Role
                </label>
                <input
                  type="text"
                  id="jobRole"
                  value={questions.jobRole}
                  onChange={(e) =>
                    setQuestions((q) => ({ ...q, jobRole: e.target.value }))
                  }
                  placeholder="Ex: Data Analyst, Software Developer"
                  className="w-full mt-1 py-2 px-3 border-2 bg-white border-gray-200 rounded-xl shadow-sm hover:border-gray-400 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                />
              </div>
              <div className="w-full col-span-1">
                <label
                  htmlFor="industry"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Preferred Industry
                </label>
                <input
                  type="text"
                  id="industry"
                  value={questions.industry}
                  onChange={(e) =>
                    setQuestions((q) => ({ ...q, industry: e.target.value }))
                  }
                  placeholder="Ex: Finance, Technology"
                  className="w-full mt-1 py-2 px-3 border-2 bg-white border-gray-200 rounded-xl shadow-sm hover:border-gray-400 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                />
              </div>
              <div className="w-full col-span-1">
                <label
                  htmlFor="techInterests"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Technology Interests
                </label>
                <input
                  type="text"
                  id="techInterests"
                  value={questions.techInterests}
                  onChange={(e) =>
                    setQuestions((q) => ({
                      ...q,
                      techInterests: e.target.value,
                    }))
                  }
                  placeholder="Ex: Machine Learning, Web Development"
                  className="w-full mt-1 py-2 px-3 border-2 bg-white border-gray-200 rounded-xl shadow-sm hover:border-gray-400 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                />
              </div>
              <div className="w-full col-span-1">
                <label
                  htmlFor="aspirations"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Career Aspirations
                </label>
                <input
                  type="text"
                  id="aspirations"
                  value={questions.aspirations}
                  onChange={(e) =>
                    setQuestions((q) => ({ ...q, aspirations: e.target.value }))
                  }
                  placeholder="Ex: Startup, Research, MNC"
                  className="w-full mt-1 py-2 px-3 border-2 bg-white border-gray-200 rounded-xl shadow-sm hover:border-gray-400 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                />
              </div>
              <div className="w-full col-span-1">
                <label
                  htmlFor="curFieldOfStudy"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Current Field of Study
                </label>
                <input
                  type="text"
                  id="curFieldOfStudy"
                  value={questions.curFieldOfStudy}
                  onChange={(e) =>
                    setQuestions((q) => ({
                      ...q,
                      curFieldOfStudy: e.target.value,
                    }))
                  }
                  placeholder="Ex: Computer Science, Electronics"
                  className="w-full mt-1 py-2 px-3 border-2 bg-white border-gray-200 rounded-xl shadow-sm hover:border-gray-400 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                />
              </div>
              <div className="w-full col-span-1">
                <label
                  htmlFor="gpa"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Your GPA
                </label>
                <input
                  type="number"
                  id="gpa"
                  value={questions.gpa}
                  onChange={(e) =>
                    setQuestions((q) => ({ ...q, gpa: e.target.value }))
                  }
                  placeholder="Ex: 9.0/10"
                  className="w-full mt-1 py-2 px-3 border-2 bg-white border-gray-200 rounded-xl shadow-sm hover:border-gray-400 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                />
              </div>
              <div className="w-full col-span-1">
                <label
                  htmlFor="placementTime"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Placement Time
                </label>
                <DatePicker
                  id="placementTime"
                  className="mt-1 max-w-full"
                  variant="bordered"
                  showMonthAndYearPickers
                  value={placementTime}
                  onChange={(date) => setPlacementTime(date)}
                />
              </div>
              <div className="w-full col-span-2">
                <label
                  htmlFor="achievements"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Academic Achievements
                </label>
                <Textarea
                  id="achievements"
                  minRows={3}
                  maxRows={3}
                  variant="bordered"
                  className="mt-1 w-full bg-white rounded-xl sm:text-sm"
                  value={questions.achievements}
                  onChange={(e) =>
                    setQuestions((q) => ({
                      ...q,
                      achievements: e.target.value,
                    }))
                  }
                  type="text"
                  placeholder="List your academic achievements here"
                  required
                />
              </div>
              <div className="w-full col-span-2">
                <label
                  htmlFor="coursework"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Relevant enrolled courses
                </label>
                <Textarea
                  id="coursework"
                  minRows={3}
                  maxRows={3}
                  variant="bordered"
                  className="mt-1 w-full bg-white rounded-xl sm:text-sm"
                  value={questions.coursework}
                  onChange={(e) =>
                    setQuestions((q) => ({ ...q, coursework: e.target.value }))
                  }
                  type="text"
                  placeholder="Relevant courses taken or currently enrolled in"
                  required
                />
              </div>
              <div className="w-full col-span-2">
                <label
                  htmlFor="projects"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Your Projects
                </label>
                <Textarea
                  id="projects"
                  minRows={3}
                  maxRows={3}
                  variant="bordered"
                  className="mt-1 w-full bg-white rounded-xl sm:text-sm"
                  value={questions.projects}
                  onChange={(e) =>
                    setQuestions((q) => ({ ...q, projects: e.target.value }))
                  }
                  type="text"
                  placeholder="Completed or ongoing projects, both academic and extracurricular"
                  required
                />
              </div>
              <div className="w-full col-span-2">
                <label
                  htmlFor="prevExperience"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Previous Experience
                </label>
                <Textarea
                  id="prevExperience"
                  minRows={3}
                  maxRows={3}
                  variant="bordered"
                  className="mt-1 w-full bg-white rounded-xl sm:text-sm"
                  value={questions.prevExperience}
                  onChange={(e) =>
                    setQuestions((q) => ({
                      ...q,
                      prevExperience: e.target.value,
                    }))
                  }
                  type="text"
                  placeholder="Topics already known and any relevant experience in relation to the desired job role"
                  required
                />
              </div>
              <div className="w-full col-span-1">
                <label
                  htmlFor="studyDuration"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Length of each study session
                </label>
                <input
                  type="number"
                  id="studyDuration"
                  value={questions.studyDuration}
                  onChange={(e) =>
                    setQuestions((q) => ({
                      ...q,
                      studyDuration: e.target.value,
                    }))
                  }
                  placeholder="Duration in hours for each study session in hours"
                  className="w-full mt-1 py-2 px-3 border-2 bg-white border-gray-200 rounded-xl shadow-sm hover:border-gray-400 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                />
              </div>
              <div className="w-full col-span-1">
                <label
                  htmlFor="studyDays"
                  className="w-full block text-sm font-medium text-gray-700"
                >
                  Preferred study days
                </label>
                <Dropdown id="studyDays">
                  <DropdownTrigger>
                    <Button variant="bordered" className="capitalize w-full">
                      {selectedValue || "Select days"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="example"
                    variant="flat"
                    disallowEmptySelection
                    selectionMode="multiple"
                    selectedKeys={selectedKeys}
                    onSelectionChange={setSelectedKeys}
                  >
                    <DropdownItem key="mon">Monday</DropdownItem>
                    <DropdownItem key="tue">Tuesday</DropdownItem>
                    <DropdownItem key="wed">Wednesday</DropdownItem>
                    <DropdownItem key="thur">Thursday</DropdownItem>
                    <DropdownItem key="fri">Friday</DropdownItem>
                    <DropdownItem key="sat">Saturday</DropdownItem>
                    <DropdownItem key="sun">Sunday</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="bg-gray-900 p-2 hover:bg-gray-800 text-white rounded-xl font-pop self-center"
          >
            Proceed To Roadmap Generation
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    </>
  );
}

export default Questions;
