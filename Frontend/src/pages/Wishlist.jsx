import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const Wishlist = () => {
  const { wishlist, total } = useSelector((state) => state.wishlist);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setTotalItems(wishlist.length);
  }, [wishlist]);

  return (
    <div>
      {wishlist.length > 0 ? (
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-center">
          {/* Wishlist items */}
          <div className="w-[100%] md:w-[60%] flex flex-col p-2 mx-auto mt-8">
            <h1 className="text-3xl font-bold text-green-700 mb-6">Your Wishlist</h1>
            <div className="flex flex-wrap gap-6 justify-start">
              {wishlist.map((post, index) => (
                <div
                  key={post._id || index}
                  className="group hover:scale-105 transition duration-300 ease-in flex flex-col items-center justify-between shadow-[rgba(0,_0,_0,_0.24)_0px_3px_8px] hover:shadow-[0px_0px_95px_53px_#00000024] gap-3 p-4 rounded-xl w-[250px]"
                >
                  <div className="w-full h-[180px] flex justify-center items-center">
                    <img
                      src={`http://localhost:8080/${post.pictures?.[0]?.replace(/\\/g, "/") || "uploads/placeholder.jpg"}`}
                      alt="product"
                      className="h-full w-full object-contain rounded-md"
                    />
                  </div>
                  <div className="w-full text-left">
                    <p className="truncate text-gray-700 font-semibold text-lg">{post.title}</p>
                    <p className="text-gray-400 font-normal text-sm mt-1">
                      {post.description?.split(" ").slice(0, 10).join(" ") + "..."}
                    </p>
                    <p className="text-green-700 font-bold text-md mt-2">${post.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Section */}
          <div className="w-[100%] md:w-[40%] mt-5 flex flex-col">
            <div className="flex flex-col p-5 gap-5 my-14 h-[100%] justify-between">
              <div className="flex flex-col gap-5">
                <div className="font-semibold text-xl text-green-800">Your Wishlist</div>
                <div className="font-semibold text-5xl text-green-700 -mt-5">Summary</div>
                <p className="text-xl">
                  <span className="text-gray-700 font-semibold text-xl">Total Items: {totalItems}</span>
                </p>
              </div>
              <div className="flex flex-col">
                <p className="text-xl font-bold">
                  <span className="text-gray-700 font-semibold">Total Amount: </span>${total}
                </p>
                <button className="bg-green-700 hover:bg-purple-50 rounded-lg text-white transition duration-300 ease-linear mt-5 border-2 border-green-600 font-bold hover:text-green-700 p-3 text-xl">
                  Checkout Now
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <h1 className="text-gray-700 font-semibold text-xl mb-2">Your wishlist is empty!</h1>
          <Link to="/">
            <button className="bg-green-600 hover:bg-purple-50 rounded-lg text-white transition duration-300 ease-linear mt-5 border-2 border-green-600 font-semibold hover:text-green-700 p-3 px-10 tracking-wider uppercase">
              Browse Listings
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
