import Link from "next/link";
export function Navbar() {
  return (
    <header className="absolute left-0 right-0 top-0 flex h-14 flex-col bg-teal-500 pl-5 pr-4 text-white">
      <div className="flex flex-1">
        {/* Left section with logo and base name */}
        <div className="flex h-full flex-row items-center">
          <div className="mr-4 h-6 w-6 cursor-pointer rounded-full hover:bg-white">
            <svg
              width="24"
              height="24"
              viewBox="0 0 16 16"
              className="hover:opacity-0"
            >
              <use
                fill="currentColor"
                href="/icons/icon_definitions.svg#RocketLaunch"
              />
            </svg>
          </div>
          <div className="group group-hover:opacity-100">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            >
              <path
                fillRule="evenodd"
                d="M5.64775 2.22725C5.86742 2.44692 5.86742 2.80308 5.64775 3.02275L3.233 5.4375H10.125C10.4357 5.4375 10.6875 5.68934 10.6875 6C10.6875 6.31066 10.4357 6.5625 10.125 6.5625H3.233L5.64775 8.97725C5.86742 9.19692 5.86742 9.55308 5.64775 9.77275C5.42808 9.99242 5.07192 9.99242 4.85225 9.77275L1.47725 6.39775C1.37176 6.29226 1.3125 6.14918 1.3125 6C1.3125 5.85082 1.37176 5.70774 1.47725 5.60225L4.85225 2.22725C5.07192 2.00758 5.42808 2.00758 5.64775 2.22725Z"
                fill="#000000"
              />
            </svg>
          </div>
          <div className="flex flex-row items-center">
            <span className="mr-1 text-[17px] font-semibold">Base 1</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="icon fill-at-half-black/70 flex-none"
            >
              <use
                fill="currentColor"
                href="/icons/icon_definitions.svg#ChevronDown"
              />
            </svg>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center px-4">
          <div className="flex h-auto flex-row">
            {["Data", "Automations", "Interfaces"].map((item) => (
              <div
                key={item}
                className="mr-2 flex h-7 cursor-pointer flex-row items-center rounded-full px-3 text-black/65 hover:bg-black/10"
              >
                <Link className="flex items-center" href="/">
                  <p className="text-[13px] text-white">{item}</p>
                </Link>
              </div>
            ))}
          </div>
          <div className="mr-3 h-5 border-l-[0.8px] border-white/10" />
          <div>
            <div className="mr-2 flex h-7 cursor-pointer flex-row items-center rounded-full px-3 text-black/65 hover:bg-black/10">
              <Link className="flex items-center" href="/">
                <p className="text-[13px] text-white">Forms</p>
              </Link>
            </div>
          </div>
        </nav>

        {/* Right section with icons and profile */}
        <div className="flex flex-1 items-center justify-end">
          <div></div>
          <div className="flex h-7 cursor-pointer flex-row items-center rounded-full px-3 text-black/65 hover:bg-black/10">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="icon flex-none"
            >
              <use
                fill="#FFFFFF"
                href="/icons/icon_definitions.svg#ClockCounterClockwise"
              />
            </svg>
          </div>
          <div className="flex h-7 cursor-pointer flex-row items-center rounded-full px-3 text-black/65 hover:bg-black/10">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="icon flex-none"
            >
              <use fill="#FFFFFF" href="/icons/icon_definitions.svg#Question" />
            </svg>
            <span className="ml-1 text-[13px] text-white">Help</span>
          </div>
          <div className="shadow-at-main-nav mx-3 flex h-7 items-center rounded-full bg-white">
            <div className="flex w-7 cursor-pointer items-center justify-center text-black/65">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className="flex-none"
              >
                <use
                  fill="currentColor"
                  href="/icons/icon_definitions.svg#Bell"
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
