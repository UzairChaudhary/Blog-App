import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { HiAnnotation, HiArrowNarrowUp, HiDocumentText } from 'react-icons/hi';
import { AiFillLike } from "react-icons/ai";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale,BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function DashboardComp() {
  const [data, setData] = useState({ daily: {}, monthly: {}, yearly: {} });
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [lastMonthLikes, setLastMonthLikes] = useState(0);
  const [lastMonthPosts, setLastMonthPosts] = useState(0);
  const [lastMonthComments, setLastMonthComments] = useState(0);
  

  // const [dailyData, setDailyData] = useState({
  //   blogs: generateDummyData(30),
  //   likes: generateDummyData(30),
  //   comments: generateDummyData(30)
  // });
  // const [monthlyData, setMonthlyData] = useState({
  //   blogs: generateDummyData(12),
  //   likes: generateDummyData(12),
  //   comments: generateDummyData(12)
  // });
  // const [yearlyData, setYearlyData] = useState({
  //   blogs: generateDummyData(5),
  //   likes: generateDummyData(5),
  //   comments: generateDummyData(5)
  // });

  const { currentUser } = useSelector((state) => state.user);
  const [selectedDataType, setSelectedDataType] = useState('posts');
  const [selectedTimeframe, setSelectedTimeframe] = useState('daily');
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const res = await fetch('/api/post/statistics');
          const result = await res.json();
          if (res.ok) {
            setData(result);
            console.log(result)
          }
        } catch (error) {
          console.error(error);
        }
      };
      const fetchPosts = async () => {
        try {
          const res = await fetch('/api/post/getposts?limit=5');
          const data = await res.json();
          if (res.ok) {
            
            setTotalPosts(data.totalPosts);
            setLastMonthPosts(data.lastMonthPosts);
            setTotalLikes(data.totalLikes);
            setLastMonthLikes(data.totalLikesLastMonth);
          }
        } catch (error) {
          console.log(error.message);
        }
      };
      const fetchComments = async () => {
        try {
          const res = await fetch('/api/comment/getcomments?limit=5');
          const data = await res.json();
          if (res.ok) {
           
            setTotalComments(data.totalComments);
            setLastMonthComments(data.lastMonthComments);
          }
        } catch (error) {
          console.log(error.message);
        }
      };

      if (currentUser.isAdmin) {
        
        fetchPosts();
        fetchComments();
        fetchData()
      }
    }, [currentUser]);
    


    const getChartData = () => {
    //   let data=dailyData[selectedDataType];
    //   if (selectedTimeframe === 'daily') {
    //     data = dailyData[selectedDataType];
    //   } else if (selectedTimeframe === 'monthly') {
    //     data = monthlyData[selectedDataType];
    //   } else {
    //     data = yearlyData[selectedDataType];
    //   }
    //   return createChartData(data, `${capitalizeFirstLetter(selectedTimeframe)} ${capitalizeFirstLetter(selectedDataType)}`);
    // };
    const timeframeData = data[selectedTimeframe][selectedDataType];
    if (!timeframeData) return { labels: [], datasets: [] };
    return {
      labels: timeframeData.map(d => d._id),
      datasets: [
        {
          label: `${capitalizeFirstLetter(selectedTimeframe)} ${capitalizeFirstLetter(selectedDataType)}`,
          data: timeframeData.map(d => d.count),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }
 
    // const createChartData = (data, label) => {
    //   if (!data) {
    //     return { labels: [], datasets: [] };
    //   }
  
    //   return {
    //     labels: data.map(d => d.date),
    //     datasets: [
    //       {
    //         label: label,
    //         data: data.map(d => d.count),
    //         backgroundColor: 'rgba(75, 192, 192, 0.2)',
            
    //       },
    //     ],
    //   };
    // };
  
    const handleDataTypeChange = (event) => {
      setSelectedDataType(event.target.value);
    };
  
    const handleTimeframeChange = (event) => {
      setSelectedTimeframe(event.target.value);
    };

  return (
    <div className='p-3 md:mx-auto'>
      <div className='flex-wrap flex gap-4 justify-center'>
        <div className='flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md'>
          <div className='flex justify-between'>
            <div className=''>
              <h3 className='text-gray-500 text-md uppercase'>Total Likes</h3>
              <p className='text-2xl'>{totalLikes}</p>
            </div>
            <AiFillLike className='bg-teal-600 text-white rounded-full text-5xl p-3 shadow-lg' />
          </div>
          <div className='flex gap-2 text-sm'>
            <span className='text-green-500 flex items-center'>
              <HiArrowNarrowUp />
              {lastMonthLikes}
            </span>
            <div className='text-gray-500'>Last month</div>
          </div>
        </div>
        <div className='flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md'>
          <div className='flex justify-between'>
            <div className=''>
              <h3 className='text-gray-500 text-md uppercase'>Total Comments</h3>
              <p className='text-2xl'>{totalComments}</p>
            </div>
            <HiAnnotation className='bg-indigo-600 text-white rounded-full text-5xl p-3 shadow-lg' />
          </div>
          <div className='flex gap-2 text-sm'>
            <span className='text-green-500 flex items-center'>
              <HiArrowNarrowUp />
              {lastMonthComments}
            </span>
            <div className='text-gray-500'>Last month</div>
          </div>
        </div>
        <div className='flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md'>
          <div className='flex justify-between'>
            <div className=''>
              <h3 className='text-gray-500 text-md uppercase'>Total Blogs</h3>
              <p className='text-2xl'>{totalPosts}</p>
            </div>
            <HiDocumentText className='bg-lime-600 text-white rounded-full text-5xl p-3 shadow-lg' />
          </div>
          <div className='flex gap-2 text-sm'>
            <span className='text-green-500 flex items-center'>
              <HiArrowNarrowUp />
              {lastMonthPosts}
            </span>
            <div className='text-gray-500'>Last month</div>
          </div>
        </div>
      </div>

      <div className='mt-8'>
        <div className='flex justify-end gap-2 mb-4'>
          <select value={selectedDataType} onChange={handleDataTypeChange} className='p-2 border border-gray-300 rounded-md dark:bg-slate-800 dark:border-slate-800'>
            <option value='posts'>Blogs</option>
            <option value='likes'>Likes</option>
            <option value='comments'>Comments</option>
          </select>
          <select value={selectedTimeframe} onChange={handleTimeframeChange} className='p-2 border border-gray-300 rounded-md dark:bg-slate-800 dark:border-slate-800'>
            <option value='daily'>Daily</option>
            <option value='monthly'>Monthly</option>
            <option value='yearly'>Yearly</option>
          </select>
        </div>
        <Bar data={getChartData()} />
      </div>

      

      
    </div>
  );
}

// function generateDummyData(days) {
//   const data = [];
//   for (let i = 1; i <= days; i++) {
//     data.push({
//       date: `2024-05-${i < 10 ? '0' : ''}${i}`,
//       count: Math.floor(Math.random() * 100)
//     });
//   }
//   return data;
// }

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}