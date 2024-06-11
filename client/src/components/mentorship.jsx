// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const MentorRecommendations = () => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [mentors, setMentors] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchMentors = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/mentorship');
//         const parsedData = JSON.parse(response.data);
//         setMentors(parsedData);
//       } catch (err) {
//         setError('Error fetching mentor recommendations');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMentors();
//   }, []);

//   const renderStars = (rating) => {
//     const stars = [];
//     const maxStars = 5;
//     for (let i = 1; i <= maxStars; i++) {
//       if (i <= rating) {
//         stars.push(<span key={i}>&#9733;</span>); // Filled star
//       } else {
//         stars.push(<span key={i}>&#9734;</span>); // Empty star
//       }
//     }
//     return <div className="flex text-yellow-500">{stars}</div>;
//   };

//   const handlePrevious = () => {
//     setCurrentIndex(prevIndex => Math.max(0, prevIndex - 4));
//   };

//   const handleNext = () => {
//     setCurrentIndex(prevIndex => Math.min(mentors.length - 4, prevIndex + 4));
//   };

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p>{error}</p>;

//   return (
//     <div className="w-full max-w-6xl mx-auto bg-white p-6">
//       <h2 className="text-2xl font-bold mb-4">Personalized mentor recommendations</h2>
//       <div className="relative">
//         <div className="flex flex-row flex-wrap justify-center gap-4 overflow-x-auto">
//           {mentors.slice(currentIndex, currentIndex + 4).map((mentor, index) => (
//             <div key={index} className="bg-white border rounded-lg shadow-md w-60">
//               <img
//                 src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7SieSDnaZtBEq5mYqs-QZEOMuiED6aC6X0Q&s'
//                 alt={mentor.name}
//                 className="w-full h-40 object-cover rounded-t-lg"
//               />
//               <div className="p-4">
//                 <h3 className="text-xl font-bold text-gray-900">{mentor.name}</h3>
//                 <p className="text-gray-600 text-md">{mentor.current_position}</p>
//                 <p className="text-gray-500">{mentor.current_employer}</p>
//                 <hr className="my-4 border-gray-300" />
//                 <p className="text-gray-600">Work Experience: {mentor.work_experience}</p>
//                 <p className="text-gray-600">{mentor.field_of_expertise}</p>
//                 <div className="flex items-center pt-10">
//                   {renderStars(mentor.average_rating)}
//                   <button className="ml-auto bg-purple1 text-white py-1 px-3 rounded">Read more</button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//         <button className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white border rounded-full p-1 shadow-md text-gray-500" onClick={handlePrevious}>
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//           </svg>
//         </button>
//         <button className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white border rounded-full p-1 shadow-md text-gray-500" onClick={handleNext}>
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//           </svg>
//         </button>
//       </div>
//     </div>
//   );
// };

// export default MentorRecommendations;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import tick from "../assets/tick.png";
const mentorReasons = [
  "Expertise in the field",
  "Proven track record of success",
  "Strong communication skills"
];
const mentorReasons1 = [
    "Passionate about helping others grow",
  "Flexible scheduling",
  "Cultural fit with your values and goals"
  ];
<div>
  <h2 className="text-xl font-bold mb-2">Reasons to Select Mentors</h2>
  <ul>
    {mentorReasons.map((reason, index) => (
      <li key={index} className="flex items-center">
        <img src="tick.png" alt="tick" className="w-4 h-4 mr-2" />
        <span>{reason}</span>
      </li>
    ))}
  </ul>
</div>

const MentorRecommendations = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/mentorship');
        const parsedData = JSON.parse(response.data);
        setMentors(parsedData);
      } catch (err) {
        setError('Error fetching mentor recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    const maxStars = 5;
    for (let i = 1; i <= maxStars; i++) {
      if (i <= rating) {
        stars.push(<span key={i}>&#9733;</span>); // Filled star
      } else {
        stars.push(<span key={i}>&#9734;</span>); // Empty star
      }
    }
    return <div className="flex text-yellow-500">{stars}</div>;
  };

  const handlePrevious = () => {
    setCurrentIndex(prevIndex => Math.max(0, prevIndex - 4));
  };

  const handleNext = () => {
    setCurrentIndex(prevIndex => Math.min(mentors.length - 4, prevIndex + 4));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="w-full max-w-6xl mx-auto bg-white p-6">
      <div className="grid grid-cols-3 gap-8">
        {/* First Column */}
        <div className="col-span-1">
          <h2 className="text-4xl font-bold mb-8 text-purple1">1-on-1 <h2 className='text-purple1'>Career</h2> Mentorship</h2>
        </div>
  
        {/* Second Column */}
        {/* Second Column */}
<div className="col-span-1 mt-4">
  <ul className="space-y-2">
    {mentorReasons.map((reason, index) => (
      <li key={index} className="flex items-center">
        <img src={tick} alt="tick" className="w-5 h-5 mr-3" />
        <span className="text-lg  text-black">{reason}</span>
      </li>
    ))}
  </ul>
</div>

{/* Third Column */}
<div className="col-span-1 mt-4">
  <ul className="space-y-2">
    {mentorReasons1.map((reason, index) => (
      <li key={index} className="flex items-center">
        <img src={tick} alt="tick" className="w-5 h-5 mr-3" />
        <span className="text-lg text-black">{reason}</span>
      </li>
    ))}
  </ul>
</div>

      </div>
  
      {/* Mentor Recommendations Section */}
      <h2 className="text-2xl font-bold my-8 mx-10"></h2>
      <div className="relative">
        {/* Mentor Cards and Navigation Buttons */}
        <div className="flex flex-row flex-wrap justify-center gap-4 overflow-x-auto">
          {/* Mentor Cards */}
          {mentors.slice(currentIndex, currentIndex + 4).map((mentor, index) => (
            <div key={index} className="bg-white border rounded-lg shadow-md w-60">
              <img
                src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7SieSDnaZtBEq5mYqs-QZEOMuiED6aC6X0Q&s'
                alt={mentor.name}
                className="w-full h-40 object-cover rounded-t-lg"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-900">{mentor.name}</h3>
                <p className="text-gray-600 text-md">{mentor.current_position}</p>
                <p className="text-gray-500">{mentor.current_employer}</p>
                <hr className="my-4 border-gray-300" />
                <p className="text-gray-600">Work Experience: {mentor.work_experience}</p>
                <p className="text-gray-600">{mentor.field_of_expertise}</p>
                <div className="flex items-center mt-2">
                  <p className="text-gray-700 font-bold text-md">{mentor.average_rating}</p>
                </div>
                <div className="flex items-center mt-2">
                  {renderStars(mentor.average_rating)}
                  <button className="ml-auto bg-purple1 text-white py-1 px-3 rounded">Read more</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Navigation Buttons */}
        <button className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white border rounded-full p-1 shadow-md text-gray-500" onClick={handlePrevious}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white border rounded-full p-1 shadow-md text-gray-500" onClick={handleNext}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
  
};

export default MentorRecommendations;