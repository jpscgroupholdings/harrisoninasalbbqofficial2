import { Facebook, Instagram, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#5C3A21]/20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-[#111111] mb-4">HARRISON</h3>
            <p className="text-gray-500 max-w-sm mb-6">
              Bringing the authentic taste of the Philippines to your table. 
              Quality ingredients, traditional recipes, and family warmth.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-gray-100 rounded-md hover:bg-[#5C3A21] hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="p-2 bg-gray-100 rounded-md hover:bg-[#5C3A21] hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-[#111111] mb-4">Contact</h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> (02) 8123-4567</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> 123 Main St, City Center</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#111111] mb-4">Hours</h4>
            <ul className="space-y-2 text-gray-600">
              <li>Mon - Fri: 10AM - 9PM</li>
              <li>Sat - Sun: 10AM - 10PM</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Harrison House of Inasal & BBQ. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#111111]">Privacy Policy</a>
            <a href="#" className="hover:text-[#111111]">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}