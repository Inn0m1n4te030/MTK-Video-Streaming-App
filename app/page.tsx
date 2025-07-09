"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Star, Info, X } from "lucide-react"

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
  const [showDetails, setShowDetails] = useState(false)
  const [movieDetails, setMovieDetails] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

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

  const getMovieDetails = async (item: any, isTV = false) => {
    setDetailsLoading(true)
    try {
      const url = `${TMDB_BASE_URL}/${isTV ? "tv" : "movie"}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`
      const res = await fetch(url)
      const details = await res.json()
      setMovieDetails(details)
      setShowDetails(true)
    } catch (error) {
      setError("Failed to load movie details.")
    } finally {
      setDetailsLoading(false)
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
      setShowDetails(false)
    } catch (err) {
      console.error("Error getting movie details:", err)
      // Fallback to TMDB ID
      const streamUrl = `https://vidsrc.icu/embed/movie/${movie.id}`
      setStreamingUrl(streamUrl)
      setSelectedMovie(movie)
      setIsWatching(true)
      setShowDetails(false)
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
      setShowDetails(false)
    } catch (err) {
      console.error("Error getting TV show details:", err)
      // Fallback to TMDB ID
      const streamUrl = `https://vidsrc.icu/embed/tv/${show.id}/1/1`
      setStreamingUrl(streamUrl)
      setSelectedMovie(show)
      setIsWatching(true)
      setShowDetails(false)
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

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
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
        
        {/* Details Button */}
        <Button
          size="sm"
          onClick={() => getMovieDetails(item, isTV)}
          className="w-full mb-2 bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          <Info className="w-4 h-4 mr-2" />
          Details
        </Button>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => (isTV ? playTVShow(item) : playMovie(item))}
            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium"
          >
            <Play className="w-4 h-4 mr-2" />
            Watch
          </Button>
          <Button
            size="sm"
            onClick={() => alert("Download feature coming soon!")}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium"
          >
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Movie Details Modal
  if (showDetails && movieDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => setShowDetails(false)}
              variant="outline"
              className="border-blue-300/30 text-blue-200 hover:bg-blue-600/20 hover:border-blue-400/50 bg-transparent"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <h1 className="text-2xl font-bold text-white">Movie Details</h1>
            <div className="w-20"></div>
          </div>

          {detailsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="mt-2 text-white">Loading details...</p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0">
                  <img
                    src={
                      movieDetails.poster_path
                        ? `${TMDB_IMAGE_BASE_URL}${movieDetails.poster_path}`
                        : "/placeholder.svg?height=400&width=300"
                    }
                    alt={movieDetails.title || movieDetails.name}
                    className="w-64 h-96 object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">{movieDetails.title || movieDetails.name}</h2>
                  {movieDetails.tagline && (
                    <p className="text-blue-200 italic mb-4">"{movieDetails.tagline}"</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-blue-200">Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-white font-semibold">{movieDetails
