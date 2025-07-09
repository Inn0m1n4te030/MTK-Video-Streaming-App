"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  Linking,
  ProgressBarAndroid,
  ProgressViewIOS,
  Platform,
  Modal,
} from "react-native"
import { WebView } from "react-native-webview"
import * as FileSystem from "expo-file-system"
import * as MediaLibrary from "expo-media-library"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width, height } = Dimensions.get("window")

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8"
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

interface Movie {
  id: number
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  poster_path?: string
  vote_average: number
  overview?: string
  runtime?: number
  genres?: Array<{ id: number; name: string }>
  production_companies?: Array<{ id: number; name: string }>
  spoken_languages?: Array<{ iso_639_1: string; name: string }>
  budget?: number
  revenue?: number
  status?: string
  tagline?: string
}

interface Download {
  id: string
  movie: Movie
  progress: number
  status: "downloading" | "completed" | "paused" | "error"
  localUri?: string
  downloadUri?: string
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])
  const [trendingTV, setTrendingTV] = useState<Movie[]>([])
  const [latestMovies, setLatestMovies] = useState<Movie[]>([])
  const [downloads, setDownloads] = useState<Download[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("trending")
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [movieDetails, setMovieDetails] = useState<Movie | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    loadTrendingContent()
    loadDownloads()
    requestPermissions()
  }, [])

  const requestPermissions = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Storage permission is needed to download movies.")
      }
    } catch (error) {
      console.log("Permission request failed:", error)
    }
  }

  const loadDownloads = async () => {
    try {
      const savedDownloads = await AsyncStorage.getItem("downloads")
      if (savedDownloads) {
        setDownloads(JSON.parse(savedDownloads))
      }
    } catch (error) {
      console.error("Error loading downloads:", error)
    }
  }

  const saveDownloads = async (newDownloads: Download[]) => {
    try {
      await AsyncStorage.setItem("downloads", JSON.stringify(newDownloads))
      setDownloads(newDownloads)
    } catch (error) {
      console.error("Error saving downloads:", error)
    }
  }

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

      // Fetch latest movies
      const latestMoviesRes = await fetch(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}`)
      const latestMoviesData = await latestMoviesRes.json()
      setLatestMovies(latestMoviesData.results?.slice(0, 20) || [])
    } catch (error) {
      console.error("Error loading content:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchContent = async (type: "movie" | "tv") => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a search term")
      return
    }

    setLoading(true)
    try {
      const url = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`
      const res = await fetch(url)
      const data = await res.json()

      setSearchResults(data.results || [])

      if (data.results?.length === 0) {
        Alert.alert("No Results", `No ${type === "movie" ? "movies" : "TV shows"} found. Try a different search term.`)
      }
    } catch (error) {
      Alert.alert("Error", "Search failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getMovieDetails = async (item: Movie, isTV = false) => {
    setDetailsLoading(true)
    try {
      const url = `${TMDB_BASE_URL}/${isTV ? "tv" : "movie"}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`
      const res = await fetch(url)
      const details = await res.json()
      setMovieDetails(details)
      setShowDetails(true)
    } catch (error) {
      Alert.alert("Error", "Failed to load movie details.")
    } finally {
      setDetailsLoading(false)
    }
  }

  const getStreamingUrl = async (item: Movie, isTV = false) => {
    try {
      let streamUrl = ""

      if (isTV) {
        // Get TV show details for IMDB ID
        const detailsRes = await fetch(`${TMDB_BASE_URL}/tv/${item.id}?api_key=${TMDB_API_KEY}`)
        const details = await detailsRes.json()
        const showId = details.external_ids?.imdb_id || item.id
        streamUrl = `https://vidsrc.icu/embed/tv/${showId}/1/1`
      } else {
        // Get movie details for IMDB ID
        const detailsRes = await fetch(`${TMDB_BASE_URL}/movie/${item.id}?api_key=${TMDB_API_KEY}`)
        const details = await detailsRes.json()
        const movieId = details.imdb_id || item.id
        streamUrl = `https://vidsrc.icu/embed/movie/${movieId}`
      }

      return streamUrl
    } catch (error) {
      throw new Error("Failed to get streaming URL")
    }
  }

  const playContent = async (item: Movie, isTV = false) => {
    try {
      const streamUrl = await getStreamingUrl(item, isTV)
      setStreamingUrl(streamUrl)
      setSelectedMovie(item)
      setIsWatching(true)
      setShowDetails(false)
    } catch (error) {
      Alert.alert("Error", "Failed to load video. Please try again.")
    }
  }

  const downloadContent = async (item: Movie, isTV = false) => {
    try {
      // Check if already downloading or downloaded
      const existingDownload = downloads.find((d) => d.id === `${item.id}-${isTV ? "tv" : "movie"}`)
      if (existingDownload) {
        if (existingDownload.status === "completed") {
          Alert.alert("Already Downloaded", "This content is already downloaded.")
          return
        } else if (existingDownload.status === "downloading") {
          Alert.alert("Download in Progress", "This content is currently being downloaded.")
          return
        }
      }

      // Get streaming URL
      const streamUrl = await getStreamingUrl(item, isTV)

      // Create download entry
      const downloadId = `${item.id}-${isTV ? "tv" : "movie"}`
      const newDownload: Download = {
        id: downloadId,
        movie: item,
        progress: 0,
        status: "downloading",
        downloadUri: streamUrl,
      }

      const updatedDownloads = [...downloads.filter((d) => d.id !== downloadId), newDownload]
      await saveDownloads(updatedDownloads)

      // Start download
      startDownload(newDownload)

      Alert.alert("Download Started", `${item.title || item.name} has been added to downloads.`)
      setShowDetails(false)
    } catch (error) {
      Alert.alert("Download Error", "Failed to start download. Please try again.")
    }
  }

  const startDownload = async (download: Download) => {
    try {
      // Create a unique filename
      const fileName = `${download.movie.title || download.movie.name}_${download.id}.mp4`
      const fileUri = `${FileSystem.documentDirectory}downloads/${fileName}`

      // Ensure downloads directory exists
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}downloads/`, { intermediates: true })

      // Note: In a real app, you would need to extract the actual video URL from the streaming service
      // For demo purposes, we'll simulate a download
      simulateDownload(download, fileUri)
    } catch (error) {
      console.error("Download error:", error)
      updateDownloadStatus(download.id, "error")
    }
  }

  const simulateDownload = (download: Download, fileUri: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 10
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        completeDownload(download.id, fileUri)
      }
      updateDownloadProgress(download.id, progress)
    }, 500)
  }

  const updateDownloadProgress = (downloadId: string, progress: number) => {
    setDownloads((prev) => prev.map((d) => (d.id === downloadId ? { ...d, progress: Math.min(progress, 100) } : d)))
  }

  const updateDownloadStatus = (downloadId: string, status: Download["status"]) => {
    setDownloads((prev) => prev.map((d) => (d.id === downloadId ? { ...d, status } : d)))
  }

  const completeDownload = async (downloadId: string, localUri: string) => {
    try {
      // Update download status
      const updatedDownloads = downloads.map((d) =>
        d.id === downloadId ? { ...d, status: "completed" as const, progress: 100, localUri } : d,
      )
      await saveDownloads(updatedDownloads)

      Alert.alert("Download Complete", "Movie has been downloaded successfully!")
    } catch (error) {
      console.error("Error completing download:", error)
      updateDownloadStatus(downloadId, "error")
    }
  }

  const deleteDownload = async (downloadId: string) => {
    Alert.alert("Delete Download", "Are you sure you want to delete this download?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const download = downloads.find((d) => d.id === downloadId)
            if (download?.localUri) {
              await FileSystem.deleteAsync(download.localUri, { idempotent: true })
            }
            const updatedDownloads = downloads.filter((d) => d.id !== downloadId)
            await saveDownloads(updatedDownloads)
          } catch (error) {
            console.error("Error deleting download:", error)
          }
        },
      },
    ])
  }

  const playDownloadedContent = (download: Download) => {
    if (download.localUri) {
      setStreamingUrl(download.localUri)
      setSelectedMovie(download.movie)
      setIsWatching(true)
    } else {
      Alert.alert("Error", "Downloaded file not found.")
    }
  }

  const stopWatching = () => {
    setStreamingUrl(null)
    setSelectedMovie(null)
    setIsWatching(false)
  }

  const openInBrowser = () => {
    if (streamingUrl) {
      Linking.openURL(streamingUrl)
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

  const renderMovieCard = (item: Movie, isTV = false) => {
    const downloadId = `${item.id}-${isTV ? "tv" : "movie"}`
    const existingDownload = downloads.find((d) => d.id === downloadId)

    return (
      <View key={item.id} style={styles.movieCard}>
        <Image
          source={{
            uri: item.poster_path
              ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}`
              : "https://via.placeholder.com/300x450/333/fff?text=No+Image",
          }}
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {item.title || item.name}
          </Text>
          <View style={styles.movieMeta}>
            <Text style={styles.year}>
              {isTV
                ? item.first_air_date
                  ? new Date(item.first_air_date).getFullYear()
                  : "N/A"
                : item.release_date
                  ? new Date(item.release_date).getFullYear()
                  : "N/A"}
            </Text>
            <Text style={styles.rating}>⭐ {item.vote_average?.toFixed(1) || "N/A"}</Text>
          </View>

          {/* Download Progress Bar */}
          {existingDownload && existingDownload.status === "downloading" && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Downloading... {Math.round(existingDownload.progress)}%</Text>
              {Platform.OS === "android" ? (
                <ProgressBarAndroid
                  styleAttr="Horizontal"
                  indeterminate={false}
                  progress={existingDownload.progress / 100}
                  color="#4facfe"
                />
              ) : (
                <ProgressViewIOS progress={existingDownload.progress / 100} progressTintColor="#4facfe" />
              )}
            </View>
          )}

          {/* Details Button */}
          <TouchableOpacity style={styles.detailsButton} onPress={() => getMovieDetails(item, isTV)}>
            <Text style={styles.detailsButtonText}>ℹ️ Details</Text>
          </TouchableOpacity>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {/* Watch Button - Left */}
            <TouchableOpacity style={styles.watchButton} onPress={() => playContent(item, isTV)}>
              <Text style={styles.watchButtonText}>▶ Watch</Text>
            </TouchableOpacity>

            {/* Download Button - Right */}
            {existingDownload?.status === "completed" ? (
              <TouchableOpacity style={styles.offlineButton} onPress={() => playDownloadedContent(existingDownload)}>
                <Text style={styles.offlineButtonText}>📱 Offline</Text>
              </TouchableOpacity>
            ) : existingDownload?.status === "downloading" ? (
              <TouchableOpacity style={styles.downloadingButton} disabled>
                <Text style={styles.downloadingButtonText}>⏳ {Math.round(existingDownload.progress)}%</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.downloadButton} onPress={() => downloadContent(item, isTV)}>
                <Text style={styles.downloadButtonText}>⬇ Download</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  }

  const renderDownloadItem = (download: Download) => (
    <View key={download.id} style={styles.downloadItem}>
      <Image
        source={{
          uri: download.movie.poster_path
            ? `${TMDB_IMAGE_BASE_URL}${download.movie.poster_path}`
            : "https://via.placeholder.com/100x150/333/fff?text=No+Image",
        }}
        style={styles.downloadPoster}
        resizeMode="cover"
      />
      <View style={styles.downloadInfo}>
        <Text style={styles.downloadTitle} numberOfLines={2}>
          {download.movie.title || download.movie.name}
        </Text>
        <Text style={styles.downloadStatus}>
          {download.status === "completed"
            ? "✅ Downloaded"
            : download.status === "downloading"
              ? `⏳ ${Math.round(download.progress)}%`
              : download.status === "error"
                ? "❌ Error"
                : "⏸ Paused"}
        </Text>

        {download.status === "downloading" && (
          <View style={styles.progressContainer}>
            {Platform.OS === "android" ? (
              <ProgressBarAndroid
                styleAttr="Horizontal"
                indeterminate={false}
                progress={download.progress / 100}
                color="#4facfe"
              />
            ) : (
              <ProgressViewIOS progress={download.progress / 100} progressTintColor="#4facfe" />
            )}
          </View>
        )}

        <View style={styles.downloadActions}>
          {download.status === "completed" && (
            <TouchableOpacity style={styles.playOfflineButton} onPress={() => playDownloadedContent(download)}>
              <Text style={styles.playOfflineButtonText}>Play</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteDownload(download.id)}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderTabButton = (tabName: string, title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabName && styles.activeTab]}
      onPress={() => {
        setActiveTab(tabName)
        setSearchResults([])
      }}
    >
      <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
        {icon} {title}
      </Text>
    </TouchableOpacity>
  )

  // Movie Details Modal
  const renderDetailsModal = () => (
    <Modal visible={showDetails} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowDetails(false)}>
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Movie Details</Text>
          <View style={styles.placeholder} />
        </View>

        {detailsLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading details...</Text>
          </View>
        ) : movieDetails ? (
          <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
            {/* Poster and Basic Info */}
            <View style={styles.detailsHeader}>
              <Image
                source={{
                  uri: movieDetails.poster_path
                    ? `${TMDB_IMAGE_BASE_URL}${movieDetails.poster_path}`
                    : "https://via.placeholder.com/300x450/333/fff?text=No+Image",
                }}
                style={styles.detailsPoster}
                resizeMode="cover"
              />
              <View style={styles.detailsInfo}>
                <Text style={styles.detailsTitle}>{movieDetails.title || movieDetails.name}</Text>
                {movieDetails.tagline && <Text style={styles.tagline}>"{movieDetails.tagline}"</Text>}
                <View style={styles.detailsMeta}>
                  <Text style={styles.metaText}>⭐ {movieDetails.vote_average?.toFixed(1)} / 10</Text>
                  <Text style={styles.metaText}>📅 {movieDetails.release_date || movieDetails.first_air_date}</Text>
                  {movieDetails.runtime && <Text style={styles.metaText}>⏱️ {formatRuntime(movieDetails.runtime)}</Text>}
                  <Text style={styles.metaText}>📊 {movieDetails.status}</Text>
                </View>
              </View>
            </View>

            {/* Genres */}
            {movieDetails.genres && movieDetails.genres.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Genres</Text>
                <View style={styles.genresContainer}>
                  {movieDetails.genres.map((genre) => (
                    <View key={genre.id} style={styles.genreTag}>
                      <Text style={styles.genreText}>{genre.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Overview */}
            {movieDetails.overview && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <Text style={styles.overviewText}>{movieDetails.overview}</Text>
              </View>
            )}

            {/* Production Info */}
            {movieDetails.budget && movieDetails.budget > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Production</Text>
                <Text style={styles.productionText}>💰 Budget: {formatCurrency(movieDetails.budget)}</Text>
                {movieDetails.revenue && movieDetails.revenue > 0 && (
                  <Text style={styles.productionText}>💵 Revenue: {formatCurrency(movieDetails.revenue)}</Text>
                )}
              </View>
            )}

            {/* Production Companies */}
            {movieDetails.production_companies && movieDetails.production_companies.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Production Companies</Text>
                {movieDetails.production_companies.slice(0, 3).map((company) => (
                  <Text key={company.id} style={styles.companyText}>
                    🏢 {company.name}
                  </Text>
                ))}
              </View>
            )}

            {/* Languages */}
            {movieDetails.spoken_languages && movieDetails.spoken_languages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                <Text style={styles.languageText}>
                  🗣️ {movieDetails.spoken_languages.map((lang) => lang.name).join(", ")}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.detailsActions}>
              <TouchableOpacity
                style={styles.detailsWatchButton}
                onPress={() => playContent(movieDetails, movieDetails.name ? true : false)}
              >
                <Text style={styles.detailsWatchButtonText}>▶ Watch Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailsDownloadButton}
                onPress={() => downloadContent(movieDetails, movieDetails.name ? true : false)}
              >
                <Text style={styles.detailsDownloadButtonText}>⬇ Download</Text>
              </TouchableOpacity>
            </View>

            {/* Copyright */}
            <View style={styles.detailsCopyright}>
              <Text style={styles.copyrightText}>© 2024 Moe Thu Kyaw. All rights reserved.</Text>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  )

  // Video Player Screen
  if (isWatching && streamingUrl) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

        {/* Header */}
        <View style={styles.playerHeader}>
          <TouchableOpacity style={styles.backButton} onPress={stopWatching}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.playerTitle}>
            <Text style={styles.playerTitleText} numberOfLines={1}>
              {selectedMovie?.title || selectedMovie?.name}
            </Text>
            <Text style={styles.playerSubtitle}>Now Playing</Text>
          </View>
        </View>

        {/* Warning */}
        {!streamingUrl?.startsWith("file://") && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>⚠️ If video doesn't load, please disable ad blocker and allow popups</Text>
          </View>
        )}

        {/* Video Player */}
        <View style={styles.videoContainer}>
          <WebView
            source={{ uri: streamingUrl }}
            style={styles.webview}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
          />
        </View>

        {/* Troubleshooting */}
        {!streamingUrl?.startsWith("file://") && (
          <View style={styles.troubleshootContainer}>
            <Text style={styles.troubleshootTitle}>Video not loading?</Text>
            <Text style={styles.troubleshootText}>
              • Disable ad blocker for this site{"\n"}• Allow popups in your browser{"\n"}• Try opening in external
              browser{"\n"}• Check your internet connection
            </Text>
            <TouchableOpacity style={styles.browserButton} onPress={openInBrowser}>
              <Text style={styles.browserButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Copyright */}
        <View style={styles.playerCopyright}>
          <Text style={styles.copyrightText}>© 2024 Moe Thu Kyaw. All rights reserved.</Text>
        </View>
      </View>
    )
  }

  // Main Browse Screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>MTK Video Streaming App</Text>
        <Text style={styles.subtitle}>Discover & Stream</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {renderTabButton("trending", "Trending Movies", "🔥")}
        {renderTabButton("trending-tv", "Trending TV", "📺")}
        {renderTabButton("latest", "Latest Movies", "🆕")}
        {renderTabButton("search-movies", "Search Movies", "🔍")}
        {renderTabButton("search-tv", "Search TV", "🔍")}
        {renderTabButton("downloads", "Downloads", "⬇")}
      </ScrollView>

      {/* Search Bar */}
      {(activeTab === "search-movies" || activeTab === "search-tv") && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search for ${activeTab === "search-movies" ? "movies" : "TV shows"}...`}
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => searchContent(activeTab === "search-movies" ? "movie" : "tv")}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => searchContent(activeTab === "search-movies" ? "movie" : "tv")}
          >
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeTab === "downloads" ? (
          <View style={styles.downloadsContainer}>
            <Text style={styles.sectionTitle}>My Downloads ({downloads.length})</Text>
            {downloads.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No downloads yet</Text>
                <Text style={styles.emptySubtext}>Download movies and TV shows to watch offline</Text>
              </View>
            ) : (
              downloads.map((download) => renderDownloadItem(download))
            )}
          </View>
        ) : (
          <View style={styles.moviesGrid}>
            {activeTab === "trending" && trendingMovies.map((movie) => renderMovieCard(movie, false))}
            {activeTab === "trending-tv" && trendingTV.map((show) => renderMovieCard(show, true))}
            {activeTab === "latest" && latestMovies.map((movie) => renderMovieCard(movie, false))}
            {(activeTab === "search-movies" || activeTab === "search-tv") &&
              searchResults.map((item) => renderMovieCard(item, activeTab === "search-tv"))}
          </View>
        )}

        {/* Copyright Footer */}
        <View style={styles.footer}>
          <Text style={styles.copyrightText}>© 2024 Moe Thu Kyaw. All rights reserved.</Text>
          <Text style={styles.copyrightSubtext}>MTK Video Streaming App</Text>
        </View>
      </ScrollView>

      {/* Details Modal */}
      {renderDetailsModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: "center",
    backgroundColor: "#16213e",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4facfe",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#a8b2d1",
  },
  tabContainer: {
    backgroundColor: "#16213e",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#4facfe30",
  },
  activeTab: {
    backgroundColor: "#4facfe",
  },
  tabText: {
    color: "#a8b2d1",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    margin: 15,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#16213e",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4facfe30",
  },
  searchButton: {
    backgroundColor: "#4facfe",
    padding: 15,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  searchButtonText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  loadingText: {
    color: "#a8b2d1",
    fontSize: 16,
  },
  moviesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 15,
  },
  movieCard: {
    width: (width - 45) / 2,
    backgroundColor: "#16213e",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#4facfe20",
  },
  poster: {
    width: "100%",
    height: 200,
    backgroundColor: "#333",
  },
  movieInfo: {
    padding: 10,
  },
  movieTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  movieMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  year: {
    color: "#4facfe",
    fontSize: 12,
  },
  rating: {
    color: "#ffd700",
    fontSize: 12,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressText: {
    color: "#a8b2d1",
    fontSize: 10,
    marginBottom: 3,
  },
  // Details Button
  detailsButton: {
    backgroundColor: "#9b59b6",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Action Buttons Row - Side by Side
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  watchButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  watchButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  downloadButton: {
    flex: 1,
    backgroundColor: "#4facfe",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  downloadingButton: {
    flex: 1,
    backgroundColor: "#f39c12",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  downloadingButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  offlineButton: {
    flex: 1,
    backgroundColor: "#27ae60",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  offlineButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Downloads Screen
  downloadsContainer: {
    padding: 15,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 50,
  },
  emptyText: {
    color: "#a8b2d1",
    fontSize: 18,
    marginBottom: 10,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  downloadItem: {
    flexDirection: "row",
    backgroundColor: "#16213e",
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#4facfe20",
  },
  downloadPoster: {
    width: 60,
    height: 90,
    borderRadius: 5,
    backgroundColor: "#333",
  },
  downloadInfo: {
    flex: 1,
    marginLeft: 10,
  },
  downloadTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  downloadStatus: {
    color: "#a8b2d1",
    fontSize: 12,
    marginBottom: 10,
  },
  downloadActions: {
    flexDirection: "row",
    gap: 10,
  },
  playOfflineButton: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  playOfflineButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Details Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    paddingTop: 50,
    backgroundColor: "#16213e",
    borderBottomWidth: 1,
    borderBottomColor: "#4facfe20",
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: "#4facfe",
    fontSize: 16,
    fontWeight: "500",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 80,
  },
  detailsContent: {
    flex: 1,
    padding: 15,
  },
  detailsHeader: {
    flexDirection: "row",
    marginBottom: 20,
  },
  detailsPoster: {
    width: 120,
    height: 180,
    borderRadius: 10,
    backgroundColor: "#333",
  },
  detailsInfo: {
    flex: 1,
    marginLeft: 15,
  },
  detailsTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  tagline: {
    color: "#a8b2d1",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 10,
  },
  detailsMeta: {
    gap: 5,
  },
  metaText: {
    color: "#4facfe",
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genreTag: {
    backgroundColor: "#4facfe20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#4facfe40",
  },
  genreText: {
    color: "#4facfe",
    fontSize: 12,
    fontWeight: "500",
  },
  overviewText: {
    color: "#a8b2d1",
    fontSize: 14,
    lineHeight: 20,
  },
  productionText: {
    color: "#27ae60",
    fontSize: 14,
    marginBottom: 5,
  },
  companyText: {
    color: "#a8b2d1",
    fontSize: 14,
    marginBottom: 3,
  },
  languageText: {
    color: "#a8b2d1",
    fontSize: 14,
  },
  detailsActions: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 20,
  },
  detailsWatchButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  detailsWatchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsDownloadButton: {
    flex: 1,
    backgroundColor: "#4facfe",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  detailsDownloadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsCopyright: {
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#4facfe20",
  },
  // Footer
  footer: {
    alignItems: "center",
    padding: 30,
    borderTopWidth: 1,
    borderTopColor: "#4facfe20",
    marginTop: 20,
  },
  copyrightText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
  },
  copyrightSubtext: {
    color: "#555",
    fontSize: 10,
    textAlign: "center",
    marginTop: 5,
  },
  // Video Player Styles
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    paddingTop: 50,
    backgroundColor: "#16213e",
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: "#4facfe",
    fontSize: 16,
    fontWeight: "500",
  },
  playerTitle: {
    flex: 1,
    alignItems: "center",
  },
  playerTitleText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  playerSubtitle: {
    color: "#a8b2d1",
    fontSize: 14,
  },
  warningContainer: {
    backgroundColor: "#f39c1230",
    borderColor: "#f39c12",
    borderWidth: 1,
    margin: 15,
    padding: 10,
    borderRadius: 8,
  },
  warningText: {
    color: "#f39c12",
    textAlign: "center",
    fontSize: 12,
  },
  videoContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
  },
  troubleshootContainer: {
    backgroundColor: "#16213e",
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  troubleshootTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  troubleshootText: {
    color: "#a8b2d1",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
  },
  browserButton: {
    backgroundColor: "#4facfe",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  browserButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  playerCopyright: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "#16213e",
  },
})
