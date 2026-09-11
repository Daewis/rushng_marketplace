import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      location: user.location,
      capabilities: JSON.parse(user.capabilities),
      activeWorkspace: user.activeWorkspace,
      createdAt: user.createdAt,
      vendorProfile: user.vendorProfile,
      providerProfile: user.providerProfile,
      riderProfile: user.riderProfile,
      wallet: user.wallet,
    },
  });
}
