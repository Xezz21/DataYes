import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-20">

        {/* hero */}
        <div className="text-center mb-24">
          <div className="w-20 h-20 bg-black rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-gray-200">
            Z
          </div>
          <h1 className="text-5xl font-bold mb-2 text-gray-900 tracking-tight">
            Zorigt
          </h1>
          <p className="text-gray-400 text-lg mb-8 font-medium">Web Developer</p>
          
          <div className="flex gap-3 justify-center">
            <a href="#projects" className="px-5 py-2 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all">
              Work
            </a>
            <a href="#about" className="px-5 py-2 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all">
              About
            </a>
            <Link href="/DataJson" className="px-6 py-2 rounded-full text-sm font-medium bg-black text-white hover:bg-gray-800 transition-all shadow-md">
              Directory
            </Link>
          </div>
        </div>

        {/* about */}
        <section id="about" className="mb-20">
          <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-gray-300"></span> 01. About
          </h2>
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-600 text-lg leading-relaxed">
              I build modern web experiences with clean code and thoughtful design.
              Passionate about creating intuitive interfaces that users love.
            </p>
          </div>
        </section>

        {/* projects */}
        <section id="projects" className="mb-20">
          <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-8 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-gray-300"></span> 02. Projects
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project 1 */}
            <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 font-bold">P1</div>
                <span className="text-[10px] px-2 py-1 bg-green-100 text-green-600 rounded-full font-bold uppercase">Live</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-black transition-colors">Portfolio System</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">A cutting-edge web application built with modern technologies and focus on UX.</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">React</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Next.js</span>
              </div>
            </div>

            {/* Project 2 */}
            <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500 font-bold">P2</div>
                <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-400 rounded-full font-bold uppercase">Archived</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-black transition-colors">Community Hub</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">Urban-focused platform for connecting local communities and sharing resources.</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">TypeScript</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">MongoDB</span>
              </div>
            </div>
          </div>
        </section>

        {/* contact */}
        <section id="contact" className="text-center">
          <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-8">
            03. Get In Touch
          </h2>
          <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-600 mb-8 text-lg">
              I'm always open to new opportunities and interesting projects.
            </p>
            <div className="flex gap-3 justify-center flex-col sm:flex-row">
              <Link href="/contact" className="px-8 py-3 bg-black text-white rounded-xl transition-all font-semibold shadow-lg shadow-gray-200 hover:bg-gray-800">
                Contact Me
              </Link>
              <Link href="/about" className="px-8 py-3 border border-gray-200 bg-white text-gray-600 rounded-xl transition-all font-semibold hover:bg-gray-50">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-32 pt-8 border-t border-gray-200 text-center text-gray-400 text-xs font-medium">
          <p>© 2024 ZORIGT. BUILT WITH NEXT.JS & TAILWIND CSS</p>
        </footer>

      </div>
    </div>
  );
}