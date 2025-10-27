import { NextResponse } from "next/server";
import { callRequestSchema } from "@/lib/validators";
import { initiateCall, twilioConfigComplete } from "@/lib/twilio";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validated = callRequestSchema.parse(data);

    if (!twilioConfigComplete()) {
      return NextResponse.json(
        {
          message:
            "Twilio environment variables are missing. Provide TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_CALLER_ID."
        },
        { status: 503 }
      );
    }

    const call = await initiateCall({
      to: validated.phoneNumber,
      script: validated.script,
      metadata: {
        clientName: validated.clientName,
        businessName: validated.businessName
      }
    });

    return NextResponse.json({
      message: "Call queued successfully",
      status: call.status,
      sid: call.sid
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Validation error", issues: error.issues },
        { status: 422 }
      );
    }

    console.error("Call API error", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to queue call" },
      { status: 500 }
    );
  }
}
