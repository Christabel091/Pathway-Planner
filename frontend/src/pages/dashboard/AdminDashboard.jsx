import React from "react";
import { useAuth } from "../../components/AuthContext";
import { PieChart, Pie, Cell } from "recharts";


//for now, we will keep the goals as constant
const goalProgress = [
  { name: "Completed", value: 70 },
  { name: "Remaining", value: 30 },
];

//colors for the pie chard
const COLORS = ["#059669", "#f9caca"]; 

export default function AdminDashboard() {

    const { user } = useAuth(); // 👈 get user from AuthContext

  // fallback in case user data isn't loaded yet
  const displayName = user?.username || "Admin";

  return (

    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 h-screen fixed left-0 top-0 bg-gradient-to-b from-white via-amber-50 to-rose-50 flex flex-col justify-between p-6">
  <div className="flex flex-col space-y-6">
    <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">
      Pathway Planner
    </h1>

    <nav>
      <ul className="space-y-2">
        {["Dashboard", "User Analysis", "Announcement", "Manage Users", "Reports", "Account Settings", "Log Out"].map(
          (item) => (
            <li
              key={item}
              className="p-2 rounded-lg text-gray-700 font-medium hover:bg-rose-100 hover:text-emerald-700 transition cursor-pointer"
            >
              {item}
            </li>
          )
        )}
      </ul>
    </nav>
  </div>

  <footer className="text-xs text-gray-400 mt-6">
    © 2025 Pathway Planner
  </footer>
</aside>

      {/* Main content area */}
      <main className="flex-1 ml-64 p-10 bg-gradient-to-b from-rose-50 via-amber-50 to-emerald-50">
        {/* Header */}
        <header className="bg-rose-100 shadow-md rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-2xl font-semibold text-emerald-700">
          <p className="text-gray-600 text-lg mt-2 sm:mt-0">
          Welcome back 
          <p className = "text-emerald-600">{displayName}</p>
        </p>
        </h2>
        
        </header>

        {/* Dashboard grid sections */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Total users, active users */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-emerald-700 mb-4">Users Analysis</h3>

          <PieChart width={140} height={140}>

            <defs>
              {/* Added gradient for a better looking design */}
              <linearGradient id="goalGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>

            <Pie
              data={goalProgress}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              startAngle={90}
              endAngle={450}
              dataKey="value"
            >
              {/* Filling the completed as gradient and reamining as rose color */}
              <Cell fill="url(#goalGradient)" />
              <Cell fill="#f9caca" />
            </Pie>
          </PieChart>

          <p className="mt-3 text-gray-700">
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-700 bg-clip-text text-transparent">
              70%
            </span>{" "}
            active user
          </p>
        </div>

          {/* Announcements*/}
          <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-emerald-700 mb-2">Announcement</h3>
            <p className="text-gray-600">Make an announcement </p>
          </div>

          {/* Meds */}
          <div className="bg-gradient-to-br from-rose-100 via-amber-50 to-rose-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition flex flex-col items-start justify-center">
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">Manage Users</h3>
            <p className="text-gray-700 mb-3">Click to view all the users</p>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow">
              All Users
            </button>
          </div>


          {/* Reports */}
          <div className="bg-gradient-to-br from-rose-100 via-amber-50 to-rose-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition flex flex-col items-start justify-center">
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">Reports</h3>
            <p className="text-gray-700 mb-3">Download reports.</p>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow">
              Download PDF
            </button>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow">
              Download CSV
            </button>
          </div>

        </section>
      </main>
    </div>
  );
}
