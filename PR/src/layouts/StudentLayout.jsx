import { Outlet, NavLink } from 'react-router-dom'

const navLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/student/companies', label: 'Companies', icon: '🏢' },
    { to: '/student/applications', label: 'My Applications', icon: '📋' },
    { to: '/student/profile', label: 'Profile', icon: '👤' },
    { to: '/student/settings', label: 'Settings', icon: '⚙️' },
]

function StudentLayout() {
    return (
        <div className="min-h-screen bg-background flex flex-col">

            {/* Navbar */}
            <nav className="bg-primary text-white px-6 py-3 flex items-center justify-between shadow-md fixed top-0 left-0 right-0 z-50">

                {/* Logo */}
                <div className="flex items-center gap-2">
                    <span className="text-accent text-2xl font-bold tracking-tight">
                        Place<span className="text-white">Rise</span>
                    </span>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <button className="relative text-gray-300 hover:text-white transition">
                        🔔
                        <span className="absolute -top-1 -right-1 bg-danger text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                            3
                        </span>
                    </button>

                    {/* Student Name + Avatar */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm">
                            S
                        </div>
                        <span className="text-sm text-gray-300">Shiv</span>
                    </div>

                    {/* Logout */}
                    <button className="text-sm bg-accent hover:bg-blue-600 transition px-3 py-1.5 rounded-md font-medium">
                        Logout
                    </button>
                </div>
            </nav>

            {/* Body */}
            <div className="flex flex-1 pt-14">

                {/* Sidebar */}
                <aside className="w-56 bg-primary text-white min-h-screen fixed top-14 left-0 bottom-0 flex flex-col p-4 gap-1 shadow-lg">

                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                                    ? 'bg-accent text-white shadow-sm'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <span>{link.icon}</span>
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </aside>

                {/* Main Content */}
                <main className="ml-56 flex-1 p-6 min-h-screen">
                    <Outlet />
                </main>

            </div>
        </div>
    )
}

export default StudentLayout