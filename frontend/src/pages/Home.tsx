import React from "react";
import InfoCard from "../components/cards/InfoCard";

const Home = () => {
  return (
    <div>
      <div>
        <div className="mx-auto flex flex-col justify-center my-20">
          <a
            href="/"
            className="group md:block text-5xl hover:text-green-400 transition-colors font-semibold"
          >
            NEO
            <span className="text-green-400 transition-all group-hover:text-white">
              PACK
            </span>{" "}
            
          </a>
          <p className="italic font-light underline underline-offset-4 decoration-green-400 group-hover:decoration-white">
              Toolkit
            </p>
        </div>
        <InfoCard />
      </div>
    </div>
  );
};

export default Home;
