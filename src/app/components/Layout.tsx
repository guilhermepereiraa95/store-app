"use client";
import React from "react";
import { Sidebar } from "./Sidebar";
import {
  ArrowRightEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  Bars4Icon,
} from "@heroicons/react/16/solid";
import { useUser } from "../contexts/UserContext";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isLoading } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="relative min-h-screen">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1">
        {/* Top Bar */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <button
            onClick={toggleSidebar}
            className="bg-gray-800 text-white px-4 py-2 rounded"
          >
            <Bars4Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-xl">Welcome, {user?.displayName || "User"}</h1>
          <button
            onClick={async () => {
              await auth.signOut();
              router.push("/login");
            }}
            className="bg-red-500 text-white p-2 rounded flex items-center"
          >
            <ArrowRightStartOnRectangleIcon
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
