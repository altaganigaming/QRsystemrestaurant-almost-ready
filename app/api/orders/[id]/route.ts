import { NextResponse } from "next/server";
import { getTrackableOrder } from "@/lib/actions/ordering";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const result = await getTrackableOrder(params.id, token);
    return NextResponse.json(result, { status: "error" in result ? 404 : 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Order not found." },
      { status: 404 },
    );
  }
}
