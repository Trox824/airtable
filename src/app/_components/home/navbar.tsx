"use client";
import Link from "next/link";
import { api } from "~/trpc/react";

interface NavbarProps {
  BaseId: string;
}

export function Navbar({ BaseId }: NavbarProps) {
  const {
    data: base,
    isLoading,
    error,
  } = api.base.fetchById.useQuery(
    { id: BaseId },
    {
      retry: false,
      enabled: !!BaseId,
    },
  );

  const baseName = isLoading
    ? "Loading..."
    : error
      ? "Error fetching base"
      : (base?.name ?? "Not Found");

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-navbar bg-teal-500 pl-5 pr-4 text-white">
      <div className="flex flex-1">
        <div className="flex h-full flex-row items-center">
          <div className="mr-4 h-6 w-6 cursor-pointer rounded-full hover:bg-white">
            <Link href="/">
              <svg
                width="24"
                height="20.4"
                viewBox="0 0 200 170"
                xmlns="http://www.w3.org/2000/svg"
                style={{ shapeRendering: "geometricPrecision" }}
                className="mr-1"
              >
                <g>
                  <path
                    fill="hsla(0, 0%, 100%, 0.95)"
                    d="M90.0389,12.3675 L24.0799,39.6605 C20.4119,41.1785 20.4499,46.3885 24.1409,47.8515 L90.3759,74.1175 C96.1959,76.4255 102.6769,76.4255 108.4959,74.1175 L174.7319,47.8515 C178.4219,46.3885 178.4609,41.1785 174.7919,39.6605 L108.8339,12.3675 C102.8159,9.8775 96.0559,9.8775 90.0389,12.3675"
                  />
                  <path
                    fill="hsla(0, 0%, 100%, 0.95)"
                    d="M105.3122,88.4608 L105.3122,154.0768 C105.3122,157.1978 108.4592,159.3348 111.3602,158.1848 L185.1662,129.5368 C186.8512,128.8688 187.9562,127.2408 187.9562,125.4288 L187.9562,59.8128 C187.9562,56.6918 184.8092,54.5548 181.9082,55.7048 L108.1022,84.3528 C106.4182,85.0208 105.3122,86.6488 105.3122,88.4608"
                  />
                  <path
                    fill="hsla(0, 0%, 100%, 0.95)"
                    d="M88.0781,91.8464 L66.1741,102.4224 L63.9501,103.4974 L17.7121,125.6524 C14.7811,127.0664 11.0401,124.9304 11.0401,121.6744 L11.0401,60.0884 C11.0401,58.9104 11.6441,57.8934 12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
                  />
                </g>
              </svg>
            </Link>
          </div>
          <div className="group group-hover:opacity-100"></div>
          <div className="flex flex-row items-center">
            <span className="mr-1 text-[17px] font-semibold">{baseName}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="icon fill-at-half-black/70 flex-none"
            >
              <path
                fill="currentColor"
                d="M4 6l4 4 4-4H4z" // Down arrow path
              />
            </svg>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center px-[15px]">
          <div className="flex h-auto flex-row">
            {["Data", "Automations", "Interfaces"].map((item) => (
              <div
                key={item}
                className={`mr-[8px] flex h-7 cursor-pointer flex-row items-center rounded-full px-3 text-black/65 ${item === "Data" ? "bg-black/10" : ""}`}
              >
                <Link className="flex items-center" href="/">
                  <p className="text-[13px] text-white">{item}</p>
                </Link>
              </div>
            ))}
          </div>
          <div className="ml-[3px] h-5 border-r-[1px] border-white/10" />
          <div>
            <div className="mr-2 flex h-7 cursor-pointer flex-row items-center rounded-full px-6 text-black/65 hover:bg-black/10">
              <Link className="flex items-center" href="/">
                <p className="text-[13px] text-white">Forms</p>
              </Link>
            </div>
          </div>
        </nav>

        {/* Right section with icons and profile */}
        <div className="flex flex-1 items-center justify-end">
          <div className="flex h-7 cursor-pointer flex-row items-center rounded-full px-3 text-black/65 hover:bg-black/10">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="icon flex-none"
            >
              <path
                fill="#FFFFFF"
                d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.25-4v4.5l3.5 2-0.75 1.25-4-2.25V4h1.25z"
              />
            </svg>
          </div>
          <div className="flex h-7 cursor-pointer flex-row items-center rounded-full px-3 text-[13px] font-normal text-white hover:bg-black/10">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="icon mr-1 flex-none"
            >
              <path
                fill="#FFFFFF"
                d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-10c-1.4 0-2.5 1.1-2.5 2.5h1.5c0-.6.4-1 1-1s1 .4 1 1c0 1-1.5 1.5-1.5 2.5v.5h1.5v-.5c0-.5 1.5-1 1.5-2.5 0-1.4-1.1-2.5-2.5-2.5zM7.3 11h1.5v-1.5H7.3z"
              />
            </svg>
            <span className="hover:text-white/100">Help</span>
          </div>
          <div className="bg:black/10 mx-4 rounded-2xl bg-black/10 px-3 py-[6px] text-[13px] font-normal shadow">
            Trial: 12 days left
          </div>
          <div className="flex h-7 cursor-pointer flex-row items-center text-black/65">
            <span className="mr-2 flex items-center rounded-2xl bg-white px-3 py-1 text-[13px] text-teal-500 shadow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1 flex-none"
              >
                <path d="M18 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path>
                <circle cx="10" cy="8" r="5"></circle>
                <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path>
              </svg>
              Share
            </span>
          </div>
          <div className="mx-[7px] flex h-7 items-center rounded-full bg-white">
            <div className="flex w-7 cursor-pointer items-center justify-center text-black/65">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className="flex-none"
                style={{ shapeRendering: "geometricPrecision" }}
              >
                <path
                  fill="currentColor"
                  d="M8 16c1.1 0 2-.9 2-2H6c0 1.1.9 2 2 2zm6-5c-.55 0-1-.45-1-1V6c0-2.76-2.24-5-5-5S3 3.24 3 6v4c0 .55-.45 1-1 1s-1 .45-1 1 .45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1z"
                />
              </svg>
            </div>
          </div>
          <div className="ml-2 flex h-7 items-center justify-center">
            <img
              alt="Profile"
              width="28"
              height="28"
              className="h-7 w-7 cursor-pointer rounded-full border-[0.8px] border-white"
              src="/_next/image?url=https%3A%2F%2Flh3.googleusercontent.com%2Fa%2FACg8ocJBWlVosOkWx23ztU8OtChxKKDvhuSvtxpCJGpc12QE38OBIA%3Ds96-c&w=64&q=75"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
