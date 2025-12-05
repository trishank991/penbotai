import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NavbarXP } from "@/components/gamification";
import { calculateAge } from "@/types";

// Base navigation items
const baseNavItems = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/prompt-coach", label: "Prompt Coach", icon: "🎯" },
  { href: "/disclosure", label: "Disclosure", icon: "📝" },
  { href: "/assignment-audit", label: "Submission Ready", icon: "✅" },
  { href: "/research", label: "Research", icon: "📚" },
  { href: "/grammar", label: "Grammar", icon: "✍️" },
  { href: "/achievements", label: "Achievements", icon: "🏆" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is a parent (has linked children) or is an adult
  const { data: profile } = await supabase
    .from("profiles")
    .select("date_of_birth")
    .eq("id", user.id)
    .single();

  const { count: childCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("parent_user_id", user.id);

  // Show parent dashboard link if user is 18+ or has linked children
  const isAdult = profile?.date_of_birth
    ? calculateAge(profile.date_of_birth) >= 18
    : true; // Assume adult if no DOB
  const hasChildren = (childCount || 0) > 0;

  const navItems = hasChildren || isAdult
    ? [...baseNavItems.slice(0, -1), { href: "/parent-dashboard", label: "Parent", icon: "👨‍👩‍👧" }, baseNavItems[baseNavItems.length - 1]]
    : baseNavItems;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PenBotAI
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NavbarXP className="hidden sm:flex" />
              <span className="text-sm text-muted-foreground hidden lg:block">
                {user.email}
              </span>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center p-2 text-xs text-gray-600"
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  );
}
