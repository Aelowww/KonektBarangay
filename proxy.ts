import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_LOGIN = "/admin/login";

function isResidentOnlyPath(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/set-appointment") return true;
  if (pathname === "/request-document") return true;
  if (pathname === "/blotter") return true;
  if (pathname === "/request-document/summary") return !searchParams.has("id");
  return false;
}

function requiresLogin(pathname: string) {
  return (
    pathname === "/set-appointment" ||
    pathname === "/blotter" ||
    pathname === "/verify-identity" ||
    pathname.startsWith("/request-document/summary")
  );
}

function redirectToLogin(request: NextRequest, loginPath: string) {
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const isAdminLogin = pathname === ADMIN_LOGIN;
  const isAdminPath = pathname.startsWith("/admin") && !isAdminLogin;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (isAdminPath) return redirectToLogin(request, ADMIN_LOGIN);
    if (requiresLogin(pathname)) return redirectToLogin(request, "/login");
    return response;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "").toLowerCase();

  if (isAdminLogin) {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin/manage-services" : "/", request.url));
  }

  if (isAdminPath) {
    if (profileError || role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  if (role === "admin" && isResidentOnlyPath(request)) {
    const target = pathname === "/blotter" ? "/admin/blotter" : "/admin/manage-services";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/request-document/:path*", "/set-appointment", "/blotter", "/verify-identity"],
};
