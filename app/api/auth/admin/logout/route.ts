import {NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Logout!" });
    response.cookies.delete("admin_token");
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to logout",
      },
      { status: 500 },
    );
  }
}
