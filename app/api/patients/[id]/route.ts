import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import {
  deletePatient,
  getPatientById,
  updatePatient,
} from "@/lib/services/patients";
import { patientSchema } from "@/lib/validators/patient";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const authContext = await getInternalRequestContext();

  if (!authContext.ok) {
    return NextResponse.json(
      { error: authContext.error },
      { status: authContext.status }
    );
  }

  try {
    const { id } = await context.params;
    const patient = await getPatientById(authContext.supabase, id);
    return NextResponse.json({ data: patient }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load patient." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authContext = await getInternalRequestContext();

  if (!authContext.ok) {
    return NextResponse.json(
      { error: authContext.error },
      { status: authContext.status }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = patientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid patient payload." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const patient = await updatePatient(authContext.supabase, id, parsed.data);
    return NextResponse.json({ data: patient }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update patient." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const authContext = await getInternalRequestContext();

  if (!authContext.ok) {
    return NextResponse.json(
      { error: authContext.error },
      { status: authContext.status }
    );
  }

  try {
    const { id } = await context.params;
    await deletePatient(authContext.supabase, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete patient." },
      { status: 500 }
    );
  }
}
