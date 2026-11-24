import { NextResponse, type NextRequest } from "next/server";
import {
  ERROR_CONFIRMACION,
  codigoErrorIntercambio,
  parsearParametrosConfirmacion,
  resumenCookiesPkce,
  resumenErrorAuth,
  type CodigoErrorConfirmacion,
} from "@/lib/confirmacion";
import { RUTA_INICIO, RUTA_LOGIN } from "@/lib/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Confirma el email del registro. Acepta `token_hash` + `type` (plantilla de
 * correo con verifyOtp) o `code` (flujo PKCE con la plantilla por defecto).
 * Los fallos se registran en el servidor (sin tokens ni datos del usuario) y
 * al usuario solo se le muestra un código de la lista blanca de `/login` (D17).
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const parametros = parsearParametrosConfirmacion(searchParams);

  const redirigirConError = (codigo: CodigoErrorConfirmacion) => {
    const destino = new URL(RUTA_LOGIN, origin);
    destino.searchParams.set("error", codigo);
    return NextResponse.redirect(destino);
  };
  const exito = () => NextResponse.redirect(new URL(RUTA_INICIO, origin));

  switch (parametros.tipo) {
    case "otp": {
      const supabase = await crearClienteServidor();
      const { error } = await supabase.auth.verifyOtp({
        token_hash: parametros.tokenHash,
        type: parametros.type,
      });
      if (!error) return exito();
      console.error("[auth/confirm] verifyOtp falló", resumenErrorAuth(error));
      return redirigirConError(ERROR_CONFIRMACION);
    }
    case "codigo": {
      const supabase = await crearClienteServidor();
      const { error } = await supabase.auth.exchangeCodeForSession(parametros.code);
      if (!error) return exito();
      // Para diagnosticar un verifier ausente: host de la petición y qué cookies
      // de PKCE llegaron (solo nombres, nunca valores).
      console.error("[auth/confirm] exchangeCodeForSession falló", {
        ...resumenErrorAuth(error),
        host: request.headers.get("host"),
        cookiesPkce: resumenCookiesPkce(request.cookies.getAll().map(({ name }) => name)),
      });
      return redirigirConError(codigoErrorIntercambio(error));
    }
    case "error-proveedor": {
      console.error("[auth/confirm] Supabase no pudo verificar el enlace", {
        codigo: parametros.codigoError,
      });
      return redirigirConError(ERROR_CONFIRMACION);
    }
    case "invalido": {
      console.error("[auth/confirm] petición sin token_hash, code ni error", {
        parametros: [...searchParams.keys()],
      });
      return redirigirConError(ERROR_CONFIRMACION);
    }
  }
}
