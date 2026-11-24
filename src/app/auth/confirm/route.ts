import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { RUTA_INICIO } from "@/lib/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";

const esquemaOtp = z.object({
  token_hash: z.string().min(1),
  type: z.enum(["signup", "invite", "magiclink", "recovery", "email_change", "email"]),
});

const esquemaCodigo = z.object({
  code: z.string().min(1),
});

/**
 * Confirma el email del registro. Acepta `token_hash` + `type` (plantilla de
 * correo con verifyOtp) o `code` (flujo PKCE). Nunca muestra el error interno.
 */
export async function GET(request: NextRequest) {
  const parametros = Object.fromEntries(request.nextUrl.searchParams);
  const urlExito = new URL(RUTA_INICIO, request.nextUrl.origin);
  const urlError = new URL("/login?error=confirmacion", request.nextUrl.origin);

  const otp = esquemaOtp.safeParse(parametros);
  if (otp.success) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: otp.data.token_hash,
      type: otp.data.type,
    });
    return NextResponse.redirect(error ? urlError : urlExito);
  }

  const codigo = esquemaCodigo.safeParse(parametros);
  if (codigo.success) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo.data.code);
    return NextResponse.redirect(error ? urlError : urlExito);
  }

  return NextResponse.redirect(urlError);
}
