import React, { useEffect, useState } from "react";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { like, unlike } from "../slices/wishSlice";
import Footer from "../components/common/Footer";
import { Link } from "react-router-dom";
import bannerImage from "../assets/images/banner1.png";
import { useNavigate } from "react-router-dom";

/* ---------- AdCard (unchanged) ---------- */
const AdCard = ({ image, title, location, ad, price }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { wishlist: likedAds } = useSelector((state) => state.wishlist);
  const liked = ad && likedAds.some((item) => item._id === ad._id);

  const handleLikeToggle = () => {


    liked ? dispatch(unlike(ad)) : dispatch(like(ad));
  };
    const handleCardClick = () => {
    navigate(`/products/product/${ad._id}`); // Open detail page on card click
  };

  return (
    <div onClick={handleCardClick} 
    className="relative group hover:scale-105 transition duration-300 ease-in flex flex-col items-center justify-between shadow-[rgba(0,_0,_0,_0.24)_0px_3px_8px] hover:shadow-[0px_0px_95px_53px_#00000024] gap-3 p-4 rounded-xl w-[250px] bg-white">
      <button
        onClick={(e)=>{
          e.stopPropagation();
          handleLikeToggle();}}
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

/* ---------- Home with pagination ---------- */
const Home = () => {
  const [latestAds, setLatestAds]         = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const token = localStorage.getItem("accessToken");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages : 1,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage   : null,
    prevPage   : null,
  });

  const PAGE_SIZE = 10; // tweak if you want more / fewer per page

  /* fetchProducts now accepts page & limit */
  const fetchProducts = async (category = "All Products", page = 1) => {
    try {
      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
      });
      if (category !== "All Products") params.append("category", category);

      const res    = await fetch(
        `http://localhost:8080/api/products/getProducts?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization:`${token}`,
          },
        }
      );
      const json   = await res.json();

      /* your custom labels: products, totalPages, etc. */
      const {
        products     = [],
        totalPages   = 1,
        currentPage  = 1,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
      } = json.data ?? {};

      setLatestAds(products);
      setPagination({
        currentPage,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
      });
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  /* run every time category OR page changes */
  useEffect(() => {
    fetchProducts(activeCategory, pagination.currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, pagination.currentPage]);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    /* reset to first page when category changes */
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const goToPage = (page) =>
    setPagination((p) => ({ ...p, currentPage: page }));

  /* static portal categories */
  const categories = [
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
          {/* ---------- Sidebar ---------- */}
          <aside className="w-full md:w-1/4 mb-4 md:mb-0">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">Categories</h2>
              <ul className="text-sm space-y-1 pl-4 text-gray-700">
                {categories.map((cat) => (
                  <li
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`cursor-pointer hover:underline ${
                      activeCategory === cat ? "font-semibold text-green-700" : ""
                    }`}
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ---------- Main ---------- */}
          <main className="w-full md:w-3/4 md:pl-6">
            {/* Hero */}
            <section className="py-6">
              <div className="max-w-4xl mx-auto px-4 relative">
                <img
                  src={bannerImage}
                  alt="User Banner"
                  className="w-full h-[233px] object-cover rounded-xl shadow"
                />
                <div className="absolute bottom-6 left-10">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg">
                    Join Now
                  </button>
                </div>
              </div>
            </section>

            {/* Latest Ads */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Latest Ads
            </h2>
            <div className="flex flex-wrap gap-6">
              {latestAds.map((ad) => (
                <div key={ad._id} className="mb-6">
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
                </div>
              ))}
            </div>

            {/* ---------- Pager ---------- */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => goToPage(pagination.prevPage)}
                className={`px-4 py-1 rounded ${
                  pagination.hasPrevPage
                    ? "bg-gray-200 hover:bg-gray-300"
                    : "bg-gray-100 cursor-not-allowed"
                }`}
              >
                Prev
              </button>

              <span className="text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                disabled={!pagination.hasNextPage}
                onClick={() => goToPage(pagination.nextPage)}
                className={`px-4 py-1 rounded ${
                  pagination.hasNextPage
                    ? "bg-gray-200 hover:bg-gray-300"
                    : "bg-gray-100 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Home;
