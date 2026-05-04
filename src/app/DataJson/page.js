"use client";
import { useState } from "react";
import data from '../../utils/data.json';
import teachers from '../../utils/teachers.json';

export default function Page() {
  const [students, setStudents] = useState(data);
  const [teacherList, setTeacherList] = useState(teachers);
  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState(null);

  const filteredStudents = students.filter(p =>
    `${p.firstname} ${p.lastname}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTeachers = teacherList.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-50 px-8 py-10">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Directory</h1>
        <p className="text-gray-400 text-sm">
          {activeTab === "students" ? `${students.length} students` : `${teacherList.length} teachers`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("students")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === "students"
                ? "bg-black text-white"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab("teachers")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === "teachers"
                ? "bg-black text-white"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            Teachers ({teacherList.length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 bg-white px-4 py-2 rounded-full text-sm w-full sm:w-72 outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {activeTab === "students" && (
        filteredStudents.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-gray-400 text-lg">No results found for "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredStudents.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">

                <div className="flex items-start justify-between mb-4">
                  <img src={p.image} alt={p.firstname} className="w-14 h-14 rounded-full object-cover" />
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    p.job === 'developer' ? 'bg-blue-100 text-blue-600' :
                    p.job === 'designer'  ? 'bg-purple-100 text-purple-600' :
                    p.job === 'manager'   ? 'bg-green-100 text-green-600' :
                                           'bg-yellow-100 text-yellow-600'
                  }`}>
                    {p.job}
                  </span>
                </div>

                {/* info */}
                <h2 className="font-semibold text-gray-800 mb-1">{p.firstname} {p.lastname}</h2>
                <p className="text-xs text-gray-400 mb-3">{p.email}</p>
                <div className="flex gap-4 text-xs text-gray-500 mb-4">
                  <span>{p.age} yrs</span>
                  <span>{p.height} cm</span>
                </div>

                {/* items toggle button */}
                <button
                  onClick={() => setOpenItems(openItems === p.id ? null : p.id)}
                  className="w-full py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors mb-3"
                >
                  {openItems === p.id ? "Hide Items" : `Show Items (${p.items.length})`}
                </button>

                {/* items dropdown */}
                {openItems === p.id && (
                  <div className="flex gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                    {p.items.map(item => (
                      <div key={item.id} className="flex flex-col items-center gap-1">
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                        <span className="text-xs text-gray-500">{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setStudents(students.filter(s => s.id !== p.id))}
                  className="w-full py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* teachers */}
      {activeTab === "teachers" && (
        filteredTeachers.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-gray-400 text-lg">No results found for "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTeachers.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">

                {/* top row */}
                <div className="flex items-start justify-between mb-4">
                  <img src={t.image} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-cyan-100 text-cyan-600">
                    teacher
                  </span>
                </div>

                {/* info */}
                <h2 className="font-semibold text-gray-800 mb-1">{t.name}</h2>
                <p className="text-xs text-gray-500 mb-1">{t.role}</p>
                <p className="text-xs text-gray-400 mb-1">{t.department}</p>
                <p className="text-xs text-gray-400 mb-4">{t.email || "—"}</p>

                <button
                  onClick={() => setTeacherList(teacherList.filter(x => x.id !== t.id))}
                  className="w-full py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )
      )}

    </main>
  );
}