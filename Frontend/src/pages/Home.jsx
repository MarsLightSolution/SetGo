import React, { useEffect, useState } from "react";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { like, unlike } from "../slices/wishSlice";
import Footer from "../components/common/Footer";
import { Link } from "react-router-dom";

// AdCard styled with Tailwind
const AdCard = ({ image, title, location, ad, price }) => {
  const dispatch = useDispatch();
  const { wishlist: likedAds } = useSelector((state) => state.wishlist);
  const liked = ad && likedAds.some((item) => item._id === ad._id);

  const handleLikeToggle = () => {
    liked ? dispatch(unlike(ad)) : dispatch(like(ad));
  };

  return (
    <div className="relative group hover:scale-105 transition duration-300 ease-in flex flex-col items-center justify-between shadow-[rgba(0,_0,_0,_0.24)_0px_3px_8px] hover:shadow-[0px_0px_95px_53px_#00000024] gap-3 p-4 rounded-xl w-[250px] bg-white">
      <button
        onClick={handleLikeToggle}
        className={`absolute top-2 right-2 transition duration-300 text-lg ${
          liked ? "text-red-500" : "text-gray-400"
        }`}
      >
        {liked ? <Favorite /> : <FavoriteBorder />}
      </button>

      <div className="w-full h-[180px] flex justify-center items-center">
        <img
          src={image}
          alt="ad"
          className="h-full w-full object-contain rounded-md"
        />
      </div>

      <div className="w-full text-left">
        <p className="truncate text-gray-700 font-semibold text-lg">{title}</p>
        <p className="text-gray-400 font-normal text-sm mt-1">{location}</p>
        <p className="text-green-700 font-bold text-md mt-2">${price}</p>
      </div>
    </div>
  );
};

// ---------------- Home ----------------
const Home = () => {
  const [latestAds, setLatestAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const token = localStorage.getItem("accessToken");
  const fetchProducts = async (category = "All Products") => {
    try {
      const query = category !== "All Products" ? `?category=${category}` : "";
      const response = await fetch(
        `http://localhost:8080/api/products/getProducts${query}`
        ,
        {
        headers: {
          "Content-Type": "application/json",
          Authorization:`${token}`,
        },
      }
      );
      const result = await response.json();
      const ads = Array.isArray(result?.data?.products)
        ? result.data.products
        : [];
      setLatestAds(ads);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };
  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/categories");
      const result = await response.json();
      if (Array.isArray(result?.data?.categories)) {
        setCategories(["All Products", ...result.data.categories]); // optional default
      } else {
        console.warn("Categories not received as expected");
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    fetchProducts(category);
  };

  const category = [
    "All Products",
    "Cars & Motorcycles",
    "Real Estate",
    "Jobs",
    "Household & Furniture",
    "Electronics",
    "Leisure, Hobby & Neighborhood",
    "Service",
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="flex flex-col md:flex-row px-6 py-6">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 mb-4 md:mb-0">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">Categories</h2>
              <ul className="text-sm space-y-1 pl-4 text-gray-700">
                {category.map((cat, index) => (
                  <li
                    key={index}
                    onClick={() => handleCategoryClick(cat)}
                    className={`cursor-pointer hover:underline ${
                      activeCategory === cat
                        ? "font-semibold text-green-700"
                        : ""
                    }`}
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4 md:pl-6">
            {/* Hero Banner */}
            <div className="bg-white h-40 mb-6 flex items-center justify-center rounded shadow">
              <h1 className="text-xl font-semibold">Join Now</h1>
            </div>

            {/* Latest Ads */}
            <h2 className="text-xl font-semibold text-gray-800">Latest Ads</h2>
            <div className="flex flex-wrap gap-6">
              {latestAds.map((ad, index) => (
                <div key={index} className="mb-6">
                  <Link to={`product/${ad._id}`}>
                    <AdCard
                      image={`http://localhost:8080/${
                        ad.pictures?.[0]?.replace(/\\/g, "/") ||
                        "uploads/placeholder.jpg"
                      }`}
                      title={ad.title}
                      location={ad.location?.postalCode || "Unknown"}
                      ad={ad}
                      price={ad.price}
                    />
                  </Link>
                </div>
              ))}
            </div>

            {/* Company Websites */}
            <h2 className="text-xl font-semibold text-gray-800 mt-12">
              Company websites in Germany
            </h2>
            <div className="flex flex-wrap gap-6">
              {[...Array(3)].map((_, i) => (
                <AdCard
                  image="https://via.placeholder.com/150"
                  title="Original BMW leather"
                  location="Hamburg"
                  ad={{ _id: `company-${i}` }}
                  price={250}
                />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Home;
