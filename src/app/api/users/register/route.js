import { NextResponse } from "next/server";
import { createUser, getUsers, deleteUser } from "../../../../utils/userModel";

// userModel uses the fs module, so this must run on the Node runtime,
// and the list must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/users/register -> { success, users }
export async function GET() {
  try {
    // never send password hashes to the browser
    const users = getUsers().map(({ password, ...safe }) => safe);
    return NextResponse.json({ success: true, users });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/users/register -> { success, user }
export async function POST(request) {
  try {
    const body = await request.json();
    const user = await createUser(body);
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 400 }
    );
  }
}

// DELETE /api/users/register  body: { email } -> { success }
export async function DELETE(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { success: false, message: "email шаардлагатай" },
        { status: 400 }
      );
    }
    deleteUser(email);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 404 }
    );
  }
}