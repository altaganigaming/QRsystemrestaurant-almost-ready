import { NextResponse } from "next/server";
import { placeOrder, type PlaceOrderInput } from "@/lib/actions/ordering";

export async function POST(request: Request) {
  try {
    const input = await request.json() as PlaceOrderInput;
    const result = await placeOrder(input);
    return NextResponse.json(result, { status: "error" in result ? 400 : 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not place the order." },
      { status: 400 },
    );
  }
}