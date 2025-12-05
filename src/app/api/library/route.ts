import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Save a paper to library
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      authors,
      year,
      abstract,
      url,
      doi,
      journal,
      volume,
      issue,
      pages,
      citation_count,
      source,
      external_id,
      tags,
      folder,
    } = body;

    if (!title || !authors) {
      return NextResponse.json(
        { error: "Title and authors are required" },
        { status: 400 }
      );
    }

    // Check if paper already exists (by external_id or doi)
    // Use separate queries to avoid SQL injection via .or() template literal
    let existing = null;

    if (external_id) {
      const { data } = await supabase
        .from("saved_papers")
        .select("id")
        .eq("user_id", user.id)
        .eq("external_id", external_id)
        .maybeSingle();
      existing = data;
    }

    if (!existing && doi) {
      const { data } = await supabase
        .from("saved_papers")
        .select("id")
        .eq("user_id", user.id)
        .eq("doi", doi)
        .maybeSingle();
      existing = data;
    }

    if (existing) {
      return NextResponse.json(
        { error: "Paper already in library", id: existing.id },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("saved_papers")
      .insert({
        user_id: user.id,
        title,
        authors,
        year,
        abstract,
        url,
        doi,
        journal,
        volume,
        issue,
        pages,
        citation_count,
        source: source || "manual",
        external_id,
        tags: tags || [],
        folder: folder || "default",
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving paper:", error);
      return NextResponse.json(
        { error: "Failed to save paper" },
        { status: 500 }
      );
    }

    return NextResponse.json({ paper: data });
  } catch (error) {
    console.error("Library API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get saved papers
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("saved_papers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (folder && folder !== "all") {
      query = query.eq("folder", folder);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ papers: data });
  } catch (error) {
    console.error("Error fetching library:", error);
    return NextResponse.json(
      { error: "Failed to fetch library" },
      { status: 500 }
    );
  }
}

// Delete a paper from library
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Paper ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("saved_papers")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting paper:", error);
    return NextResponse.json(
      { error: "Failed to delete paper" },
      { status: 500 }
    );
  }
}
