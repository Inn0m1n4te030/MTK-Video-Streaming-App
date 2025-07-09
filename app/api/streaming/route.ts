import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const imdbId = searchParams.get("imdbId")

  if (!imdbId) {
    return NextResponse.json({ error: "IMDB ID is required" }, { status: 400 })
  }

  try {
    console.log("Fetching streaming info for:", imdbId)

    const response = await fetch(
      `https://streaming-availability.p.rapidapi.com/shows/${imdbId}?series_granularity=episode&output_language=en`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "streaming-availability.p.rapidapi.com",
          "x-rapidapi-key": "4b7e7d6df9msh9f54c3e8723b274p1f9905jsn74cf117f1841",
        },
      },
    )

    console.log("Streaming API response status:", response.status)

    if (!response.ok) {
      console.log("Streaming API error:", response.status, response.statusText)
      return NextResponse.json({ error: "Movie not found in streaming database" }, { status: 404 })
    }

    const data = await response.json()
    console.log("Streaming data received:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching streaming info:", error)
    return NextResponse.json({ error: "Failed to fetch streaming information" }, { status: 500 })
  }
}
