import React from "react";
import { useEffect, useState } from "react";
import { CircularProgress, Divider } from "@nextui-org/react";
import axios from "axios";

function Stats() {

  const userId = JSON.parse(localStorage.getItem("user_creds"))._id;
  const [rating, setRating] = useState(null);

  // useEffect(() => {
  //   fetchRating();
  // }, []);

  // const fetchRating = async () => {
  //   try {
  //     const response = await axios.get(`http://127.0.0.1:5000/extract_rating/${userId}`);
  //     setRating(response.data.rating);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  return (
    <>
      <h1 className="text-purple1 font-bold text-xl mb-1 font-mont">
        Your Rating
      </h1>

      <div className="p-3 bg-white shadow-lg rounded-lg flex flex-col justify-between h-[20rem]">
        <div className="h-[60%] flex items-center justify-between">
          <div className="flex flex-col w-full items-center justify-between">
            <h1 className="font-mont text-sm font-semibold">Learner</h1>
            <CircularProgress
              classNames={{
                svg: "w-[8rem] h-[8rem] drop-shadow-md",
                indicator: "stroke-blue-400",
                track: "stroke-blue-500/10",
                value: "text-lg font-mont font-semibold text-black",
              }}
              value={50}
              strokeWidth={3}
              showValueLabel={true}
            />
          </div>
          <Divider className="" orientation="vertical" />
          <div className="flex flex-col w-full items-center justify-between">
            <h1 className="font-mont text-sm font-semibold">Helper</h1>
            <CircularProgress
              classNames={{
                svg: "w-[8rem] h-[8rem] drop-shadow-md",
                indicator: "stroke-green-500",
                track: "stroke-green-500/10",
                value: "text-lg font-mont font-semibold text-black",
              }}
              value={50}
              strokeWidth={3}
              showValueLabel={true}
            />
          </div>
        </div>
        <div className="h-[40%] flex flex-col justify-center items-start mt-4">
          <p className="text-xs font-mont text-gray-500">
            <strong>Learner's Rating:</strong> As you progress
            through the curriculum within in the allotted period, your learner's rating will improve.
          </p>
          <p className="text-xs font-mont text-gray-500 mt-2">
            <strong>Helper's Rating:</strong> The more
            doubts you solve in the community forum, the higher your
            helper's rating will be.
          </p>
        </div>
      </div>
    </>
  );
}

export default Stats;
