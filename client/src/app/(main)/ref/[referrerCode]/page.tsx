"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

const UserReferred = () => {
  const { referrerCode } = useParams<{ referrerCode: string }>();
  console.log({referrerCode})

  useEffect(() => {
    if (referrerCode) {
      localStorage.setItem("ref", referrerCode);
    }

    window.location.replace("/");
  }, []);

  return null;
}

export default UserReferred;
