import Header from "../components/Home/Header";
import Hero from "../components/Home/Hero";
import Stats from "../components/Home/Stats";
import RoomCard from "../components/Home/RoomCard";
import Footer from "../components/Home/Footer";

export default function Home() {
    return (
        <div className="bg-[#001C29] text-[#D3D9DC] flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-20 py-8 md:py-16 grid lg:grid-cols-2 gap-12 items-center">
                <div>
                    <Hero />
                    <Stats />
                </div>
                <div className="relative flex justify-center lg:justify-end">
                    <RoomCard />
                </div>
            </main>
            <Footer />
        </div>
    );
}
