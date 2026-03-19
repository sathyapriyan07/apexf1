import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl font-bold tracking-tighter text-red-600 italic">F1</span>
            <span className="text-xl font-semibold tracking-tight text-white uppercase">Archive</span>
          </div>
          <p className="text-gray-400 max-w-sm">
            The ultimate cinematic archive for Formula One history. Explore seasons, drivers, and legendary races from 1950 to the present.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Explore</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><a href="/seasons" className="hover:text-white transition-colors">Seasons</a></li>
            <li><a href="/drivers" className="hover:text-white transition-colors">Drivers</a></li>
            <li><a href="/constructors" className="hover:text-white transition-colors">Constructors</a></li>
            <li><a href="/records" className="hover:text-white transition-colors">Records</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Legal</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-gray-500 text-xs">
        <p>© 2026 F1 Archive. All rights reserved. Not affiliated with Formula One Management.</p>
        <p className="mt-4 md:mt-0 italic">Lights out and away we go!</p>
      </div>
    </footer>
  );
}
