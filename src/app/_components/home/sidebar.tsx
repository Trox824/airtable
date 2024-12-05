import React from "react";

export const Sidebar: React.FC = () => {
  return (
    <div className="z-10 flex h-full w-12 flex-col border-r-[1px] border-black/10 bg-white pt-5">
      {/* Home Icon */}
      <div className="mb-5 flex justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 16 16"
          className="icon flex-none text-black/60 hover:text-black/80"
        >
          <use
            fill="currentColor"
            href="/icons/icon_definitions.svg#House"
          ></use>
        </svg>
      </div>

      {/* Users Icon */}
      <div className="mb-5 flex justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 16 16"
          className="icon flex-none text-black/60 hover:text-black/80"
        >
          <use
            fill="currentColor"
            href="/icons/icon_definitions.svg#UsersThree"
          ></use>
        </svg>
      </div>
    </div>
  );
};
