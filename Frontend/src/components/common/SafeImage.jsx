import React, { useState } from "react";
import noDataImage from "../../assets/images/nodata.png";

const SafeImage = ({ src, alt, fallback, className = "", ...props }) => {
  const [errored, setErrored] = useState(false);

  const fallbackSrc = fallback || noDataImage;

  return (
    <img
      src={errored ? fallbackSrc : src}
      alt={alt || "Image"}
      className={className}
      onError={() => {
        if (!errored) setErrored(true);
      }}
      {...props}
    />
  );
};

export default SafeImage;
