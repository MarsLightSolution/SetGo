import React, { useEffect, useState, useRef } from "react";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { like, unlike } from "../slices/wishSlice";
import Footer from "../components/common/Footer";
import { useNavigate } from "react-router-dom";
import bannerImage from "../assets/images/banner1.png";
import leftadImage from "../assets/images/ad01.png";
import rightadImage from "../assets/images/ad02.png";

const AdCard = ({ image, title, location, ad, price }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { wishlist: likedAds } = useSelector((state) => state.wishlist);
  const liked = ad && likedAds.some((item) => item._id === ad._id);

  const handleLikeToggle = () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      alert("You need to login first to like items.");
      return;
    }

    liked ? dispatch(unlike(ad)) : dispatch(like(ad));
  };

  const handleCardClick = () => {
    navigate(`/products/product/${ad._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
     className="relative group cursor-pointer hover:scale-105 transition duration-300 ease-in flex flex-col items-center justify-between border border-gray-800 shadow-md hover:shadow-lg gap-3 p-3 rounded-xl w-[200px] bg-white"

    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleLikeToggle();
        }}
        className={`absolute top-2 right-2 cursor-pointer transition duration-300 text-lg ${
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
        <p className="text-green-700 font-bold text-sm mt-2">{price}€</p>
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
  const PAGE_SIZE = 12;
  const filter = useSelector((state) => state.filter);
  const [latestPagination, setLatestPagination] = useState({ currentPage: 1 });
  const [recommendedPagination, setRecommendedPagination] = useState({
    currentPage: 1,
  });

  const fetchProducts = async (type, page) => {
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });

      if (type === "category" && activeCategory !== "All Products") {
        params.append("category", activeCategory);
      }

      if (filter.minPrice) params.append("minPrice", filter.minPrice);
      if (filter.maxPrice) params.append("maxPrice", filter.maxPrice);
      if (filter.condition) params.append("condition", filter.condition);
      if (filter.radius) params.append("radius", filter.radius);
      if (filter.city) params.append("city", filter.city);

      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");

      if (token && userId) {
        params.append("userId", userId);
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

      if (!res.ok) {
        console.error("Failed to fetch products");
        return;
      }

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
  }, [activeCategory, latestPagination.currentPage]);

  useEffect(() => {
    fetchProducts("recommended", recommendedPagination.currentPage);
  }, [recommendedPagination.currentPage]);

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

  const galleryData = [
    {
      title: "XVS 950 Midnightstar",
      location: "Oelde",
      price: "5,195 €",
      image: "/images/bike.jpg",
    },
    {
      title: "Washing machine",
      location: "Mönchengladbach",
      price: "333 €",
      image: "/images/washingMachine.png",
    },
    {
      title: "Transport trolleys",
      location: "Bad Buchau",
      price: "115 €",
      image: "/images/transportTrolley.png",
    },
    {
      title: "Camping gear set",
      location: "Dresden",
      price: "150 €",
      image: "/images/camping.png",
    },
    {
      title: "Horses help children",
      location: "Schlutup",
      price: "VB",
      image: "/images/horse.jpg",
    },
  ];

  const companyWebsites = [
    {
      name: "Flipkart",
      description: "Shop electronics, fashion, more",
      image: "/images/flipkart.svg",
    },
    {
      name: "Amazon",
      description: "Online shopping destination",
      image: "/images/amazon.png",
    },
    {
      name: "Myntra",
      description: "Fashion & lifestyle store",
      image: "/images/myntra.jpg",
    },
    {
      name: "Snapdeal",
      description: "Deals and discounts online",
      image: "/images/snapdeal.png",
    },
    {
      name: "Ajio",
      description: "Trendy clothes and accessories",
      image: "/images/ajio.jpg",
    },
    {
      name: "Reliance Digital",
      description: "Electronics & gadgets",
      image: "/images/reliance.png",
    },
  ];

  const companyRef = useRef(null);
  const scrollCompanySlider = (direction) => {
    if (!companyRef.current) return;
    const scrollAmount = direction === "left" ? -300 : 300;
    companyRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const galleryRef = useRef(null);
  const scrollGallery = (direction) => {
    if (!galleryRef.current) return;
    const scrollAmount = direction === "left" ? -300 : 300;
    galleryRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };
  return (
    <div className="min-h-screen bg-gray-100 pt-[2rem]">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-screen-xl px-4 flex flex-wrap gap-4 items-start">
          {/* Left Ad */}
          <div className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
            <img
              src={leftadImage}
              alt="Left Ad"
              className="w-full h-[550px] object-cover rounded"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col gap-3 w-full lg:w-auto">
            {/* Banner */}
            <div className="relative">
              <img
                src={bannerImage}
                alt="Banner"
                className="w-full h-[233px] object-cover rounded-xl shadow"
              />
              <div className="absolute bottom-4 left-6 z-10">
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg">
                  Join Now
                </button>
              </div>
            </div>

            {/* Category + Gallery Section */}
            <div className="flex flex-wrap gap-4">
              {/* Categories */}
              <div className="bg-white p-4 rounded shadow w-full md:w-[38%] h-[350px] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-3">Categories</h2>
                <ul className="text-sm space-y-4 pl-2 text-gray-700">
                  {categories.map((cat) => (
                    <li
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setLatestPagination((p) => ({
                          ...p,
                          currentPage: 1,
                        }));
                      }}
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

              {/* Gallery */}
              {/* gallery items here */}

              <div className="bg-white p-4 rounded shadow flex-1 w-full md:w-[60%]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Gallery</h2>
                  <div className="flex gap-2">
                    <button
                      className="w-8 h-8 border cursor-pointer border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      onClick={() => scrollGallery("left")}
                    >
                      &#8592;
                    </button>
                    <button
                      className="w-8 h-8 border border-gray-300 cursor-pointer rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      onClick={() => scrollGallery("right")}

                    >
                      &#8594;
                    </button>
                  </div>
                </div>

               </div>
                <div
                  ref={galleryRef}
                  className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar pb-2"
                >
                  {galleryData.map((item, index) => (
                    <div
                      key={index}
                      className="min-w-[150px] max-w-[180px] flex-shrink-0 bg-white border rounded shadow-sm relative"
                    >
                      <div className="w-full h-[200px] bg-white flex justify-center items-center">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full object-contain"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium text-gray-800">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.location}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 bg-lime-400 text-xs font-bold px-2 py-[2px] rounded-sm">
                        {item.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
            {/* Company Websites */}
            <div className="bg-white p-4 mt-3 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Company Websites
                </h2>
                <div className="flex gap-2">
                  <button
                    className="w-8 h-8 border border-gray-300 cursor-pointer rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    onClick={() => scrollCompanySlider("left")}
                  >
                    &#8592;
                  </button>
                  <button
                    className="w-8 h-8 border border-gray-300 cursor-pointer rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    onClick={() => scrollCompanySlider("right")}
                  >
                    &#8594;
                  </button>
                </div>
              </div>

              <div
                ref={companyRef}
                className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar pb-2"
              >
                {companyWebsites.map((site, index) => (
                  <div
                    key={index}
                    className="w-[22%] bg-white border rounded shadow-sm flex-shrink-0 relative"
                  >
                    <div className="w-full h-[140px] bg-white flex justify-center items-center">
                      {site.image ? (
                        <img
                          src={site.image}
                          alt={site.name}
                          className="h-[90px] object-contain"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">
                          Logo {companyIndex + index + 1}
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium text-gray-800">
                        {site.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {site.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 overflow-hidden">
            {companyWebsites
              .slice(companyIndex, companyIndex + visibleCompanyCount)
              .map((site, index) => (
                <div
                  key={index}
                  className="w-[22%] bg-white border rounded shadow-sm flex-shrink-0 relative"
                >
                  <div className="w-full h-[140px] bg-white flex justify-center items-center">
                    {site.image ? (
                      <img
                        src={site.image}
                        alt={site.name}
                        className="h-[50px] object-contain"
                      />
                    ) : (
                      <span className="text-sm text-gray-400">
                        Logo {companyIndex + index + 1}
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-800">{site.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{site.description}</p>
                  </div>
                </div>
              ))}
          </div>
          {/* Right Ad */}
          <div className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
            <img
              src={rightadImage}
              alt="Right Ad"
              className="w-full h-[550px] object-cover rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
