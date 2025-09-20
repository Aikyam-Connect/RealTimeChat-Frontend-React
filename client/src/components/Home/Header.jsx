import { useState } from "react";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="container mx-auto px-4 py-4 sticky top-0 z-50">
            <div className="relative w-full rounded-full bg-[#0E2F3F]/50 backdrop-blur-md border border-[#69808C]/30 flex justify-between items-center py-3 px-6 md:px-10 shadow-lg">
                <div className="flex items-center space-x-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20V12C12 7.58172 8.41828 4 4 4C4 8.41828 7.58172 12 12 12V4Z"
                            fill="#9EA8AE"
                        />
                        <path d="M12 12C12 16.4183 16.4183 20 20 20C20 15.5817 16.4183 12 12 12Z" fill="#FFC759" />
                    </svg>
                    <span className="text-xl font-semibold text-[#D3D9DC]">Pod</span>
                </div>
                <nav className="hidden md:flex items-center space-x-8 text-[#9EA8AE]">
                    <a href="#" className="hover:text-[#D3D9DC] font-medium transition-colors">
                        Home
                    </a>
                    <a href="#" className="hover:text-[#D3D9DC] font-medium transition-colors">
                        Profile
                    </a>
                    <a href="#" className="hover:text-[#D3D9DC] font-medium transition-colors">
                        About
                    </a>
                </nav>
                <button className="bg-[#FFC759] text-[#001C29] py-2 px-6 rounded-full font-bold text-sm md:text-base hover:bg-[#ffb72e] transition-colors hidden md:flex items-center space-x-2">
                    <span>Let's Talk</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                        className="w-4 h-4"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                </button>
                <div className="md:hidden flex items-center">
                    <button
                        id="mobile-menu-button"
                        className="text-[#D3D9DC] focus:outline-none flex flex-col justify-center items-center"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div id="hamburger-icon" className={`hamburger-icon ${isOpen ? "open" : ""}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>
                </div>
            </div>
            {isOpen && (
                <div
                    id="mobile-menu"
                    className="absolute top-full left-0 w-full bg-[#0E2F3F]/50 backdrop-blur-md rounded-xl p-4 shadow-lg z-50"
                >
                    <nav className="flex flex-col space-y-2 text-center text-[#D3D9DC]">
                        <a href="#" className="block py-2 px-4 rounded-lg hover:bg-[#194054]">
                            Home
                        </a>
                        <a href="#" className="block py-2 px-4 rounded-lg hover:bg-[#194054]">
                            Profile
                        </a>
                        <a href="#" className="block py-2 px-4 rounded-lg hover:bg-[#194054]">
                            About
                        </a>
                        <button className="w-full bg-[#FFC759] text-[#001C29] py-2 px-6 rounded-full font-bold text-sm hover:bg-[#ffb72e] transition-colors flex items-center justify-center space-x-2 mt-4">
                            <span>Let's Talk</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2.5"
                                stroke="currentColor"
                                className="w-4 h-4"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                                />
                            </svg>
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
}
