"use client";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import {
  XMarkIcon,
  HomeIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  UsersIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/16/solid";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const router = useRouter();

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-64 p-4 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out z-50`}
    >
      <button className="text-white" onClick={toggleSidebar}>
        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
      </button>
      <ul className="mt-8 space-y-4">
        <li>
          <button
            onClick={() => router.push("/")}
            className="bg-yellow-500 text-white px-4 py-2 rounded w-full text-left flex items-center"
          >
            <HomeIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Dashboards
          </button>
        </li>
        <li>
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full text-left flex items-center"
          >
            <ShoppingBagIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Manage Products
          </button>
        </li>
        <li>
          <button
            onClick={() => router.push("/sales")}
            className="bg-green-500 text-white px-4 py-2 rounded w-full text-left flex items-center"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Manage Sales
          </button>
        </li>
        <li>
          <button
            onClick={() => router.push("/customers")}
            className="bg-orange-500 text-white px-4 py-2 rounded w-full text-left flex items-center"
          >
            <UsersIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Manage Customers
          </button>
        </li>
        <li>
          <button
            onClick={async () => {
              await auth.signOut();
              router.push("/login");
            }}
            className="bg-red-500 text-white px-4 py-2 rounded w-full text-left flex items-center"
          >
            <ArrowRightEndOnRectangleIcon
              className="h-5 w-5 mr-2"
              aria-hidden="true"
            />
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
