import React from "react";
import { FaSearch, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { MdOutlineAddCircle } from "react-icons/md";

const Navbar = () => {
  return (
    <div className="w-full">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img src="/logo.svg" alt="logo" className="h-6 w-6" />
          <span className="text-2xl font-semibold text-[#2e4a2f]">kleinanzeigen</span>
        </div>

        {/* Register & Login */}
        <div className="flex items-center gap-3">
          <button className="border border-black text-black px-4 py-1 rounded-full text-sm">
            Register
          </button>
          <span className="text-sm text-gray-500">or</span>
          <button className="flex items-center gap-2 bg-lime-400 px-4 py-1 rounded-full text-sm font-medium">
            <FaUser />
            Log in
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-lime-400 py-4 px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 max-w-screen-xl mx-auto">
          {/* Search Inputs */}
          <div className="flex flex-1 bg-white rounded-full overflow-hidden shadow-sm w-full">
            {/* Search Input */}
            <div className="flex items-center px-3 gap-2 border-r border-gray-300 w-full max-w-[300px]">
              <FaSearch className="text-gray-500" />
              <input
                type="text"
                placeholder="What are you looking for?"
                className="outline-none text-sm py-2 w-full"
              />
            </div>

            {/* Category Dropdown */}
            <select className="px-4 text-sm border-r border-gray-300 outline-none text-gray-700">
              <option>Alle Kategorien</option>
            </select>

            {/* Postal Code Input */}
            <div className="flex items-center gap-2 px-4 border-r border-gray-300">
              <FaMapMarkerAlt className="text-gray-500" />
              <input
                type="text"
                placeholder="Postal code or city"
                className="outline-none text-sm py-2 w-32"
              />
            </div>

            {/* Disabled Input */}
            <input
              type="text"
              placeholder="Ganzer Ort"
              disabled
              className="px-4 text-sm text-gray-400 bg-gray-100 cursor-not-allowed w-28"
            />

            {/* Find Button */}
            <button className="bg-white text-green-900 font-semibold px-6 rounded-full ml-2 mr-2">
              Find
            </button>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-6 text-sm text-green-900 font-medium">
            <div className="flex items-center gap-1 cursor-pointer">
              <MdOutlineAddCircle className="text-lg" />
              Advertise
            </div>
            <div className="flex items-center gap-1 cursor-pointer">
              <FaUser className="text-lg" />
              Mine
            </div>
          </div>
        </div>
      </div>
    </div>
    // <div className="w-full">
    //   <div className="bg-white flex justify-between items-center px-6 py-4 shadow-sm">
    //     <div className="flex items-center space-x-2">
    //       <img alt="Kleinanzeigen" />
    //       <span className="text-2xl font-semibold text-[#2e4a2f]">
    //         kleinanzeigen
    //       </span>
    //     </div>
    //     <div className="flex items-center gap-3">
    //       <button className="border border-green-700 text-white bg-white px-4 py-1 rounded-full text-sm">
    //         Register
    //       </button>
    //       <span className="text-sm text-gray-500">or</span>
    //       <button className="flex items-center gap-2 bg-lime-400 px-4 py-1 rounded-full text-sm font-medium">
    //         <FaUser />
    //         Log in
    //       </button>
    //     </div>
    //   </div>
    //   <div>

    //   </div>
    // </div>
  );
};

export default Navbar;
