import Link from "next/link";

export const HeaderNavLinks = () => (
  <div className="gap-6 hidden lg:flex">
    <Link href="/catering" className="hover:text-brand-color-500">
      Catering
    </Link>
    <Link href="/contact" className="hover:text-brand-color-500">
      Contact Us
    </Link>
  </div>
);