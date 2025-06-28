import React, { useEffect, useState } from "react";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { like, unlike } from "../slices/wishSlice";
import Footer from "../components/common/Footer";

// ---------------- AdCard ----------------
const AdCard = ({ image, title, location, ad }) => {
  const dispatch = useDispatch();
  const { wishlist: likedAds } = useSelector((state) => state.wishlist);
  const liked = ad && likedAds.some((item) => item._id === ad._id);

  const handleLikeToggle = () => {
    liked ? dispatch(unlike(ad)) : dispatch(like(ad));
  };

  return (
    <div className="group hover:scale-105 transition duration-300 ease-in flex flex-col items-center justify-between shadow-[rgba(0,0,0,0.24)_0px_3px_8px] hover:shadow-[0px_0px_95px_53px#00000024] gap-3 p-4 mt-10 ml-5 rounded-xl relative bg-white">
      <button
        onClick={handleLikeToggle}
        className={`absolute top-2 right-2 transition duration-300 text-lg ${
          liked ? "text-red-500" : "text-gray-400"
        }`}
      >
        {liked ? <Favorite /> : <FavoriteBorder />}
      </button>

      <p className="truncate w-40 mt-1 text-gray-700 font-semibold text-lg text-left">
        {title}
      </p>

      <p className="w-40 text-gray-400 font-normal text-[10px] text-left">
        {location}
      </p>

      <div className="h-[180px] w-full">
        <img
          src={image}
          alt="ad"
          className="h-full w-full object-contain rounded-md"
        />
      </div>
    </div>
  );
};

// ---------------- Home ----------------
const Home = () => {
  const [latestAds, setLatestAds] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/api/products/getProducts"
        );
        const result = await response.json();
        setLatestAds(
          Array.isArray(result?.data?.products) ? result.data.products : []
        );
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col md:flex-row px-6 py-6">
        {/* ---------- Sidebar ---------- */}
        <aside className="w-full md:w-1/4 mb-4 md:mb-0">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Categories</h2>
            <ul className="text-sm space-y-1 pl-4 text-gray-700">
              <li>Car, Bike and Boat</li>
              <li>Cars</li>
              <li>Bicycles & Accessories</li>
              <li className="font-semibold">Property</li>
              <li>Commercial Real Estate</li>
              <li>Houses for Sale</li>
              <li>Rental Apartments</li>
              <li>More</li>
            </ul>
          </div>
        </aside>

        {/* ---------- Main ---------- */}
        <main className="w-full md:w-3/4 md:pl-6">
          {/* Hero */}
          <div className="bg-white h-40 mb-6 flex items-center justify-center rounded shadow">
            <h1 className="text-xl font-semibold">Join Now</h1>
          </div>

          {/* Latest Ads */}
          <h2 className="text-xl font-semibold text-gray-800">Latest Ads</h2>
          <div className="flex flex-wrap">
            {latestAds.map((ad) => (
              <AdCard
                key={ad._id}
                image={`http://localhost:8080/${(ad.pictures?.[0] || "uploads/placeholder.jpg").replace(/\\/g, "/")}`}
                title={ad.title}
                location={ad?.location?.postalCode || "Unknown"}
                ad={ad}
              />
            ))}
          </div>

          {/* Company Websites */}
          <h2 className="text-xl font-semibold text-gray-800 mt-12">
            Company websites in Germany
          </h2>
          <div className="flex flex-wrap">
            {[...Array(3)].map((_, i) => (
              <AdCard
                key={`company-${i}`}
                image="https://via.placeholder.com/150"
                title="Original BMW leather"
                location="Hamburg"
                ad={{ _id: `company-${i}` }}
              />
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
