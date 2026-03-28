import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTeamMembership } from "@/lib/teams/auth";
import { TeamNav } from "@/components/teams/team-nav";
import { MemberRow } from "@/components/teams/member-row";
import { InviteForm } from "@/components/teams/invite-form";

interface PageProps {
  readonly params: Promise<{ teamId: string }>;
}

interface MemberRow_ {
  readonly id: string;
  readonly team_id: string;
  readonly user_id: string | null;
  readonly email: string;
  readonly role: string;
  readonly accepted_at: string | null;
  readonly created_at: string;
}

export default async function TeamMembersPage({ params }: PageProps) {
  const { teamId } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getTeamMembership(supabase, teamId, user.id);
  if (!membership) {
    notFound();
  }

  const [{ data: team }, { data: members }] = await Promise.all([
    supabase.from("teams").select("id, name, slug").eq("id", teamId).single(),
    supabase
      .from("team_members")
      .select("id, team_id, user_id, email, role, accepted_at, created_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true }),
  ]);

  if (!team) {
    notFound();
  }

  const memberList = (members ?? []) as readonly MemberRow_[];
  const isAdmin = membership.role === "admin";

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard/teams"
            className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
          >
            &larr; Teams
          </Link>
          <h1 className="text-xl font-semibold text-sand-900 mt-1">
            {team.name}
          </h1>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
        >
          Dashboard
        </Link>
      </header>

      <TeamNav teamId={teamId} />

      <div className="space-y-6">
        {isAdmin && (
          <div className="p-4 bg-white border border-sand-200 rounded-lg">
            <InviteForm teamId={teamId} />
          </div>
        )}

        <div className="bg-white border border-sand-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50">
                <th className="text-left text-xs font-medium text-sand-500 uppercase tracking-wide py-2 px-4">
                  Email
                </th>
                <th className="text-left text-xs font-medium text-sand-500 uppercase tracking-wide py-2 px-4">
                  Role
                </th>
                <th className="text-left text-xs font-medium text-sand-500 uppercase tracking-wide py-2 px-4">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-sand-500 uppercase tracking-wide py-2 px-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="px-4">
              {memberList.map((member) => (
                <MemberRow
                  key={member.id}
                  id={member.id}
                  teamId={teamId}
                  email={member.email}
                  role={member.role}
                  acceptedAt={member.accepted_at}
                  isAdmin={isAdmin}
                  currentUserId={user.id}
                  userId={member.user_id}
                />
              ))}
            </tbody>
          </table>
          {memberList.length === 0 && (
            <p className="text-center text-sand-400 text-sm py-8">
              No members yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
