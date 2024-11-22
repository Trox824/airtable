import Link from "next/link";
export function Navbar() {
  return (
    <header className="absolute left-0 right-0 top-0 flex h-14 flex-col bg-teal-500 pl-5 pr-4 text-white">
      <div className="flex flex-1">
        <div className="flex h-full flex-row items-center">
          <div className="mr-4 h-6 w-6 cursor-pointer rounded-full hover:bg-white">
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
          </div>
          <div className="group group-hover:opacity-100"></div>
          <div className="flex flex-row items-center">
            <a
              id="appTopBarHomeButton"
              aria-label="Go home"
              className="mr2 circle focus-visible-white border-darken3 relative flex flex-none"
              href="/"
              style={{ width: "24px", height: "24px" }}
            >
              <div
                className="animate flex flex-auto items-center justify-center"
                style={{ transform: "scale(1)" }}
              ></div>
              <div className="animate redDusty circle invisible absolute">
                <div
                  className="circle flex items-center justify-center"
                  style={{
                    width: "24px",
                    height: "24px",
                    background: "var(--palette-neutral-white)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      fillRule="evenodd"
                      d="M5.64775 2.22725C5.86742 2.44692 5.86742 2.80308 5.64775 3.02275L3.233 5.4375H10.125C10.4357 5.4375 10.6875 5.68934 10.6875 6C10.6875 6.31066 10.4357 6.5625 10.125 6.5625H3.233L5.64775 8.97725C5.86742 9.19692 5.86742 9.55308 5.64775 9.77275C5.42808 9.99242 5.07192 9.99242 4.85225 9.77275L1.47725 6.39775C1.37176 6.29226 1.3125 6.14918 1.3125 6C1.3125 5.85082 1.37176 5.70774 1.47725 5.60225L4.85225 2.22725C5.07192 2.00758 5.42808 2.00758 5.64775 2.22725Z"
                      fill="#99455a"
                    ></path>
                  </svg>
                </div>
              </div>
            </a>
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
