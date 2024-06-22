import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import axios from "axios";

function Mentor() {
  const [mentor, setMentor] = useState({});
  const [username, setUsername] = useState("");
  const userId = JSON.parse(localStorage.getItem("user_creds"))._id;
  const navigate = useNavigate();

  const myMeeting = async (element) => {
    const appID = 1182566435;
    const serverSecret = "23530825837b90f313f25582086bdfe3";
    const roomID = userId;
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      userId,
      username
    );
    const zc = ZegoUIKitPrebuilt.create(kitToken);
    zc.joinRoom({
      container: element,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
    });
  };

  useEffect(() => {
    fetchMentor();
  }, []);

  const fetchMentor = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/get_mentor/${userId}`
      );
      if (response.data.mentor) {
        setMentor(response.data.mentor);
        setUsername(response.data.username);
      } else {
        console.log(response.data.message);
        navigate("/mentorship");
      }
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  };

  const handleEmailClick = () => {
    const email = "shriharimahabal2@gmail.com";
    const subject = "Greetings from your mentee";
    const body = "Dear Mentor,\n\nI hope you are doing well. I wanted to reach out to discuss...";

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen w-[80%] ml-[20%] p-5 bg-gray-100 flex flex-col">
      {mentor && (
        <>
          <div className="w-full bg-white shadow-lg rounded-lg flex p-8 space-x-8 h-[15rem] font-pop">
            <img
              src="https://www.shutterstock.com/image-photo/head-shot-handsome-millennial-30s-600nw-1854710668.jpg"
              alt="Mentor"
              className="w-32 h-32 object-cover rounded-full"
            />
            <div className="flex flex-col justify-center flex-grow">
              <h2 className="text-3xl font-bold text-gray-800">{mentor.name}</h2>
              <p className="text-xl text-gray-500 mt-2">{mentor.current_position}</p>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-700">Skills</h3>
                <p className="text-gray-600 mt-1">{mentor.skills}</p>
              </div>
              <button
                onClick={handleEmailClick}
                className="mt-6 bg-purple1 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition duration-300"
              >
                Email
              </button>
            </div>
          </div>
          <div className="mt-5 w-full">
            <div ref={myMeeting} />
          </div>
        </>
      )}
    </div>
  );
}

export default Mentor;
