import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { MdOutlineCalendarToday } from "react-icons/md";
import Footer from "../components/common/Footer";
import { unlike } from "../slices/wishSlice";
// import { Link } from 'react-router-dom';
import EmptyImage from '../assets/images/binocular.png';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setTotalItems(wishlist.length);
  }, [wishlist]);

  const handleRemove = (post) => {
    dispatch(unlike(post));
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen py-8 px-4 flex flex-col justify-between">
      <div className="flex-grow">
        {wishlist.length > 0 ? (
          <div className="max-w-5xl mx-auto bg-white rounded-md shadow-md p-6 mb-10">
            <h1 className="text-3xl font-bold text-green-700 mb-6">My Watchlist</h1>

            <div className="flex flex-col gap-6">
              {wishlist.map((post, index) => (
                <div
                  key={post._id || index}
                  className="border border-gray-100 p-4 rounded flex flex-col md:flex-row md:items-center justify-between"
                >
                  {/* Image */}
                  <div className="w-full md:w-[160px] h-[120px] flex items-center justify-center mb-4 md:mb-0">
                    <img
                      src={`http://localhost:8080/${post.pictures?.[0]?.replace(/\\/g, "/") || "uploads/placeholder.jpg"}`}
                      alt="product"
                      className="h-full w-full object-contain rounded-md"
                    />
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 md:ml-4 w-full">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt className="text-gray-400" />
                        55278 Mommenheim
                      </span>
                      <span className="flex items-center gap-1">
                        <MdOutlineCalendarToday className="text-gray-400" />
                        Yesterday, 18:25
                      </span>
                    </div>

                    <p className="font-bold text-lg text-black">{post.title || "Untitled product"}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {post.description?.split(" ").slice(0, 15).join(" ") + "..."}
                    </p>

                    <p className="text-green-700 font-bold text-xl mt-2">
                      € {post.price}
                      <span className="text-sm font-normal text-green-700 ml-1">negotiable</span>
                    </p>

                    {/* ✅ Only Remove Button */}
                    <div className="mt-2">
                      <button
                        onClick={() => handleRemove(post)}
                        className="border border-green-800 text-green-800 hover:text-white hover:bg-green-700 transition px-4 py-1.5 rounded-full text-sm font-semibold"
                      >
                        Remove from watchlist
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
          {/* Empty Wishlist Image */}
          <img
            src={EmptyImage}
            alt="Empty Wishlist"
            className="w-40 h-40 object-contain mb-4 opacity-80"
          />

          {/* Message */}
          <h1 className="text-gray-700 font-semibold text-xl mb-2">
            Your wishlist is currently empty.
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Looks like you haven't added any listings yet.
          </p>

          {/* Browse Listings Button */}
          <Link to="/">
            <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md px-6 py-2 transition duration-300 border border-green-600 hover:bg-white hover:text-green-700 cursor-pointer">
              Browse Listings
            </button>
          </Link>
        </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Wishlist;