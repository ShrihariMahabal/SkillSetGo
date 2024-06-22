import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Progress, Button } from "@nextui-org/react";

function Quiz() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const userId = JSON.parse(localStorage.getItem("user_creds"))._id;
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null); // State for score

  const handleQuizSubmit = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/submit_quiz', {
        moduleId: moduleId,
        userId: userId,
        answers: answers
      });
      console.log(response.data.message);
      setScore(response.data.score);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      console.log("Fetching quiz..."); // Log fetching quiz
      const response = await axios.post(`http://127.0.0.1:5000/get_quiz`, {
        moduleId: moduleId,
        userId: userId,
      });
      setQuestions(response.data.response.questions);
      setAnswers(new Array(response.data.response.questions.length).fill("")); // Initialize answers state with empty strings
      console.log("Quiz fetched:", response.data.response.questions);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    const updatedAnswers = [...answers];
    updatedAnswers[questionIndex] = answer;
    setAnswers(updatedAnswers);
  };

  const handleRedirect = () => {
    navigate('/');
  };

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
            Please Wait While We Generate Your Quiz
          </p>
          <Progress
            size="sm"
            isIndeterminate
            aria-label="Loading..."
            className="max-w-md mt-2"
          />
        </div>
      )}
      {score !== null && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 z-20 flex flex-col justify-center items-center">
          <div className="bg-white p-10 rounded-lg shadow-lg flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">Your Score: {score}</h2>
            <Button onClick={handleRedirect} color="primary">
              Go to Home
            </Button>
          </div>
        </div>
      )}
      <div className="min-h-screen w-[80%] ml-[20%] p-5 bg-gray-100 flex flex-col">
        <h1 className="text-purple1 font-bold text-2xl mt-10 font-mont">
          Quiz
        </h1>
        <div className="flex flex-col mt-5 space-y-5">
          {questions.map((question, index) => (
            <div
              key={index}
              className="p-5 bg-white shadow-lg rounded-lg flex flex-col space-y-3"
            >
              <p className="font-mont text-lg font-semibold">
                {question.question}
              </p>
              <div className="flex flex-col space-y-2">
                <div className="p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                  <p className="font-mont text-lg">{question.option_a}</p>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    className="h-5 w-5"
                    onChange={() => handleAnswerChange(index, "a")}
                    checked={answers[index] === "a"}
                  />
                </div>
                <div className="p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                  <p className="font-mont text-lg">{question.option_b}</p>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    className="h-5 w-5"
                    onChange={() => handleAnswerChange(index, "b")}
                    checked={answers[index] === "b"}
                  />
                </div>
                <div className="p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                  <p className="font-mont text-lg">{question.option_c}</p>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    className="h-5 w-5"
                    onChange={() => handleAnswerChange(index, "c")}
                    checked={answers[index] === "c"}
                  />
                </div>
                <div className="p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                  <p className="font-mont text-lg">{question.option_d}</p>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    className="h-5 w-5"
                    onChange={() => handleAnswerChange(index, "d")}
                    checked={answers[index] === "d"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Button onClick={handleQuizSubmit} color="primary">
            Submit
          </Button>
        </div>
      </div>
    </>
  );
}

export default Quiz;
