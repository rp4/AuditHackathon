"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Search, Upload, Menu, Sparkles, X, ChevronRight } from "lucide-react"
import { useState } from "react"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all overflow-hidden">
              <Image
                src="/logo.png"
                alt="Audit Agents Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-xl">Audit Agents</div>
              <div className="text-xs text-gray-500">AI Agent Library</div>
            </div>
          </Link>


          {/* Search Bar */}
          <div className="hidden md:flex items-center max-w-md flex-1 mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="search"
                placeholder="Search agents, categories, or platforms..."
                className="w-full pl-12 pr-4 py-3 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link href="/upload" className="hidden md:block">
              <Button variant="outline" className="font-semibold border-2 hover:bg-gray-50">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </Link>

            <Link href="/signin">
              <Button className="font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 border-t bg-white absolute top-20 left-0 right-0 shadow-2xl">
            <div className="container mx-auto px-4">
              <div className="flex flex-col space-y-4">
                <Link href="/upload" className="flex items-center justify-between py-3 px-4 text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
                  Upload Agent
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <div className="pt-4">
                  <input
                    type="search"
                    placeholder="Search agents..."
                    className="w-full px-4 py-3 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}