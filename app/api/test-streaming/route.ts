import { NextResponse } from "next/server"

export async function GET() {
  // Mock streaming data for testing purposes
  const testStreamingData = [
    {
      id: "test1",
      title: "Sample Video 1",
      description: "Test video for streaming functionality",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
      duration: "10:34",
      category: "Animation",
    },
    {
      id: "test2",
      title: "Sample Video 2",
      description: "Another test video for streaming",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
      duration: "10:53",
      category: "Animation",
    },
    {
      id: "test3",
      title: "Sample Video 3",
      description: "Third test video for streaming",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
      duration: "00:15",
      category: "Commercial",
    },
  ]

  return NextResponse.json(testStreamingData)
}
