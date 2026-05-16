import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/auth");
  const isApiPage = pathname.startsWith("/api");
  const isPrivacyPage = pathname.startsWith("/privacy");

  // 1. Basic Auth Guard
  if (
    pathname !== "/" &&
    !user &&
    !isAuthPage &&
    !isApiPage
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Mandatory Consent Guard
  if (user && !isApiPage && !pathname.startsWith("/auth/signout")) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_consented')
      .eq('id', user.id)
      .single();

    // If no profile found OR is_consented is falsy (false or null)
    if (!profile || !profile.is_consented) {
      if (!pathname.startsWith("/privacy/consent") && !isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/privacy/consent";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
