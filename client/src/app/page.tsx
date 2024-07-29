'use client'

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import Image from "next/image";
import toast from "react-hot-toast";
import { Job } from "./types/job";

export default function Home() {
  const [socket, setSocket] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  const fetchJobs = useCallback(async () => {
    try {
      const { data: fetchedJobs } = await axios.get(`${process.env.CLIENT_URL}/api/jobs`);
      if(fetchedJobs)
        setJobs(fetchedJobs);
    } catch (error) {
        toast("Error fetching jobs");
    } 
  }, []);

  useEffect(() => {
    const newSocket = io(`${process.env.SERVER_URL}`, {
      transports: ['websocket'],
      upgrade: false
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to socket');
      setSocket(newSocket);
    });

    newSocket.on('jobUpdate', (updatedJob: Job) => {
      setJobs(prevJobs => {
        const jobIndex = prevJobs.findIndex(job => job.id === updatedJob.id);
        if (jobIndex !== -1) {
          const newJobs = [...prevJobs];
          newJobs[jobIndex] = { ...newJobs[jobIndex], ...updatedJob };
          return newJobs;
        } else {
          return [...prevJobs, updatedJob];
        }
      });
    });

    fetchJobs();

    return () => {
      newSocket.off('jobUpdate');
      newSocket.disconnect();
    };
  }, [fetchJobs]);


  const createJob = async () => {
    try {
      const { data } = await axios.post(`${process.env.CLIENT_URL}/api/job`);
      if(data)
        fetchJobs();
    } catch (error) {
      if(error instanceof Error)
        toast(error.message);
    }
  };
  
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Jobs</h1>
        
        <button 
          onClick={createJob} 
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out mb-8"
        >
          Create New Job
        </button>
  
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {jobs.map((job: Job) => (
            <div 
              key={job.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 ease-in-out"
            >
              {job?.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <Image 
                    src={`${job.imageUrl}&w=400&h=300&fit=crop&auto=format`}
                    layout="fill"
                    objectFit="cover"
                    alt={`Job ${job.id}`}
                    className="transition duration-300 ease-in-out transform hover:scale-105"
                  />
                </div>
              )}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2">ID: {job.id}</p>
                <p className="text-sm text-gray-600 mb-2">Retry attempts: {job?.retryAttempts}</p>
                <p className="text-sm font-semibold text-black">
                  State:<span className={`inline-block px-2 py-1 rounded-full`}>{job.state}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}