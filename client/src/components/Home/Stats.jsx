export default function Stats() {
    return (
        <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0 text-center sm:text-left pt-8">
            <div>
                <span className="block text-4xl font-bold text-[#D3D9DC]">10K+</span>
                <span className="block text-[#69808C] font-medium">Active Users</span>
            </div>
            <div>
                <span className="block text-4xl font-bold text-[#D3D9DC]">500+</span>
                <span className="block text-[#69808C] font-medium">Rooms Daily</span>
            </div>
            <div>
                <span className="block text-4xl font-bold text-[#D3D9DC]">99.9%</span>
                <span className="block text-[#69808C] font-medium">Uptime</span>
            </div>
        </div>
    );
}
