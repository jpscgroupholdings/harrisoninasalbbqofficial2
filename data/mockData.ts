import { SalesData, TopProduct } from "@/types/adminType";

export const mockSalesData: SalesData[] = [
  { date: "Mon", sales: 4200 },
  { date: "Tue", sales: 3800 },
  { date: "Wed", sales: 5100 },
  { date: "Thu", sales: 4600 },
  { date: "Fri", sales: 6200 },
  { date: "Sat", sales: 8400 },
  { date: "Sun", sales: 7800 },
];

export const mockTopProducts: TopProduct[] = [
  { name: "Chicken Inasal", sales: 247 },
  { name: "Pork BBQ", sales: 189 },
  { name: "Beef Tapa", sales: 134 },
  { name: "Halo-Halo", sales: 98 },
];

const locations = [
  {
    id: 1,
    name: "King's Court",
    address: "King’s Court Building",
    mapLink: "https://maps.app.goo.gl/iKy7TX6hLx6XnooH9",
    coordinates: { lat: 14.554891044450834, lng: 121.02440521419611 },
    embedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.7267539!2d121.0134854!3d14.5576121!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c90c5888257f:0xf5a4b1009273b664!2sKings%20Court%20Building%201!5e0!3m2!1sen!2sph!4v1234567890!5m2!1sen!2sph",
  },
  {
    id: 2,
    name: "Century City Mall",
    address: "Century City Mall, Kalayaan Ave, Poblacion",
    mapLink: "https://maps.app.goo.gl/izGJTfTXctnDjc6q9",
    coordinates: { lat: 14.565799256226898, lng: 121.02779184232841 },
    embedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.587323602867!2d121.0278133!3d14.565576!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c9006ced35e7%3A0xf8984118b68af276!2sHarrison%20House%20of%20Inasal%20%26%20bbq!5e0!3m2!1sen!2sph!4v1769667586148!5m2!1sen!2sph",
  },
];
