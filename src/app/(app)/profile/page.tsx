import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { ProfileView } from "@/features/profile/profile-view";

export const dynamic = "force-dynamic";

export default async function ProfileRoute() {
  const currentUser = await requireUser();

  const settings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  });

  return (
    <ProfileView
      user={currentUser.user}
      role={currentUser.role}
      companyName={settings?.companyName ?? "Stitch Billing"}
    />
  );
}
