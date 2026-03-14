import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { createPatient, listPatients } from "@/lib/services/patients";
import { patientSchema } from "@/lib/validators/patient";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const patients = await listPatients(context.supabase);
    return NextResponse.json({ data: patients }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load patients." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = patientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid patient payload." }, { status: 400 });
  }

  try {
    const patient = await createPatient(
      context.supabase,
      context.profile,
      parsed.data
    );

    return NextResponse.json({ data: patient }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create patient." },
      { status: 500 }
    );
  }
}
