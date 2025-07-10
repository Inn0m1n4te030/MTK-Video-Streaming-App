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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  // TV Show specific states
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1)
  const [seasonDetails, setSeasonDetails] = useState<any>(null)
  const [loadingSeasons, setLoadingSeasons] = useState(false)

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
    if (!searchQuery.trim()) {
      setError("Please enter a search term")
      return
    }

    setLoading(true)
    setError("")
    setSearchResults([])

    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/search/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&page=1`,
      )

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log("Search results:", data) // Debug log

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results)
        // Switch to appropriate search tab
        setActiveTab(endpoint === "movie" ? "search-movies" : "search-tv")
      } else {
        setError(`No ${endpoint === "movie" ? "movies" : "TV shows"} found for "${searchQuery}"`)
      }
    } catch (err) {
      console.error("Search error:", err)
      setError("Search failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------- DETAILS HANDLERS ---------------------- */
  const openDetails = async (item: any, isTV = false) => {
    setDetailsLoading(true)
    setDialogOpen(true)
    setSeasonDetails(null)
    setSelectedSeason(1)
    setSelectedEpisode(1)

    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/${isTV ? "tv" : "movie"}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`,
      )
      const data = await res.json()
      setMovieDetails(data)

      // If it's a TV show, load season 1 details by default
      if (isTV && data.seasons && data.seasons.length > 0) {
        loadSeasonDetails(item.id, 1)
      }
    } catch {
      setMovieDetails(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  /* ---------------------- TV SEASON/EPISODE HANDLERS ------------ */
  const loadSeasonDetails = async (tvId: number, seasonNumber: number) => {
    setLoadingSeasons(true)
    try {
      const res = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`)
      const data = await res.json()
      setSeasonDetails(data)
      setSelectedEpisode(1) // Reset to first episode when changing seasons
    } catch (err) {
      console.error("Error loading season details:", err)
    } finally {
      setLoadingSeasons(false)
    }
  }

  const handleSeasonChange = (seasonNumber: string) => {
    const season = Number.parseInt(seasonNumber)
    setSelectedSeason(season)
    if (movieDetails) {
      loadSeasonDetails(movieDetails.id, season)
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

  const playTVShow = async (show: any, season = 1, episode = 1) => {
    try {
      // Get TV show details to get IMDB ID
      const detailsRes = await fetch(
        `${TMDB_BASE_URL}/tv/${show.id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`,
      )
      const details = await detailsRes.json()

      // Use IMDB ID if available, otherwise use TMDB ID
      const showId = details.external_ids?.imdb_id || show.id
      const streamUrl = `https://vidsrc.icu/embed/tv/${showId}/${season}/${episode}`

      setStreamingUrl(streamUrl)
      setSelectedMovie({ ...show, currentSeason: season, currentEpisode: episode })
      setIsWatching(true)
      setDialogOpen(false)
    } catch (err) {
      // Fallback to TMDB ID
      const streamUrl = `https://vidsrc.icu/embed/tv/${show.id}/${season}/${episode}`
      setStreamingUrl(streamUrl)
      setSelectedMovie({ ...show, currentSeason: season, currentEpisode: episode })
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
            onClick={() => (isTV ? playTVShow(item, 1, 1) : playMovie(item))}
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
            <p className="text-blue-200 text-sm">
              {selectedMovie?.currentSeason && selectedMovie?.currentEpisode
                ? `Season ${selectedMovie.currentSeason}, Episode ${selectedMovie.currentEpisode}`
                : "Now Playing"}
            </p>
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
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Search for movies or TV shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch("movie")
                }
              }}
              className="bg-white/10 text-white placeholder:text-blue-300 border-white/20"
            />
            <Button onClick={() => handleSearch("movie")} className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 justify-center">
            <Button size="sm" onClick={() => handleSearch("movie")} className="bg-red-600 hover:bg-red-700 text-white">
              Search Movies
            </Button>
            <Button size="sm" onClick={() => handleSearch("tv")} className="bg-green-600 hover:bg-green-700 text-white">
              Search TV Shows
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 flex-wrap mb-8">
          {[
            { key: "trending", label: "Trending Movies", icon: <TrendingUp className="w-4 h-4" /> },
            { key: "trending-tv", label: "Trending TV", icon: <Tv className="w-4 h-4" /> },
            { key: "latest", label: "Latest Movies", icon: <Clock className="w-4 h-4" /> },
            { key: "search-movies", label: "Movie Results", icon: <Search className="w-4 h-4" /> },
            { key: "search-tv", label: "TV Results", icon: <Search className="w-4 h-4" /> },
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
                if (!tab.key.startsWith("search")) {
                  setSearchResults([])
                  setError("")
                }
              }}
            >
              {tab.icon}
              <span className="ml-1">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Error */}
        {error && <div className="text-center text-red-300 mb-6 px-4">{error}</div>}

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
        <DialogContent className="max-w-4xl bg-white text-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black">
              {movieDetails?.title || movieDetails?.name} Details
              {detailsLoading && <span className="animate-pulse text-xs">(loading...)</span>}
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              {movieDetails?.tagline || "Movie/TV Show Information"}
            </DialogDescription>
          </DialogHeader>

          {movieDetails && !detailsLoading && (
            <div className="grid gap-6">
              {/* Basic Info */}
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
                    {movieDetails.runtime
                      ? `${movieDetails.runtime} min`
                      : movieDetails.episode_run_time?.[0]
                        ? `${movieDetails.episode_run_time[0]} min/episode`
                        : "N/A"}
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
                  {movieDetails.number_of_seasons && (
                    <p className="text-black">
                      <span className="text-blue-600 font-semibold">Seasons:</span> {movieDetails.number_of_seasons}
                    </p>
                  )}
                  {movieDetails.number_of_episodes && (
                    <p className="text-black">
                      <span className="text-blue-600 font-semibold">Episodes:</span> {movieDetails.number_of_episodes}
                    </p>
                  )}
                </div>
              </div>

              {/* Overview */}
              {movieDetails.overview && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">Overview</h3>
                  <p className="text-sm leading-relaxed text-gray-800">{movieDetails.overview}</p>
                </div>
              )}

              {/* TV Show Season/Episode Selection */}
              {movieDetails.seasons && movieDetails.seasons.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black">Episodes</h3>

                  {/* Season Selector */}
                  <div className="flex items-center gap-4">
                    <label className="text-black font-medium">Season:</label>
                    <Select value={selectedSeason.toString()} onValueChange={handleSeasonChange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {movieDetails.seasons
                          .filter((season: any) => season.season_number > 0)
                          .map((season: any) => (
                            <SelectItem key={season.season_number} value={season.season_number.toString()}>
                              Season {season.season_number}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Episodes List */}
                  {loadingSeasons ? (
                    <div className="text-center py-4 text-gray-600">Loading episodes...</div>
                  ) : seasonDetails?.episodes ? (
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {seasonDetails.episodes.map((episode: any) => (
                        <div
                          key={episode.episode_number}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-black">
                              {episode.episode_number}. {episode.name}
                            </h4>
                            {episode.overview && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{episode.overview}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {episode.air_date} • {episode.runtime ? `${episode.runtime} min` : "Runtime N/A"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="ml-4 bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => playTVShow(movieDetails, selectedSeason, episode.episode_number)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Watch
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-600">No episodes found for this season.</div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                {movieDetails.seasons ? (
                  <Button
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                    onClick={() => playTVShow(movieDetails, selectedSeason, selectedEpisode)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch S{selectedSeason}E{selectedEpisode}
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                    onClick={() => playMovie(movieDetails)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Movie
                  </Button>
                )}
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
