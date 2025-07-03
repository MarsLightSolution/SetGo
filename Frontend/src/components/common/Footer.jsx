import React from "react";

const Footer = () => {
  const classifiedsItems = [
    "About Us",
    "Career",
    "Press",
    "Classified Magazines",
    "Engagement",
    "Mobile Apps",
  ];

  const informationItems = [
    "Help",
    "Tips for your safety",
    "Child and Youth Protection",
    "Privacy policy",
    "Privacy settings",
    "Terms of use",
    "Imprint",
  ];

  const companiesItems = [
    "Classified real estate",
    "Pro infopoint",
    "Pro packages for companies",
    "Advertising on Classified",
  ];

  return (
    <div className="bg-[#F4F2EF] ">
      <div className="w-full py-10 text-black px-4 lg:px-10">
        <div className="border-b border-richblack-700 pb-10">
          <div className="flex flex-col lg:flex-row justify-between gap-10">
            {/* Column 1 */}
            <div className="flex flex-col gap-3">
              <div className="font-semibold text-[20px] mb-2">Classifieds</div>
              {classifiedsItems.map((item, idx) => (
                <p key={idx} className="text-sm hover:underline text-[20px] cursor-pointer">
                  {item}
                </p>
              ))}
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-3">
              <div className="font-semibold text-[20px] mb-2">Information</div>
              {informationItems.map((item, idx) => (
                <p key={idx} className="text-sm hover:underline text-[20px] cursor-pointer">
                  {item}
                </p>
              ))}
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-3">
              <div className="font-semibold text-[20px] mb-2">For companies</div>
              {companiesItems.map((item, idx) => (
                <p key={idx} className="text-sm hover:underline text-[20px] cursor-pointer">
                  {item}
                </p>
              ))}
            </div>

            {/* Column 4 & 5 */}
            {Array(2).fill(0).map((_, index) => (
              <div key={index} className="flex flex-col gap-3">
                <div className="font-semibold text-[20px] mb-2">Classifieds</div>
                {classifiedsItems.map((item, idx) => (
                  <p key={idx} className="text-sm hover:underline  text-[20px] cursor-pointer">
                    {item}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
