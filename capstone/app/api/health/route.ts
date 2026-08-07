import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    project: "EcoVoice",
    framework: "Next.js",
    version: "Capstone Skeleton",
  });
}
