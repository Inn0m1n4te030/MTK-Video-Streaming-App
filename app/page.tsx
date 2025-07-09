"use client"

import { useState, useEffect, Fragment } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Play, Search, Star, TrendingUp, Tv, Clock, Info } from "lucide-react"

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8"
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

export default function Home() {
  /* ---------------------------- STATE ---------------------------- */
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [trendingMovies, setTrendingMovies] = useState<any[]>([])
  const [trendingTV, setTrendingTV] = useState<any[]>([])
  const [latestMovies, setLatestMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"trending" | "trending-tv" | "latest" | "search-movies" | "search-tv">(
    "trending",
  )
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [movieDetails, setMovieDetails] = useState<any | null>(null)

  /* ------------------------ INITIAL FETCH ------------------------ */
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true)
      try {
        const [trendMov, trendTv, latest] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`).then((r) => r.json()),
          fetch(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}`).then((r) => r.json()),
          fetch(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}`).then((r) => r.json()),
        ])
        setTrendingMovies(trendMov.results ?? [])
        setTrendingTV(trendTv.results ?? [])
        setLatestMovies(latest.results ?? [])
      } catch (err) {
        setError("Failed to load data.")
      } finally {
        setLoading(false)
      }
    }
    fetchInitial()
  }, [])

  /* ---------------------- SEARCH HANDLERS ----------------------- */
  const handleSearch = async (endpoint: "movie" | "tv") => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/search/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`,
      )
      const data = await res.json()
      setSearchResults(data.results ?? [])
      if (data.results?.length === 0) setError("No results.")
    } catch {
      setError("Search failed.")
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------- DETAILS HANDLERS ---------------------- */
  const openDetails = async (item: any, isTV = false) => {
    setDetailsLoading(true)
    setDialogOpen(true)
    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/${isTV ? "tv" : "movie"}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`,
      )
      const data = await res.json()
      setMovieDetails(data)
    } catch {
      setMovieDetails(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  /* ---------------------- RENDER HELPERS ------------------------ */
  const renderMovieCard = (item: any, isTV = false) => (
    <Card
      key={item.id}
      className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-400/40 hover:bg-white/10 transition"
    >
      <CardContent className="p-4">
        <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-slate-700">
          <img
            src={
              item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : "/placeholder.svg?height=400&width=300"
            }
            alt={item.title || item.name}
            className="object-cover w-full h-full"
          />
        </div>

        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">{item.title || item.name}</h3>

        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="bg-blue-600/20 text-blue-200">
            {(item.release_date || item.first_air_date || "----").slice(0, 4)}
          </Badge>
          <span className="flex items-center gap-1 text-yellow-300 text-xs">
            <Star className="w-3 h-3 fill-yellow-300" /> {item.vote_average?.toFixed(1) ?? "0"}
          </span>
        </div>

        <Button
          size="sm"
          className="w-full mb-2 bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => openDetails(item, isTV)}
        >
          <Info className="w-4 h-4 mr-1" /> Details
        </Button>

        <Button size="sm" disabled className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white">
          <Play className="w-4 h-4 mr-1" /> Watch
        </Button>
      </CardContent>
    </Card>
  )

  /* -------------------------- JSX ------------------------------- */
  return (
    <Fragment>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pb-20">
        <section className="text-center py-8 px-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MTK Video Streaming App
          </h1>
          <p className="text-blue-200 mt-1">Discover trending movies &amp; shows</p>
        </section>

        {/* Search */}
        <div className="max-w-lg mx-auto px-4 mb-8 flex gap-2">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch("movie")}
            className="bg-white/10 text-white placeholder:text-blue-300"
          />
          <Button onClick={() => handleSearch("movie")} className="bg-blue-600 hover:bg-blue-700">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 flex-wrap mb-8">
          {[
            { key: "trending", label: "Trending Movies", icon: <TrendingUp className="w-4 h-4" /> },
            { key: "trending-tv", label: "Trending TV", icon: <Tv className="w-4 h-4" /> },
            { key: "latest", label: "Latest Movies", icon: <Clock className="w-4 h-4" /> },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              className={
                activeTab === tab.key
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-white/20 text-blue-200 hover:bg-white/10"
              }
              onClick={() => {
                setActiveTab(tab.key as any)
                setSearchResults([])
                setError("")
              }}
            >
              {tab.icon}
              <span className="ml-1">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Error */}
        {error && <div className="text-center text-red-300 mb-6">{error}</div>}

        {/* Content */}
        <section className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-20 text-white">Loading...</div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {activeTab === "trending" && trendingMovies.map((m) => renderMovieCard(m, false))}
              {activeTab === "trending-tv" && trendingTV.map((m) => renderMovieCard(m, true))}
              {activeTab === "latest" && latestMovies.map((m) => renderMovieCard(m, false))}
              {activeTab === "search-movies" && searchResults.map((m) => renderMovieCard(m, false))}
              {activeTab === "search-tv" && searchResults.map((m) => renderMovieCard(m, true))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Moe Thu Kyaw. All rights reserved.
        </footer>
      </main>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Movie Details {detailsLoading && <span className="animate-pulse text-xs">(loading...)</span>}
            </DialogTitle>
            <DialogDescription>{movieDetails?.title || movieDetails?.name}</DialogDescription>
          </DialogHeader>

          {movieDetails && !detailsLoading && (
            <div className="grid gap-4">
              <div className="flex gap-4">
                <img
                  src={
                    movieDetails.poster_path
                      ? `${TMDB_IMAGE_BASE_URL}${movieDetails.poster_path}`
                      : "/placeholder.svg?height=400&width=300"
                  }
                  alt="poster"
                  className="w-40 h-60 object-cover rounded-md"
                />
                <div className="flex-1 text-sm space-y-2">
                  <p>
                    <span className="text-blue-300">Rating:</span> {movieDetails.vote_average?.toFixed(1)}/10
                  </p>
                  <p>
                    <span className="text-blue-300">Runtime:</span>{" "}
                    {movieDetails.runtime ? `${movieDetails.runtime} min` : "N/A"}
                  </p>
                  <p>
                    <span className="text-blue-300">Release:</span>{" "}
                    {movieDetails.release_date || movieDetails.first_air_date}
                  </p>
                  {movieDetails.genres && (
                    <p>
                      <span className="text-blue-300">Genres:</span>{" "}
                      {movieDetails.genres.map((g: any) => g.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              {movieDetails.overview && (
                <p className="text-sm leading-relaxed text-gray-200">{movieDetails.overview}</p>
              )}
            </div>
          )}

          <DialogClose asChild>
            <Button className="mt-6 w-full" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Fragment>
  )
}
