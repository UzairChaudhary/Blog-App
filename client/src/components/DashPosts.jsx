import { Modal, Table, Button, TextInput, Select, Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CSVLink } from "react-csv";

export default function DashPosts() {
  const { currentUser } = useSelector((state) => state.user);
  const [userPosts, setUserPosts] = useState([]);
  const [showMore, setShowMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [postIdToDelete, setPostIdToDelete] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [sidebarData, setSidebarData] = useState({
    searchTerm: '',
    sort: 'desc',
    category: '',
  });
  const [showMoreSearchResult, setShowMoreSearchResult] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const fetchPosts = async (query = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/post/getposts?userId=${currentUser._id}&${query}`);
      const data = await res.json();
      if (res.ok) {
        setLoading(false);
        
        setUserPosts(data.posts);
        if (data.posts.length < 9) {
          setShowMore(false);
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    if (currentUser.isAdmin) {
      fetchPosts();
    }
  }, [currentUser._id]);

  const handleShowMore = async () => {
    const startIndex = userPosts.length;
    try {
      const res = await fetch(
        `/api/post/getposts?userId=${currentUser._id}&startIndex=${startIndex}&${searchQuery}`
      );
      const data = await res.json();
      if (res.ok) {
        setUserPosts((prev) => [...prev, ...data.posts]);
        if (data.posts.length < 9) {
          setShowMore(false);
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleDeletePost = async () => {
    setShowModal(false);
    try {
      const res = await fetch(
        `/api/post/deletepost/${postIdToDelete}/${currentUser._id}`,
        {
          method: 'DELETE',
        }
      );
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        setUserPosts((prev) =>
          prev.filter((post) => post._id !== postIdToDelete)
        );
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleToggleHide = async (postId) => {
    try {
      const res = await fetch(`/api/post/toggle-hide/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUserPosts((prev) =>
          prev.map((post) =>
            post._id === postId ? { ...post, hidden: data.hidden } : post
          )
        );
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    const sortFromUrl = urlParams.get('sort');
    const categoryFromUrl = urlParams.get('category');
    if (searchTermFromUrl || categoryFromUrl) {
      setSidebarData({
        searchTerm: searchTermFromUrl || '',
        sort: sortFromUrl || 'desc',
        category: categoryFromUrl || '',
      });
      setSearchQuery(urlParams.toString());
    }
  }, [location.search]);

  useEffect(() => {
    if (searchQuery) {
      fetchPosts(searchQuery);
    }
  }, [searchQuery]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSidebarData((prevData) => {
      const newData = { ...prevData, [id]: value };
      return newData;
    });
  };
  useEffect(() => {
    const urlParams = new URLSearchParams(sidebarData);
    const queryString = urlParams.toString();
    setSearchQuery(queryString);
    navigate(`?${queryString}`);
  }, [sidebarData, navigate]);

  const handleShowMoreSearchResult = async () => {
    const numberOfPosts = userPosts.length;
    const startIndex = numberOfPosts;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', startIndex);
    const searchQuery = urlParams.toString();
    const res = await fetch(`/api/post/getposts?${searchQuery}`);
    if (!res.ok) {
      return;
    }
    const data = await res.json();
    setUserPosts((prev) => [...prev, ...data.posts]);
    if (data.posts.length < 9) {
      setShowMoreSearchResult(false);
    }
  };

  const handleDownload = () => {
    const input = document.getElementById('posts-table');
    
    // Temporarily hide the delete, edit, and hide/unhide columns
    const deleteCells = input.querySelectorAll('.delete-cell');
    const editCells = input.querySelectorAll('.edit-cell');
    const hideCells = input.querySelectorAll('.hide-cell');
  
    deleteCells.forEach(cell => cell.style.display = 'none');
    editCells.forEach(cell => cell.style.display = 'none');
    hideCells.forEach(cell => cell.style.display = 'none');
  
    // Ensure the table is fully visible
    input.style.width = '100%';
    input.style.overflow = 'visible';
  
    html2canvas(input, {
      allowTaint: true,
      useCORS: true,
      onclone: (document) => {
        // Ensure all images are fully loaded
        document.querySelectorAll('img').forEach((img) => {
          if (!img.complete) {
            img.onload = () => { };
          }
        });
      },
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      
      // Adjust the PDF size and orientation to match the table
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('posts.pdf');
      
      // Restore the visibility of the columns
      deleteCells.forEach(cell => cell.style.display = '');
      editCells.forEach(cell => cell.style.display = '');
      hideCells.forEach(cell => cell.style.display = '');
    });
  };
  
  const headers = [
    { label: "Date updated", key: "updatedAt" },
    { label: "Post image", key: "image" },
    { label: "Post title", key: "title" },
    { label: "Category", key: "category" },
    { label: "Total People Viewed", key: "views" },
    { label: "Likes", key: "likes" },
  ];

  const csvReport = {
    data: userPosts,
    headers: headers,
    filename: 'posts.csv'
  };

  return (
    <div className='table-auto overflow-x-scroll w-full md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
      {currentUser.isAdmin && (
        <div className='w-full flex justify-between'>
          <h1 className='mb-5 font-bold text-xl'>My Uploaded Posts:</h1>
          <Link to={'/create-post'}>
            <Button
              type='button'
              gradientDuoTone='purpleToPink'
              className='mb-5'
            >
              Create a post
            </Button>
          </Link>
        </div>
      )}

      <form className='flex justify-end mb-8 gap-8'>
        <div className='flex items-center gap-2'>
          <label className='whitespace-nowrap font-semibold'>Title:</label>
          <TextInput
            placeholder='Search Blogs'
            id='searchTerm'
            type='text'
            value={sidebarData.searchTerm}
            onChange={handleChange}
          />
        </div>
        <div className='flex items-center gap-2'>
          <label className='font-semibold'>Sort:</label>
          <Select onChange={handleChange} value={sidebarData.sort} id='sort'>
            <option value='desc'>Latest</option>
            <option value='asc'>Oldest</option>
          </Select>
        </div>
        <div className='flex items-center gap-2'>
          <label className='font-semibold'>Category:</label>
          <Select
            onChange={handleChange}
            value={sidebarData.category}
            id='category'
          >
            <option value=''>All</option>
            <option value='reactjs'>React.js</option>
            <option value='nextjs'>Next.js</option>
            <option value='javascript'>JavaScript</option>
          </Select>
        </div>
        <div className='flex items-center gap-2'>
          <label className='font-semibold'>Download:</label>
          <Select onChange={(e) => setDownloadFormat(e.target.value)} value={downloadFormat} id='downloadFormat'>
            <option value='pdf'>PDF</option>
            <option value='csv'>CSV</option>
          </Select>
        </div>
        {downloadFormat === 'pdf' && (
          <Button onClick={handleDownload}>Download PDF</Button>
        )}
        {downloadFormat === 'csv' && (
          <CSVLink {...csvReport}>
            <Button>Download CSV</Button>
          </CSVLink>
        )}
      </form>

        <>
          <Table hoverable className='shadow-md' id='posts-table'>
            <Table.Head>
              <Table.HeadCell>Date updated</Table.HeadCell>
              <Table.HeadCell>Post image</Table.HeadCell>
              <Table.HeadCell>Post title</Table.HeadCell>
              <Table.HeadCell>Category</Table.HeadCell>
              <Table.HeadCell>Likes</Table.HeadCell>
              <Table.HeadCell>Views</Table.HeadCell>
              <Table.HeadCell className="delete-cell">Delete</Table.HeadCell>
              <Table.HeadCell className="edit-cell">Edit</Table.HeadCell>
              <Table.HeadCell className="hide-cell">Hide/Unhide</Table.HeadCell>
            </Table.Head>
            {loading &&
              <Table.Body>
                <Table.Row>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell>
                  <Spinner size='xl' className='mt-5' />

                </Table.Cell>
                
                </Table.Row>
              </Table.Body>
            }
            {console.log("post",userPosts)}
      {!loading && currentUser.isAdmin && userPosts.length > 0 ? (
            <Table.Body  className='divide-y'>
            {userPosts.map((post, index) => (
                
                <Table.Row key={index} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                  <Table.Cell>{new Date(post.updatedAt).toLocaleDateString()}</Table.Cell>
                  <Table.Cell>
                    
                    <Link to={`/post/${post.slug}`}>
                      <img
                        src={post.image}
                        alt={post.title}
                        className='w-20 h-10 object-cover bg-gray-500'
                      />
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Link
                      className='font-medium text-gray-900 dark:text-white'
                      to={`/post/${post.slug}`}
                    >
                      {post.title}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{post.category}</Table.Cell>
                  <Table.Cell>{post.likes}</Table.Cell>
                  <Table.Cell>{post.views}</Table.Cell>
                  <Table.Cell className='delete-cell'>
                    <span
                      onClick={() => {
                        setShowModal(true);
                        setPostIdToDelete(post._id);
                      }}
                      className='font-medium text-red-500 hover:underline cursor-pointer'
                    >
                      Delete
                    </span>
                  </Table.Cell>
                  <Table.Cell  className='edit-cell'>
                    <Link
                      className='text-teal-500 hover:underline'
                      to={`/update-post/${post._id}`}
                    >
                      Edit
                    </Link>
                  </Table.Cell>
                  <Table.Cell  className='hide-cell'>
                    <Button onClick={() => handleToggleHide(post._id)}>
                      {post.hidden ? 'Unhide' : 'Hide'}
                    </Button>
                  </Table.Cell>
                </Table.Row>
            ))}
              </Table.Body>
          ):(
            <Table.Body>
              <Table.Row>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
              {!loading && (
              <Table.Cell>
                No Posts Found
              </Table.Cell>
              )}
              </Table.Row>
          
            </Table.Body>
          )}
          </Table>
          {!loading && showMore && (
            <button
            onClick={handleShowMore}
            className='w-full text-teal-500 self-center text-sm py-7'
            >
              Show more
              </button>
            )}
          {!loading && showMoreSearchResult && (
            <button
            onClick={handleShowMoreSearchResult}
              className='w-full text-teal-500 self-center text-sm py-7'
              >
              Show more
              </button>
            )}
        </>
      <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
            <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
              Are you sure you want to delete this post?
            </h3>
            <div className='flex justify-center gap-4'>
              <Button color='failure' onClick={handleDeletePost}>
                Yes, I{`'`}m sure
              </Button>
              <Button color='gray' onClick={() => setShowModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}