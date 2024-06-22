import React, { useEffect, useState } from "react";
import { Button } from "@nextui-org/react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Account1() {
  const userId = JSON.parse(localStorage.getItem("user_creds"))._id;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-[80%] ml-[20%] bg-gray p-5">
      <Button color="primary">
        <Link to='/changeQuestions'>Change Roadmap</Link>
      </Button>
    </div>
  );
}

export default Account1;
