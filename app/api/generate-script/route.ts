import { NextResponse } from "next/server";
import { createScriptWithAI } from "@/lib/openai";
import { scriptInputSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validated = scriptInputSchema.parse(payload);
    const result = await createScriptWithAI(validated);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Validation error", issues: error.issues },
        { status: 422 }
      );
    }

    console.error("Generate script API error", error);
    return NextResponse.json({ message: "Failed to generate script" }, { status: 500 });
  }
}
