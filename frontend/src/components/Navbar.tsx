"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCollections } from "@/redux/slices/collectionSlice";
import { logout } from "@/redux/slices/authSlice";
import { fetchCart, clearGuest } from "@/redux/slices/cartSlice";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, User, LogOut, ChevronDown, Package } from "lucide-react";
import { RootState } from "@/redux/store";

export default function Navbar() {
  const dispatch   = useAppDispatch();
  const router     = useRouter();
  const pathname   = usePathname();
  const { collections } = useAppSelector((s: RootState) => s.collections);
  const { userInfo }    = useAppSelector((s: RootState) => s.auth);
  const { totalItems, open } = useCart();

  const [scrolled, setScrolled]         = useState(false);
  const [mobileMenuOpen, setMenu]       = useState(false);
  const [userDropOpen, setUserDrop]     = useState(false);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchCollections());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [dispatch]);

  // Fetch server cart when user is logged in
  useEffect(() => {
    if (userInfo?.token) dispatch(fetchCart());
  }, [userInfo]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearGuest());
    setUserDrop(false);
    router.push("/");
  };

  const navLinks = [
    { name: "Best Sellers", href: "/#products" },
    { name: "Custom Order", href: "/#custom"   },
    { name: "Bulk Orders",  href: "/#bulk"     },
    { name: "Contact",      href: "/contact"   },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-[100] transition-all duration-300 ${
          scrolled
            ? "bg-[#fdfdfb]/95 backdrop-blur-md border-b border-[#e8e4db] shadow-sm"
            : "bg-[#fdfdfb]/90 backdrop-blur-md border-b border-[#e8e4db]/50"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 flex items-center justify-between h-[72px] gap-4">

          {/* Brand */}
          <Link href="/" className="flex flex-col items-start shrink-0">
            <span className="font-serif text-[1.5rem] text-[#3d332a] tracking-wide leading-none">
              Mythris Gleams
            </span>
            <span className="text-[9px] tracking-[0.22em] text-[#a69076] uppercase mt-0.5 font-medium">
              Handcrafted with Soul
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Collections dropdown */}
            <div className="relative group px-4 py-2 cursor-default">
              <span className="text-[12px] tracking-wider uppercase text-[#594a3c] group-hover:text-[#a69076] transition-colors flex items-center gap-1.5">
                Collections <ChevronDown size={12} strokeWidth={2} className="group-hover:rotate-180 transition-transform duration-300" />
              </span>
              <div className="absolute top-full left-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-[200] bg-white border border-[#e8e4db] rounded-2xl py-3 min-w-[220px] shadow-xl shadow-[#3d332a]/5">
                <Link href="/category/all" className="block px-5 py-2.5 text-[12px] text-[#8c8273] hover:text-[#594a3c] hover:bg-[#f8f6f3] transition-all rounded-xl mx-2">
                  All Collections
                </Link>
                <div className="h-[1px] bg-[#e8e4db] mx-4 my-1" />
                {collections.map((cat: any) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="block px-5 py-2.5 text-[12px] text-[#8c8273] hover:text-[#594a3c] hover:bg-[#f8f6f3] transition-all rounded-xl mx-2"
                    onClick={() => setMenu(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-4 py-2 text-[12px] tracking-wider uppercase text-[#594a3c] hover:text-[#a69076] transition-colors whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">

            {/* Cart */}
            <button
              onClick={open}
              className="relative p-2.5 rounded-xl text-[#594a3c] hover:bg-[#f8f6f3] transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#594a3c] text-white text-[9px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-medium px-1">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User */}
            {!mounted ? (
              <div className="w-[84px] h-[36px] bg-[#f8f6f3] rounded-xl animate-pulse"></div>
            ) : userInfo ? (
              <div className="relative">
                <button
                  onClick={() => setUserDrop(!userDropOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#594a3c] hover:bg-[#f8f6f3] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#a69076] flex items-center justify-center text-white text-[11px] font-medium uppercase">
                    {userInfo.name?.[0] || "U"}
                  </div>
                  <span className="hidden sm:block text-[12px] font-medium text-[#594a3c] max-w-[100px] truncate">
                    {userInfo.name?.split(" ")[0]}
                  </span>
                  <ChevronDown size={12} strokeWidth={2} className={`${userDropOpen ? "rotate-180" : ""} transition-transform`} />
                </button>

                {userDropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[200px] bg-white border border-[#e8e4db] rounded-2xl shadow-xl shadow-[#3d332a]/5 py-2 z-[200]">
                    <div className="px-4 py-2 border-b border-[#e8e4db] mb-1">
                      <p className="text-[11px] text-[#a1988c] uppercase tracking-wide">Signed in as</p>
                      <p className="text-[13px] font-medium text-[#3d332a] truncate">{userInfo.email}</p>
                    </div>
                    <Link
                      href="/account"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#594a3c] hover:bg-[#f8f6f3] transition-colors"
                      onClick={() => setUserDrop(false)}
                    >
                      <User size={14} strokeWidth={1.5} /> Account Dashboard
                    </Link>
                    <Link
                      href="/account/orders"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#594a3c] hover:bg-[#f8f6f3] transition-colors"
                      onClick={() => setUserDrop(false)}
                    >
                      <Package size={14} strokeWidth={1.5} /> My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#594a3c] hover:bg-[#f8f6f3] transition-colors"
                    >
                      <LogOut size={14} strokeWidth={1.5} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/account"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3d332a] text-white text-[12px] font-medium tracking-wide hover:bg-[#594a3c] transition-all"
              >
                <User size={14} strokeWidth={1.5} />
                <span className="hidden sm:block">Sign In</span>
              </Link>
            )}

            {/* WhatsApp — desktop */}
            <a
              href="https://wa.me/918300034451"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-2 bg-[#25D366] text-white rounded-xl py-2 px-4 text-[12px] tracking-wide hover:shadow-[0_4px_16px_rgba(37,211,102,0.3)] transition-all"
            >
              💬 <span>WhatsApp</span>
            </a>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2.5 flex flex-col gap-1.5"
              onClick={() => setMenu(true)}
              aria-label="Open menu"
            >
              <span className="w-5 h-0.5 bg-[#594a3c] rounded-sm block" />
              <span className="w-5 h-0.5 bg-[#594a3c] rounded-sm block" />
              <span className="w-3 h-0.5 bg-[#594a3c] rounded-sm block" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-[#fdfdfb] z-[500] overflow-y-auto p-8 transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.18,1)] ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-10">
          <span className="font-serif text-[1.4rem] text-[#3d332a]">Mythris Gleams</span>
          <button className="w-10 h-10 rounded-full bg-[#f8f6f3] border border-[#e8e4db] flex items-center justify-center text-[#8c8273]" onClick={() => setMenu(false)}>
            ✕
          </button>
        </div>

        <div className="mb-8">
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#a69076] mb-4 font-medium">Collections</h4>
          <Link href="/category/all" className="block py-3 text-[1.05rem] font-serif text-[#3d332a] border-b border-[#e8e4db]" onClick={() => setMenu(false)}>All Collections</Link>
          {collections.map((cat: any) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className="block py-3 text-[1.05rem] font-serif text-[#3d332a] border-b border-[#e8e4db]" onClick={() => setMenu(false)}>
              {cat.name}
            </Link>
          ))}
        </div>

        <div className="mb-8">
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#a69076] mb-4 font-medium">Quick Links</h4>
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="block py-3 text-[1.05rem] font-serif text-[#3d332a] border-b border-[#e8e4db]" onClick={() => setMenu(false)}>
              {link.name}
            </Link>
          ))}
        </div>

        <div className="pt-4 flex flex-col gap-3">
          {!mounted ? (
            <div className="w-full h-[48px] bg-[#f8f6f3] rounded-2xl animate-pulse"></div>
          ) : userInfo ? (
            <>
              <Link href="/account/orders" onClick={() => setMenu(false)} className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-[#e8e4db] rounded-2xl text-[#3d332a] text-[13px] font-medium shadow-sm">
                <Package size={16} strokeWidth={1.5} /> My Orders
              </Link>
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-4 bg-[#f8f6f3] border border-[#e8e4db] rounded-2xl text-[#594a3c] text-[13px] font-medium">
                <LogOut size={16} strokeWidth={1.5} /> Sign Out ({userInfo.name?.split(" ")[0]})
              </button>
            </>
          ) : (
            <Link href="/account" onClick={() => setMenu(false)} className="flex items-center justify-center gap-2 w-full py-4 bg-[#3d332a] text-white rounded-2xl text-[13px] font-medium">
              <User size={16} strokeWidth={1.5} /> Sign In / Register
            </Link>
          )}
          <a href="https://wa.me/918300034451" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-[#25D366] text-white rounded-2xl text-[13px] font-medium">
            💬 Chat on WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
