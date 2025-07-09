"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Search, Star, TrendingUp, Clock, Tv, ArrowLeft } from "lucide-react"

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8"
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [trendingMovies, setTrendingMovies] = useState<any[]>([])
  const [trendingTV, setTrendingTV] = useState<any[]>([])
  const [latestMovies, setLatestMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("trending")
  const [error, setError] = useState("")
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<any>(null)
  const [isWatching, setIsWatching] = useState(false)

  // Load trending and latest content on component mount
  useEffect(() => {
    loadTrendingContent()
  }, [])

  const loadTrendingContent = async () => {
    setLoading(true)
    try {
      // Fetch trending movies
      const trendingMoviesRes = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`)
      const trendingMoviesData = await trendingMoviesRes.json()
      setTrendingMovies(trendingMoviesData.results?.slice(0, 20) || [])

      // Fetch trending TV shows
      const trendingTVRes = await fetch(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}`)
      const trendingTVData = await trendingTVRes.json()
      setTrendingTV(trendingTVData.results?.slice(0, 20) || [])

      // Fetch latest/popular movies
      const latestMoviesRes = await fetch(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}`)
      const latestMoviesData = await latestMoviesRes.json()
      setLatestMovies(latestMoviesData.results?.slice(0, 20) || [])

      console.log("Loaded trending content successfully")
    } catch (err) {
      console.error("Error loading trending content:", err)
      setError("Failed to load trending content")
    } finally {
      setLoading(false)
    }
  }

  const searchMovies = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search term")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Searching for movies:", searchQuery)
      const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`

      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.status_message || `HTTP error! status: ${res.status}`)
      }

      setSearchResults(Array.isArray(data.results) ? data.results : [])

      if (data.results?.length === 0) {
        setError("No movies found. Try a different search term.")
      }
    } catch (err) {
      console.error("Movie search failed:", err)
      setError(`Search failed: ${err.message}`)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const searchTVShows = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search term")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Searching for TV shows:", searchQuery)
      const url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`

      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.status_message || `HTTP error! status: ${res.status}`)
      }

      setSearchResults(Array.isArray(data.results) ? data.results : [])

      if (data.results?.length === 0) {
        setError("No TV shows found. Try a different search term.")
      }
    } catch (err) {
      console.error("TV search failed:", err)
      setError(`Search failed: ${err.message}`)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const playMovie = async (movie: any) => {
    try {
      // Get movie details to get IMDB ID
      const detailsRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}`)
      const details = await detailsRes.json()

      // Use IMDB ID if available, otherwise use TMDB ID
      const movieId = details.imdb_id || movie.id
      const streamUrl = `https://vidsrc.icu/embed/movie/${movieId}`

      console.log("Opening movie stream:", streamUrl)
      setStreamingUrl(streamUrl)
      setSelectedMovie(movie)
      setIsWatching(true)
    } catch (err) {
      console.error("Error getting movie details:", err)
      // Fallback to TMDB ID
      const streamUrl = `https://vidsrc.icu/embed/movie/${movie.id}`
      setStreamingUrl(streamUrl)
      setSelectedMovie(movie)
      setIsWatching(true)
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

      console.log("Opening TV show stream:", streamUrl)
      setStreamingUrl(streamUrl)
      setSelectedMovie(show)
      setIsWatching(true)
    } catch (err) {
      console.error("Error getting TV show details:", err)
      // Fallback to TMDB ID
      const streamUrl = `https://vidsrc.icu/embed/tv/${show.id}/1/1`
      setStreamingUrl(streamUrl)
      setSelectedMovie(show)
      setIsWatching(true)
    }
  }

  const stopWatching = () => {
    setStreamingUrl(null)
    setSelectedMovie(null)
    setIsWatching(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (activeTab === "search-movies") {
        searchMovies()
      } else if (activeTab === "search-tv") {
        searchTVShows()
      }
    }
  }

  const renderMovieCard = (item: any, isTV = false) => (
    <Card
      key={item.id}
      className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-400/30 transition-all duration-300 cursor-pointer backdrop-blur-sm"
    >
      <CardContent className="p-4">
        <div className="aspect-[2/3] mb-4 overflow-hidden rounded-lg bg-slate-700">
          <img
            src={
              item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : "/placeholder.svg?height=400&width=300"
            }
            alt={item.title || item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=400&width=300"
            }}
          />
        </div>
        <h3 className="font-semibold mb-2 line-clamp-2 text-white">{item.title || item.name}</h3>
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="bg-blue-600/20 text-blue-200 border border-blue-400/30">
            {isTV
              ? item.first_air_date
                ? new Date(item.first_air_date).getFullYear()
                : "N/A"
              : item.release_date
                ? new Date(item.release_date).getFullYear()
                : "N/A"}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-white">{item.vote_average?.toFixed(1) || "N/A"}</span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => (isTV ? playTVShow(item) : playMovie(item))}
          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium"
        >
          <Play className="w-4 h-4 mr-2" />
          {isTV ? "Watch Show" : "Watch Movie"}
        </Button>
      </CardContent>
    </Card>
  )

  // If watching, show the video player
  if (isWatching && streamingUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header with back button */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={stopWatching}
              variant="outline"
              className="border-blue-300/30 text-blue-200 hover:bg-blue-600/20 hover:border-blue-400/50 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">{selectedMovie?.title || selectedMovie?.name}</h1>
              <p className="text-blue-200">Now Playing</p>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>

          {/* Ad blocker warning */}
          <div className="mb-4 text-center">
            <div className="bg-amber-600/20 border border-amber-400/50 text-amber-200 px-4 py-2 rounded-lg inline-block backdrop-blur-sm">
              ⚠️ If video doesn't load, please disable ad blocker and allow popups
            </div>
          </div>

          {/* Video Player */}
          <div className="w-full bg-black rounded-lg overflow-hidden" style={{ height: "70vh" }}>
            <iframe
              src={streamingUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title="Video Player"
            />
          </div>

          {/* Troubleshooting section */}
          <div className="mt-6 text-center">
            <div className="bg-slate-800/50 text-white p-4 rounded-lg backdrop-blur-sm max-w-2xl mx-auto">
              <p className="text-sm mb-2">
                <strong>Video not loading?</strong>
              </p>
              <p className="text-xs text-slate-300 mb-3">This streaming service requires ads to be enabled. Please:</p>
              <ul className="text-xs text-slate-300 text-left mb-4 space-y-1">
                <li>• Disable ad blocker for this site</li>
                <li>• Allow popups in your browser</li>
                <li>• Refresh the page if needed</li>
                <li>• Try a different browser if issues persist</li>
              </ul>
              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.open(streamingUrl, "_blank")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Open in New Tab
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main browse interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MovieStream Discovery
          </h1>
          <p className="text-blue-200">Discover trending movies, TV shows, and latest releases</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => {
                setActiveTab("trending")
                setSearchResults([])
                setError("")
              }}
              variant={activeTab === "trending" ? "default" : "outline"}
              className={`${
                activeTab === "trending"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-blue-300/30 text-blue-200 hover:bg-blue-600/20 hover:border-blue-400/50"
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending Movies
            </Button>
            <Button
              onClick={() => {
                setActiveTab("trending-tv")
                setSearchResults([])
                setError("")
              }}
              variant={activeTab === "trending-tv" ? "default" : "outline"}
              className={`${
                activeTab === "trending-tv"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-blue-300/30 text-blue-200 hover:bg-blue-600/20 hover:border-blue-400/50"
              }`}
            >
              <Tv className="w-4 h-4 mr-2" />
              Trending TV
            </Button>
            <Button
              onClick={() => {
                setActiveTab("latest")
                setSearchResults([])
                setError("")
              }}
              variant={activeTab === "latest" ? "default" : "outline"}
              className={`${
                activeTab === "latest"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-blue-300/30 text-blue-200 hover:bg-blue-600/20 hover:border-blue-400/50"
              }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              Latest Movies
            </Button>
            <Button
              onClick={() => {
                setActiveTab("search-movies")
                setSearchResults([])
                setError("")
              }}
              variant={activeTab === "search-movies" ? "default" : "outline"}
              className={`${
                activeTab === "search-movies"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-blue-300/30 text-blue-200 hover:bg-blue-600/20 hover:border-blue-400/50"
              }`}
            >
              Search Movies
            </Button>
            <Button
              onClick={() => {
                setActiveTab("search-tv")
                setSearchResults([])
                setError("")
              }}
              variant={activeTab === "search-tv" ? "default" : "outline"}
              className={`${
                activeTab === "search-tv"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-blue-300/30 text-blue-200 hover:bg-blue-600/20 hover:border-blue-400/50"
              }`}
            >
              Search TV
            </Button>
          </div>
        </div>

        {/* Search Bar - Only show for search tabs */}
        {(activeTab === "search-movies" || activeTab === "search-tv") && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={`Search for ${activeTab === "search-movies" ? "movies" : "TV shows"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-white/10 border-blue-300/30 text-white placeholder:text-blue-300 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
              />
              <Button
                onClick={activeTab === "search-movies" ? searchMovies : searchTVShows}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-500/10 border border-red-400/30 text-red-200 px-4 py-3 rounded-lg backdrop-blur-sm">
              {error}
            </div>
          </div>
        )}

        {/* Content Sections */}
        {activeTab === "trending" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              <TrendingUp className="w-6 h-6 mr-2" />
              Trending Movies This Week
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="mt-2 text-white">Loading trending movies...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trendingMovies.map((movie) => renderMovieCard(movie, false))}
              </div>
            )}
          </div>
        )}

        {activeTab === "trending-tv" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              <Tv className="w-6 h-6 mr-2" />
              Trending TV Shows This Week
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="mt-2 text-white">Loading trending TV shows...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trendingTV.map((show) => renderMovieCard(show, true))}
              </div>
            )}
          </div>
        )}

        {activeTab === "latest" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              <Clock className="w-6 h-6 mr-2" />
              Latest Movies in Theaters
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="mt-2 text-white">Loading latest movies...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {latestMovies.map((movie) => renderMovieCard(movie, false))}
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {(activeTab === "search-movies" || activeTab === "search-tv") && searchResults?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {searchResults.map((item) => renderMovieCard(item, activeTab === "search-tv"))}
          </div>
        )}

        {/* Search Welcome State */}
        {(activeTab === "search-movies" || activeTab === "search-tv") &&
          !loading &&
          searchResults?.length === 0 &&
          !searchQuery &&
          !error && (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4 text-white">
                Search for {activeTab === "search-movies" ? "Movies" : "TV Shows"}
              </h2>
              <p className="mb-8 text-slate-300">
                Enter a search term above to find {activeTab === "search-movies" ? "movies" : "TV shows"} to stream.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Oppenheimer", "Barbie", "Inception", "The Matrix", "Interstellar"].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery(suggestion)
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
