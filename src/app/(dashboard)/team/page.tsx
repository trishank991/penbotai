"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Team, TeamMember, Profile } from "@/types";

interface TeamMemberWithProfile extends TeamMember {
  profile?: Profile;
}

export default function TeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Form states
  const [teamName, setTeamName] = useState("");
  const [institution, setInstitution] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Get user's team membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("*, teams(*)")
      .eq("user_id", user.id)
      .single();

    if (membership && membership.teams) {
      setTeam(membership.teams as unknown as Team);
      setCurrentUserRole(membership.role);

      // Fetch all team members
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select("*, profiles(*)")
        .eq("team_id", membership.team_id);

      if (teamMembers) {
        setMembers(
          teamMembers.map((m) => ({
            ...m,
            profile: m.profiles as unknown as Profile,
          }))
        );
      }
    }

    setLoading(false);
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;

    setCreating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCreating(false);
      return;
    }

    // Create team
    const slug = teamName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: newTeam, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: teamName,
        slug: `${slug}-${Date.now().toString(36)}`,
        owner_id: user.id,
        institution: institution || null,
      })
      .select()
      .single();

    if (teamError || !newTeam) {
      console.error("Error creating team:", teamError);
      setCreating(false);
      return;
    }

    // Add creator as owner
    await supabase.from("team_members").insert({
      team_id: newTeam.id,
      user_id: user.id,
      role: "owner",
    });

    setTeam(newTeam as Team);
    setCurrentUserRole("owner");
    setCreating(false);
    fetchTeam();
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !team) return;

    setInviting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Generate invitation token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const { error } = await supabase.from("team_invitations").insert({
      team_id: team.id,
      email: inviteEmail,
      role: inviteRole,
      invited_by: user?.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      console.error("Error creating invitation:", error);
    } else {
      // In production, send email with invitation link
      alert(
        `Invitation created! Share this link:\n${window.location.origin}/team/join?token=${token}`
      );
      setInviteEmail("");
    }

    setInviting(false);
  };

  const removeMember = async (memberId: string) => {
    if (!team) return;

    const supabase = createClient();
    await supabase.from("team_members").delete().eq("id", memberId);
    setMembers(members.filter((m) => m.id !== memberId));
  };

  const updateMemberRole = async (
    memberId: string,
    newRole: "admin" | "member"
  ) => {
    if (!team) return;

    const supabase = createClient();
    await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("id", memberId);

    setMembers(
      members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  // No team yet - show create form
  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create a Team</CardTitle>
            <CardDescription>
              Set up a team for your university, writing center, or department
              to share PenBotAI with your colleagues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Stanford Writing Center"
              />
            </div>
            <div>
              <Label htmlFor="institution">Institution (optional)</Label>
              <Input
                id="institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g., Stanford University"
              />
            </div>
            <Button
              onClick={createTeam}
              disabled={creating || !teamName.trim()}
              className="w-full"
            >
              {creating ? "Creating..." : "Create Team"}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Have an invitation? Enter the invite link in your browser.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Team Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Team Plan</h3>
                <p className="text-2xl font-bold mt-2">
                  $199<span className="text-sm font-normal">/year</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>• Up to 50 members</li>
                  <li>• Unlimited disclosures</li>
                  <li>• Team analytics</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg border-blue-500">
                <h3 className="font-semibold">Enterprise</h3>
                <p className="text-2xl font-bold mt-2">Custom</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>• Unlimited members</li>
                  <li>• LMS integration</li>
                  <li>• SSO/SAML</li>
                  <li>• Dedicated support</li>
                  <li>• Custom templates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show team dashboard
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
          <p className="text-muted-foreground">
            {team.institution || "Team Dashboard"}
          </p>
        </div>
        <Badge variant={team.plan === "enterprise" ? "default" : "secondary"}>
          {team.plan === "enterprise" ? "Enterprise" : "Team Plan"}
        </Badge>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-sm text-muted-foreground">
              of {team.max_members} members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">Unlimited</div>
            <p className="text-sm text-muted-foreground">Disclosures</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold capitalize">
              {currentUserRole}
            </div>
            <p className="text-sm text-muted-foreground">Your role</p>
          </CardContent>
        </Card>
      </div>

      {/* Members list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage who has access to your team
              </CardDescription>
            </div>
            {(currentUserRole === "owner" || currentUserRole === "admin") && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Invite Member</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your team
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@university.edu"
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) =>
                          setInviteRole(v as "admin" | "member")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={inviteMember}
                      disabled={inviting || !inviteEmail.trim()}
                      className="w-full"
                    >
                      {inviting ? "Sending..." : "Send Invitation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {member.profile?.full_name || member.profile?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.profile?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={member.role === "owner" ? "default" : "outline"}
                  >
                    {member.role}
                  </Badge>
                  {currentUserRole === "owner" && member.role !== "owner" && (
                    <Select
                      value={member.role}
                      onValueChange={(v) =>
                        updateMemberRole(member.id, v as "admin" | "member")
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {currentUserRole === "owner" && member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => removeMember(member.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team settings (owner only) */}
      {currentUserRole === "owner" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Team Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Upgrade to Enterprise</p>
                <p className="text-sm text-muted-foreground">
                  Get unlimited members, LMS integration, and more
                </p>
              </div>
              <Button variant="outline">Contact Sales</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Billing</p>
                <p className="text-sm text-muted-foreground">
                  Manage subscription and payment methods
                </p>
              </div>
              <Button variant="outline">Manage Billing</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
