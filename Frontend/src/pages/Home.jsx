import React, { useEffect, useState } from "react";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { like, unlike } from "../slices/wishSlice";
import Footer from "../components/common/Footer";
import { useNavigate } from "react-router-dom";

const AdCard = ({ image, title, location, ad, price }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { wishlist: likedAds } = useSelector((state) => state.wishlist);
  const liked = ad && likedAds.some((item) => item._id === ad._id);

  const handleLikeToggle = () => {
    liked ? dispatch(unlike(ad)) : dispatch(like(ad));
  };

  const handleCardClick = () => {
    navigate(`/products/product/${ad._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative group hover:scale-105 transition duration-300 ease-in flex flex-col items-center justify-between shadow-md hover:shadow-lg gap-3 p-3 rounded-xl w-[200px] bg-white"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleLikeToggle();
        }}
        className={`absolute top-2 right-2 transition duration-300 text-lg ${
          liked ? "text-red-500" : "text-gray-400"
        }`}
      >
        {liked ? <Favorite /> : <FavoriteBorder />}
      </button>

      <div className="w-full h-[140px] flex justify-center items-center">
        <img
          src={image}
          alt="ad"
          className="h-full w-full object-contain rounded-md"
        />
      </div>

      <div className="w-full text-left">
        <p className="truncate text-gray-700 font-semibold text-sm">{title}</p>
        <p className="text-gray-400 font-normal text-xs mt-1">{location}</p>
        <p className="text-green-700 font-bold text-sm mt-2">₹{price}</p>
      </div>
    </div>
  );
};

const SectionWithAds = ({ title, ads, pagination, onPageChange }) => (
  <div className="bg-white p-4 rounded shadow mt-3">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
    <div className="flex flex-wrap gap-4">
      {ads.map((ad) => (
        <AdCard
          key={ad._id}
          image={`http://localhost:8080/${
            ad.pictures?.[0]?.replace(/\\/g, "/") || "uploads/placeholder.jpg"
          }`}
          title={ad.title}
          location={ad.location?.postalCode || "Unknown"}
          ad={ad}
          price={ad.price}
        />
      ))}
    </div>
    <div className="flex justify-center items-center gap-4 mt-6">
      <button
        disabled={!pagination.hasPrevPage}
        onClick={() =>
          onPageChange((p) => ({ ...p, currentPage: pagination.prevPage }))
        }
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
        onClick={() =>
          onPageChange((p) => ({ ...p, currentPage: pagination.nextPage }))
        }
        className={`px-4 py-1 rounded ${
          pagination.hasNextPage
            ? "bg-gray-200 hover:bg-gray-300"
            : "bg-gray-100 cursor-not-allowed"
        }`}
      >
        Next
      </button>
    </div>
  </div>
);

const Home = () => {
  const [latestAds, setLatestAds] = useState([]);
  const [recommendedAds, setRecommendedAds] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const token = localStorage.getItem("accessToken");
  const userId = JSON.parse(localStorage.getItem("user"))?._id;
  const PAGE_SIZE = 12;

  const filter = useSelector((state) => state.filter);
  const [latestPagination, setLatestPagination] = useState({ currentPage: 1 });
  const [recommendedPagination, setRecommendedPagination] = useState({ currentPage: 1 });

  const fetchProducts = async (type, page) => {
    try {
      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
        userId,
        minPrice: filter.minPrice?.toString() || "0",
        maxPrice: filter.maxPrice?.toString() || "1000000",
      });

      if (type === "category" && activeCategory !== "All Products") {
        params.append("category", activeCategory);
      }

      const res = await fetch(
        `http://localhost:8080/api/products/getProducts?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
      const json = await res.json();
      const { products = [], ...pagination } = json.data ?? {};

      if (type === "category") {
        setLatestAds(products);
        setLatestPagination(pagination);
      } else {
        setRecommendedAds(products);
        setRecommendedPagination(pagination);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchProducts("category", latestPagination.currentPage);
  }, [activeCategory, latestPagination.currentPage, filter]);

  useEffect(() => {
    fetchProducts("recommended", recommendedPagination.currentPage);
  }, [recommendedPagination.currentPage]);

  useEffect(() => {
    setLatestPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [filter]);

  return (
    <div className="min-h-screen bg-gray-100 pt-[2rem]">
      <SectionWithAds
        title="Latest Ads"
        ads={latestAds}
        pagination={latestPagination}
        onPageChange={setLatestPagination}
      />

      <SectionWithAds
        title="Recommended For You"
        ads={recommendedAds}
        pagination={recommendedPagination}
        onPageChange={setRecommendedPagination}
      />

      <Footer />
    </div>
  );
};

export default Home;
