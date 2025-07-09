import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const movieId = searchParams.get("movieId")

  if (!movieId) {
    return NextResponse.json({ error: "Movie ID is required" }, { status: 400 })
  }

  // Mock streaming URLs for testing - these would normally come from a legitimate streaming API
  const mockStreamingUrls = {
    "550": "https://vidsrc.to/embed/movie/550", // Fight Club
    "13": "https://vidsrc.to/embed/movie/13", // Forrest Gump
    "680": "https://vidsrc.to/embed/movie/680", // Pulp Fiction
    "155": "https://vidsrc.to/embed/movie/155", // The Dark Knight
    "238": "https://vidsrc.to/embed/movie/238", // The Godfather
  }

  const streamingUrl = mockStreamingUrls[movieId as keyof typeof mockStreamingUrls]

  if (streamingUrl) {
    return NextResponse.json({
      success: true,
      streamingUrl,
      message: "Streaming URL found",
    })
  } else {
    return NextResponse.json(
      {
        success: false,
        message: "Movie not available for streaming",
      },
      { status: 404 },
    )
  }
}
