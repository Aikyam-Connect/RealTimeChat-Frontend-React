export default function RoomCard() {
    return (
        <div className="bg-[#0E2F3F] p-8 rounded-2xl shadow-xl border border-[#194054] flex flex-col space-y-6 max-w-sm w-full">
            <h2 className="text-2xl font-semibold text-center text-[#D3D9DC]">Join or Create a Room</h2>
            <button className="w-full bg-[#FFC759] text-[#001C29] py-3 px-6 rounded-xl font-bold text-lg hover:bg-[#ffb72e] transition-colors flex items-center justify-center space-x-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Create New Room</span>
            </button>
            <div className="flex items-center space-x-4">
                <hr className="w-full border-t border-[#194054]" />
                <span className="text-[#69808C] font-semibold text-sm">OR</span>
                <hr className="w-full border-t border-[#194054]" />
            </div>

            <form className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                    type="text"
                    placeholder="Enter Room Code..."
                    className="flex-grow bg-[#001C29] border border-[#194054] rounded-lg px-4 py-3 text-[#D3D9DC] placeholder-[#69808C] focus:outline-none focus:ring-2 focus:ring-[#FFC759] transition-shadow"
                />
                <button
                    type="submit"
                    className="bg-[#194054] text-[#D3D9DC] py-3 px-5 rounded-lg font-semibold hover:bg-[#0E2F3F] border border-transparent hover:border-[#69808C] transition-colors whitespace-nowrap"
                >
                    Join Room
                </button>
            </form>
        </div>
    );
}
