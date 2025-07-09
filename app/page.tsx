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
import { Play, Search, Star, TrendingUp, Tv, Clock, Info, X, Download } from "lucide-react"

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
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<any>(null)
  const [isWatching, setIsWatching] = useState(false)

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

  /* ---------------------- STREAMING HANDLERS -------------------- */
  const playMovie = async (movie: any) => {
    try {
      // Get movie details to get IMDB ID
      const detailsRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}`)
      const details = await detailsRes.json()

      // Use IMDB ID if available, otherwise use TMDB ID
      const movieId = details.imdb_id || movie.id
      const streamUrl = `https://vidsrc.icu/embed/movie/${movieId}`

      setStreamingUrl(streamUrl)
      setSelectedMovie(movie)
      setIsWatching(true)
      setDialogOpen(false)
    } catch (err) {
      // Fallback to TMDB ID
      const streamUrl = `https://vidsrc.icu/embed/movie/${movie.id}`
      setStreamingUrl(streamUrl)
      setSelectedMovie(movie)
      setIsWatching(true)
      setDialogOpen(false)
    }
  }

  const playTVShow = async (show: any) => {
    try {
      // Get TV show details to get IMDB ID
      const detailsRes = await fetch(`${TMDB_BASE_URL}/tv/${show.id}?api_key=${TMDB_API_KEY}`)
      const details = await detailsRes.json()

      // Use IMDB ID if available, otherwise use TMDB ID
      const showId = details.external_ids?.imdb_id || show.id
      // Default to season 1, episode 1
      const streamUrl = `https://vidsrc.icu/embed/tv/${showId}/1/1`

      setStreamingUrl(streamUrl)
      setSelectedMovie(show)
      setIsWatching(true)
      setDialogOpen(false)
    } catch (err) {
      // Fallback to TMDB ID
      const streamUrl = `https://vidsrc.icu/embed/tv/${show.id}/1/1`
      setStreamingUrl(streamUrl)
      setSelectedMovie(show)
      setIsWatching(true)
      setDialogOpen(false)
    }
  }

  const stopWatching = () => {
    setStreamingUrl(null)
    setSelectedMovie(null)
    setIsWatching(false)
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

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
            onClick={() => (isTV ? playTVShow(item) : playMovie(item))}
          >
            <Play className="w-4 h-4 mr-1" /> Watch
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            onClick={() => alert("Download feature coming soon!")}
          >
            <Download className="w-4 h-4 mr-1" /> Download
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  /* -------------------------- VIDEO PLAYER ---------------------- */
  if (isWatching && streamingUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
          <Button
            onClick={stopWatching}
            variant="outline"
            className="border-blue-300/30 text-blue-200 hover:bg-blue-600/20 bg-transparent"
          >
            <X className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-white font-bold text-lg">{selectedMovie?.title || selectedMovie?.name}</h1>
            <p className="text-blue-200 text-sm">Now Playing</p>
          </div>
          <div className="w-20"></div>
        </div>

        {/* Warning */}
        <div className="mx-4 mb-4 p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-200 text-sm text-center">
            ⚠️ If video doesn't load, please disable ad blocker and allow popups
          </p>
        </div>

        {/* Video Player */}
        <div className="mx-4 mb-4 aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={streamingUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title="Video Player"
          />
        </div>

        {/* Troubleshooting */}
        <div className="mx-4 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <h3 className="text-white font-semibold mb-2">Video not loading?</h3>
          <ul className="text-blue-200 text-sm space-y-1 mb-3">
            <li>• Disable ad blocker for this site</li>
            <li>• Allow popups in your browser</li>
            <li>• Check your internet connection</li>
            <li>• Try refreshing the page</li>
          </ul>
          <Button onClick={() => window.open(streamingUrl, "_blank")} className="w-full bg-blue-600 hover:bg-blue-700">
            Open in New Tab
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-400 pb-4">
          © {new Date().getFullYear()} Moe Thu Kyaw. All rights reserved.
        </footer>
      </div>
    )
  }

  /* -------------------------- MAIN JSX -------------------------- */
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
        <DialogContent className="max-w-2xl bg-white text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black">
              Movie Details {detailsLoading && <span className="animate-pulse text-xs">(loading...)</span>}
            </DialogTitle>
            <DialogDescription className="text-gray-700">{movieDetails?.title || movieDetails?.name}</DialogDescription>
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
                  <p className="text-black">
                    <span className="text-blue-600 font-semibold">Rating:</span> {movieDetails.vote_average?.toFixed(1)}
                    /10
                  </p>
                  <p className="text-black">
                    <span className="text-blue-600 font-semibold">Runtime:</span>{" "}
                    {movieDetails.runtime ? `${movieDetails.runtime} min` : "N/A"}
                  </p>
                  <p className="text-black">
                    <span className="text-blue-600 font-semibold">Release:</span>{" "}
                    {movieDetails.release_date || movieDetails.first_air_date}
                  </p>
                  {movieDetails.genres && (
                    <p className="text-black">
                      <span className="text-blue-600 font-semibold">Genres:</span>{" "}
                      {movieDetails.genres.map((g: any) => g.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              {movieDetails.overview && (
                <p className="text-sm leading-relaxed text-gray-800">{movieDetails.overview}</p>
              )}

              {/* Action Buttons in Details */}
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                  onClick={() => (movieDetails.name ? playTVShow(movieDetails) : playMovie(movieDetails))}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Now
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  onClick={() => alert("Download feature coming soon!")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
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
