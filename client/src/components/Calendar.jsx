// import React, { useEffect, useState } from "react";
// import moment from "moment";
// import Calendar from "./CalendarTemplate";
// import { Link } from "react-router-dom";
// import { Tooltip } from "@nextui-org/react";
// import axios from "axios";

// const CalendarComponent = () => {
//   const [events, setEvents] = useState([]);

//   useEffect(() => {
//     const fetchSchedule = async () => {
//       try {
//         const adminData = localStorage.getItem("user_creds");
//         const adminData1 = JSON.parse(adminData);
//         const admin = adminData1._id;
//         console.log(admin)
//         const response = await axios.get(`http://localhost:5000/get_schedule/${admin}`);
//         const scheduleData = response.data;

//         console.log("Schedule Data:", scheduleData); 

//         if (Array.isArray(scheduleData)) {
//           const formattedEvents = scheduleData.map(item => {
//             const [subtopic, durationDays, date] = item;
//             const startDate = moment(date).toDate();
//             const endDate = moment(date).toDate();

//             return {
//               title: subtopic,
//               start: startDate,
//               end: endDate,
//             };
//           });

//           setEvents(formattedEvents);
//         } else {
//           console.error("Schedule Data is not an array:", scheduleData);
//         }
//       } catch (error) {
//         console.error("Error fetching schedule:", error);
//       }
//     };

//     fetchSchedule();
//   }, []);

//   const components = {
//     event: (props) => {
//       const { title, start, end } = props.event;
//       const startDate = moment(start).format('MMMM Do YYYY, h:mm a');
//       const endDate = moment(end).format('MMMM Do YYYY, h:mm a');

//       return (
//         <Link to="">
//           <Tooltip className="border border-gray-300"
//             content={
//               <div className="p-1">
//                 <p className="font-semibold">{title}</p>
//                 <p>{startDate} - {endDate}</p>
//               </div>
//             }
//           >
//             <div
//               style={{
//                 backgroundColor: "#06b6d4",
//                 fontFamily: "Montserrat",
//                 fontWeight: "500",
//                 color: "white",
//                 padding: "5px",
//                 borderRadius: "5px",
//                 cursor: "pointer",
//                 height: "100%",
//                 display: "flex",
//                 alignItems: "center",
//                 overflow: "hidden",
//               }}
//             >
//               <div
//                 style={{
//                   textOverflow: "ellipsis",
//                   whiteSpace: "nowrap",
//                   overflow: "hidden",
//                   width: "100%",
//                   textAlign: "center",
//                 }}
//               >
//                 {title}
//               </div>
//             </div>
//           </Tooltip>
//         </Link>
//       );
//     },
//   };

//   return (
//     <Calendar
//       events={events}
//       defaultView={"month"}
//       views={["month","week", "day"]}
//       components={components}
//     />
//   );
// };

// export default CalendarComponent;

import React, { useEffect, useState } from "react";
import moment from "moment";
import Calendar from "./CalendarTemplate";
import { Link } from "react-router-dom";
import { Tooltip } from "@nextui-org/react";
import axios from "axios";

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const adminData = localStorage.getItem("user_creds");
        const adminData1 = JSON.parse(adminData);
        const admin = adminData1._id;
        console.log(admin)
        const response = await axios.get(`http://localhost:5000/get_schedule/${admin}`);
        const scheduleData = response.data;

        console.log("Schedule Data:", scheduleData); 

        if (Array.isArray(scheduleData)) {
          const formattedEvents = scheduleData.map(item => {
            const [subtopic, durationDays, date] = item;
            const startDate = moment(date).toDate();
            const endDate = moment(date).toDate();

            return {
              title: subtopic,
              start: startDate,
              end: endDate,
            };
          });

          setEvents(formattedEvents);
        } else {
          console.error("Schedule Data is not an array:", scheduleData);
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
      }
    };

    fetchSchedule();
  }, []);

  const components = {
    event: (props) => {
      const { title, start, end } = props.event;
      const startDate = moment(start).format('MMMM Do YYYY, h:mm a');
      const endDate = moment(end).format('MMMM Do YYYY, h:mm a');

      return (
        <Link to="">
          <Tooltip className="border border-gray-300"
            content={
              <div className="p-1">
                <p className="font-semibold">{title}</p>
                <p>{startDate} - {endDate}</p>
              </div>
            }
          >
            <div
              style={{
                backgroundColor: "#06b6d4",
                fontFamily: "Montserrat",
                fontWeight: "500",
                color: "white",
                padding: "5px",
                borderRadius: "5px",
                cursor: "pointer",
                height: "100%",
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                {title}
              </div>
            </div>
          </Tooltip>
        </Link>
      );
    },
  };

  return (
    <Calendar
      events={events}
      defaultView={"month"}
      views={["month","week", "day"]}
      components={components}
    />
  );
};

export default CalendarComponent;
