import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CardList = () => {
  const [data, setData] = useState({ internships: [], jobs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/job_listing'); // Replace with your API endpoint
        setData(response.data);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error.message}</div>;

  const renderCard = (item, index) => (
    <a href={item.link} key={index} className="block bg-white shadow-md rounded-lg overflow-hidden transform transition-transform hover:scale-105">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
        <p className="text-gray-700 mb-1">{item.location}</p>
        <p className="text-gray-500">{item.company}</p>
      </div>
    </a>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Internships</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-12">
        {data.internships.map(renderCard)}
      </div>
      <h2 className="text-2xl font-bold mb-6">Jobs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.jobs.map(renderCard)}
      </div>
    </div>
  );
};

export default CardList;
