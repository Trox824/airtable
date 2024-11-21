import Link from "next/link";
import React from "react";

const HomePage: React.FC = () => {
  return (
    <div className="absolute h-full w-full overflow-hidden bg-[#F9FAFB]">
      {/* Navbar */}
      <div className="z-20 flex h-12 w-full flex-row items-center justify-between border-b-[1px] border-black/10 bg-white px-4">
        {/* Left section */}
        <div className="flex items-center">
          <button className="mr-2 p-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="text-black/60"
            >
              <use href="/icons/icon_definitions.svg#List"></use>
            </svg>
          </button>
          <img src="/airtable-logo.svg" alt="Logo" className="h-6" />
        </div>

        {/* Center section - Search */}
        <div className="max-w-2xl flex-1 px-4">
          <div className="flex items-center rounded-md border border-black/10 bg-[#F9FAFB] px-3 py-1.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="mr-2 text-black/40"
            >
              <use href="/icons/icon_definitions.svg#MagnifyingGlass"></use>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-black/40"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-black/60 hover:text-black/80">
            <span className="text-sm">Help</span>
          </button>
          <button className="p-2 text-black/60 hover:text-black/80">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <use href="/icons/icon_definitions.svg#Bell"></use>
            </svg>
          </button>
          <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#172B4D] text-white">
            <span className="text-sm">N</span>
          </div>
        </div>
      </div>

      {/* Existing content */}
      <div className="z-10 flex h-[calc(100%-48px)] flex-row">
        {/* Sidebar */}
        <div className="z-10 flex h-full w-12 flex-col border-r-[1px] border-black/10 bg-white pt-5">
          <div className="mb-5 flex justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              className="icon flex-none"
            >
              <use
                fill="currentColor"
                href="/icons/icon_definitions.svg#House"
              ></use>
            </svg>
          </div>
          <div className="mb-5 flex justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              className="icon flex-none"
            >
              <use
                fill="currentColor"
                href="/icons/icon_definitions.svg#UsersThree"
              ></use>
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-12 pt-8">
          <h1 className="font-main-content-sans text-at-half-black pb-6 text-[27px] font-[675] leading-[1.26]">
            Home
          </h1>

          {/* Action Cards Grid */}
          <div className="mb-6 grid w-full grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
            {/* Start with AI Card */}
            <a href="">
              <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover h-full rounded-md bg-white p-4">
                <div className="flex flex-row">
                  <div className="flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      className="icon flex-none"
                    >
                      <use
                        fill="rgb(221, 4, 168)"
                        href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#AiFeature"
                      ></use>
                    </svg>
                  </div>
                  <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
                    Start with AI
                  </h2>
                </div>
                <p className="mt-1">
                  Turn your process into an app with data and interfaces using
                  AI.
                </p>
              </div>
            </a>

            {/* Templates Card */}
            <a href="">
              <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover h-full rounded-md bg-white p-4">
                <div className="flex flex-row">
                  <div className="flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      className="undefined flex"
                    >
                      <use
                        fill="rgb(99, 73, 141)"
                        href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#GridFour"
                      ></use>
                    </svg>
                  </div>
                  <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
                    Start with templates
                  </h2>
                </div>
                <p className="mt-1">
                  Select a template to get started and customize as you go.
                </p>
              </div>
            </a>

            {/* Upload Card */}
            <a href="">
              <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover h-full rounded-md bg-white p-4">
                <div className="flex flex-row">
                  <div className="flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      className="icon flex-none"
                    >
                      <use
                        fill="rgb(13, 127, 120)"
                        href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#ArrowUp"
                      ></use>
                    </svg>
                  </div>
                  <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
                    Quickly upload
                  </h2>
                </div>
                <p className="mt-1">
                  Easily migrate your existing projects in just a few minutes.
                </p>
              </div>
            </a>

            {/* Start from scratch Card */}
            <Link href="">
              <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover h-full rounded-md bg-white p-4">
                <div className="flex flex-row">
                  <div className="flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      className="icon flex-none"
                    >
                      <use
                        fill="rgb(59, 102, 163)"
                        href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#Table"
                      ></use>
                    </svg>
                  </div>
                  <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
                    Start from scratch
                  </h2>
                </div>
                <p className="mt-1">
                  Create a new blank base with custom tables, fields, and views.
                </p>
              </div>
            </Link>
          </div>

          {/* Filter Controls */}
          <div className="mb-5 flex flex-row flex-nowrap justify-between">
            <div className="mr-2 flex flex-row">
              <div className="text-at-half-black/70 hover:text-at-half-black mr-3 flex flex-row items-center">
                <p className="mr-1 text-[15px]">Opened by you</p>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className="icon fill-at-half-black/70 flex-none"
                >
                  <use
                    fill="currentColor"
                    href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#ChevronDown"
                  ></use>
                </svg>
              </div>
              <div className="text-at-half-black/70 hover:text-at-half-black flex flex-row items-center">
                <p className="mr-1 text-[15px]">Show all types</p>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className="icon fill-at-half-black/70 flex-none"
                >
                  <use
                    fill="currentColor"
                    href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#ChevronDown"
                  ></use>
                </svg>
              </div>
            </div>
            <div className="flex flex-row items-center">
              {/* View Controls */}
              <div className="flex cursor-pointer flex-row p-1">
                <svg
                  width="20px"
                  height="20px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  opacity="0.4"
                  className="fill-at-half-black opacity-55 hover:opacity-70"
                >
                  <path
                    d="M4 18L20 18"
                    stroke="#1f1f1f"
                    strokeWidth="2"
                    strokeLinecap="round"
                  ></path>
                  <path
                    d="M4 12L20 12"
                    stroke="#1f1f1f"
                    strokeWidth="2"
                    strokeLinecap="round"
                  ></path>
                  <path
                    d="M4 6L20 6"
                    stroke="#1f1f1f"
                    strokeWidth="2"
                    strokeLinecap="round"
                  ></path>
                </svg>
              </div>
              <div className="flex cursor-pointer flex-row rounded-full bg-black/5 p-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  className="fill-at-half-black flex opacity-100"
                >
                  <use
                    fill="rgb(99, 73, 141)"
                    href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#GridFour"
                  ></use>
                </svg>
              </div>
            </div>
          </div>

          {/* Base Grid */}
          <div className="grid-auto-flow-col grid w-full grid-cols-4 gap-4">
            <Link href="/asddasdsa/">
              <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover mt-1 h-24 rounded-md bg-white p-4">
                <div className="flex h-full w-full items-center">
                  <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-500">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 16 16"
                      className="undefined"
                    >
                      <use
                        fill="currentColor"
                        href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#RocketLaunch"
                      ></use>
                    </svg>
                  </div>
                  <div className="">
                    <p className="text-[13px] font-medium">Base 1</p>
                    <p className="mt-2 text-[11px] text-[#666]">Base</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/1asdasd">
              <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover mt-1 h-24 rounded-md bg-white p-4">
                <div className="flex h-full w-full items-center">
                  <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-500">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 16 16"
                      className="undefined"
                    >
                      <use
                        fill="currentColor"
                        href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#RocketLaunch"
                      ></use>
                    </svg>
                  </div>
                  <div className="">
                    <p className="text-[13px] font-medium">Base 2</p>
                    <p className="mt-2 text-[11px] text-[#666]">Base</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
