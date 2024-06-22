import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import ThumbsUp from "../assets/thumbs-up.png";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
} from "@nextui-org/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ForumPage() {
  const [doubts, setDoubts] = useState([]);
  const [commentors, setCommentors] = useState([]);
  const [isLiked, setIsLiked] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [communityData, setCommunityData] = useState({});
  const [topRecommendations, setTopRecommendations] = useState([]);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { communityId } = useParams();
  const navigate = useNavigate();

  const adminData = localStorage.getItem("user_creds");
  const adminData1 = JSON.parse(adminData);
  const admin = adminData1._id;

  useEffect(() => {
    fetchDoubts();
  }, []);

  const fetchDoubts = async () => {
    const response = await axios.get(
      `http://127.0.0.1:5000/get_doubts/${communityId}/${admin}`
    );
    setDoubts(response.data.doubts);
    setCommentors(response.data.commentors);
    setIsLiked(response.data.isLiked);
    setCommunityData(response.data.communityData);
    setTopRecommendations(response.data.top_recommendations); 
    console.log(response.data.top_recommendations)
  };

  const handleAskDoubt = async () => {
    if (!title || !description) {
      return toast.error("Please fill in all the fields!");
    }
    const response = await axios.post("http://127.0.0.1:5000/create_doubt", {
      communityId: communityId,
      commentHeading: title,
      commentContent: description,
      commentorId: admin,
    });
    if (response.status === 200) {
      fetchDoubts();
      toast.success("Doubt added successfully!");
      setTitle("");
      setDescription("");
    } else {
      toast.error("An error occurred while adding your doubt");
    }
  };

  const handleDeleteDoubt = async (event, doubtId) => {
    event.preventDefault();
    try {
      const response = await axios.delete(
        'http://127.0.0.1:5000/delete_comment/${doubtId}'
      );
      if (response.status === 200) {
        fetchDoubts();
        toast.success("Doubt deleted successfully!");
      } else {
        console.error("Error response:", response);
        toast.error("An error occurred while deleting your doubt");
      }
    } catch (error) {
      console.error("Error deleting doubt:", error);
      toast.error("An error occurred while deleting your doubt");
    }
  };

  const handleLike = async (event, index) => {
    event.stopPropagation();
    event.preventDefault();
    const commentId = doubts[index]._id;
    const response = await axios.post("http://127.0.0.1:5000/like_doubt", {
      commentId: commentId,
      like: true,
      userId: admin,
    });
    if (response.status === 200) {
      fetchDoubts();
    }
  };

  const handleRemoveLike = async (event, index) => {
    event.stopPropagation();
    event.preventDefault();
    const commentId = doubts[index]._id;
    const response = await axios.post("http://127.0.0.1:5000/like_doubt", {
      commentId: commentId,
      like: false,
      userId: admin,
    });
    if (response.status === 200) {
      fetchDoubts();
    }
  };

  return (
    <div className="min-h-screen w-[80%] ml-[20%] p-5 px-8 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <h1 className="text-purple1 text-2xl font-mont font-bold">
              {communityData.communityName}
            </h1>
            {communityData.memberIds && (
              <Chip size="sm" variant="flat" color="secondary" className="ml-2">
                {communityData.memberIds.length} Members
              </Chip>
            )}
          </div>
          <p className="text-gray-600 max-w-full text-ellipsis">
            {communityData.communityDescription}
          </p>
        </div>
        <button
          onClick={onOpen}
          className="bg-purple1 hover:bg-purple-700 transition-all font-pop text-white px-4 py-2 rounded-full text-md"
        >
          New Post
        </button>
      </div>
      <h3 className="text-purple1 text-xl font-mont font-bold mt-4">Recommendations for you</h3>
      <div className="flex flex-col mt-3 mb-4">
        {topRecommendations.map((top, index) => (
          <Link
            onClick={() => navigate(`/forum/${communityData._id}/${top._id}`)}
            className="bg-gray-100 shadow-md mb-4 rounded-xl p-3 flex flex-col items-start relative hover:scale-105 transition-all cursor-pointer"
            key={top._id}
          >
            {top.commentorId === admin && (
              <Dropdown>
                <DropdownTrigger>
                  <button
                    onClick={(event) => event.preventDefault()}
                    className="absolute top-2 right-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      className="lucide lucide-ellipsis-vertical"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Action event example"
                  onAction={(key) => alert(key)}
                >
                  <DropdownItem
                    onClick={(event) => handleDeleteDoubt(event, top._id)}
                    key="delete"
                    className="text-danger"
                    color="danger"
                  >
                    Delete Doubt
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
            <div className="flex items-center">
              <div className="bg-[#1E1A1D] text-white rounded-full h-7 w-7 flex justify-center items-center">
                {commentors[index].charAt(0).toUpperCase()}
              </div>
              <p className="text-gray-700 ml-2 font-semibold text-sm font-mont">
                {commentors[index]}
              </p>
            </div>
            <h1 className="font-bold font-mont text-ellipsis mt-1 max-w-full text-wrap">
              {top.commentHeading}
            </h1>
            <p className="max-w-full truncate text-sm text-gray-700">
              {top.commentContent}
            </p>

            <div className="flex items-end">
              <div className="flex items-center mt-2">
                <button
                  onClick={(event) =>
                    isLiked[index]
                      ? handleRemoveLike(event, index)
                      : handleLike(event, index)
                  }
                  className="likeBtn h-8 w-8 p-1 flex justify-center items-center rounded-xl hover:bg-gray-400"
                >
                  {isLiked[index] ? (
                    <img src={ThumbsUp} alt="Liked" className="h-5 w-5" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-thumbs-up h-5 w-5"
                    >
                      <path d="M7 10v12" />
                      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                    </svg>
                  )}
                </button>

                <div className="flex ml-[-0.6rem] h-7 w-7 p-1 justify-center items-center text-xs font-pop">
                  {top.likes}
                </div>
              </div>

              <div className="flex items-center ml-2">
                <div
                  onClick={() =>
                    navigate(/forum/${communityData._id}/${top._id})
                  }
                  className="h-7 p-1 flex justify-center items-center rounded-xl hover:bg-gray-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-message-square-text h-5 w-5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M13 8H7" />
                    <path d="M17 12H7" />
                  </svg>

                  <p className="text-sm font-pop ml-1">View Replies</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <h3 className="text-purple1 text-xl font-mont font-bold">Explore all</h3>

      <div className="flex flex-col mt-3">
        {doubts.map((doubt, index) => (
          <Link
            onClick={() => navigate(/forum/${communityData._id}/${doubt._id})}
            className="bg-gray-100 shadow-md mb-4 rounded-xl p-3 flex flex-col items-start relative hover:scale-105 transition-all cursor-pointer"
            key={doubt._id}
          >
            {doubt.commentorId === admin && (
              <Dropdown>
                <DropdownTrigger>
                  <button
                    onClick={(event) => event.preventDefault()}
                    className="absolute top-2 right-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      className="lucide lucide-ellipsis-vertical"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Action event example"
                  onAction={(key) => alert(key)}
                >
                  <DropdownItem
                    onClick={(event) => handleDeleteDoubt(event, doubt._id)}
                    key="delete"
                    className="text-danger"
                    color="danger"
                  >
                    Delete Doubt
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
            <div className="flex items-center">
              <div className="bg-[#1E1A1D] text-white rounded-full h-7 w-7 flex justify-center items-center">
                {commentors[index].charAt(0).toUpperCase()}
              </div>
              <p className="text-gray-700 ml-2 font-semibold text-sm font-mont">
                {commentors[index]}
              </p>
            </div>
            <h1 className="font-bold font-mont text-ellipsis mt-1 max-w-full text-wrap">
              {doubt.commentHeading}
            </h1>
            <p className="max-w-full truncate text-sm text-gray-700">
              {doubt.commentContent}
            </p>

            <div className="flex items-end">
              <div className="flex items-center mt-2">
                <button
                  onClick={(event) =>
                    isLiked[index]
                      ? handleRemoveLike(event, index)
                      : handleLike(event, index)
                  }
                  className="likeBtn h-8 w-8 p-1 flex justify-center items-center rounded-xl hover:bg-gray-400"
                >
                  {isLiked[index] ? (
                    <img src={ThumbsUp} alt="Liked" className="h-5 w-5" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-thumbs-up h-5 w-5"
                    >
                      <path d="M7 10v12" />
                      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                    </svg>
                  )}
                </button>

                <div className="flex ml-[-0.6rem] h-7 w-7 p-1 justify-center items-center text-xs font-pop">
                  {doubt.likes}
                </div>
              </div>

              <div className="flex items-center ml-2">
                <div
                  onClick={() =>
                    navigate(/forum/${communityData._id}/${doubt._id})
                  }
                  className="h-7 p-1 flex justify-center items-center rounded-xl hover:bg-gray-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-message-square-text h-5 w-5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M13 8H7" />
                    <path d="M17 12H7" />
                  </svg>

                  <p className="text-sm font-pop ml-1">View Replies</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Modal
        backdrop="blur"
        className="font-mont"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center font-bold">
                Ask Your Doubt
              </ModalHeader>
              <ModalBody className="flex flex-col space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Title of Your Doubt
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What is your doubt about?"
                    className="mt-1 block w-full py-2 px-3 border-2 bg-white border-gray-200 rounded-xl shadow-sm hover:border-gray-400 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Doubt Description
                  </label>
                  <Textarea
                    id="description"
                    minRows={6}
                    maxRows={10}
                    variant="bordered"
                    className="mt-1 block w-full bg-white rounded-xl sm:text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    type="text"
                    placeholder="Describe your doubt in detail"
                    required
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onClick={(event) => handleAskDoubt(event)}
                  onPress={onClose}
                >
                  Ask
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <ToastContainer />
    </div>
  );
}

export default ForumPage;