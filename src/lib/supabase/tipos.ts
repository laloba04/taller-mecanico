// Tipos escritos a mano a partir de supabase/migrations/20261124000000_esquema_inicial.sql.
// Si cambia el esquema, actualizar también este archivo.

export type EstadoOrden = "recibido" | "en_reparacion" | "listo" | "entregado";
export type TipoLinea = "pieza" | "mano_obra";

export type ClienteRow = {
  id: string;
  user_id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  created_at: string;
};

export type ClienteInsert = {
  id?: string;
  user_id?: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  created_at?: string;
};

export type VehiculoRow = {
  id: string;
  user_id: string;
  cliente_id: string;
  matricula: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  kilometros: number | null;
  created_at: string;
};

export type VehiculoInsert = {
  id?: string;
  user_id?: string;
  cliente_id: string;
  matricula: string;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
  kilometros?: number | null;
  created_at?: string;
};

export type OrdenRow = {
  id: string;
  user_id: string;
  vehiculo_id: string;
  estado: EstadoOrden;
  descripcion: string | null;
  iva_porcentaje: number;
  fecha_entrada: string;
  fecha_entrega: string | null;
  created_at: string;
  updated_at: string;
};

export type OrdenInsert = {
  id?: string;
  user_id?: string;
  vehiculo_id: string;
  estado?: EstadoOrden;
  descripcion?: string | null;
  iva_porcentaje?: number;
  fecha_entrada?: string;
  fecha_entrega?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type LineaOrdenRow = {
  id: string;
  user_id: string;
  orden_id: string;
  tipo: TipoLinea;
  descripcion: string;
  /** numeric(10,2): PostgREST lo devuelve como número. */
  cantidad: number;
  precio_unitario_centimos: number;
  created_at: string;
};

export type LineaOrdenInsert = {
  id?: string;
  user_id?: string;
  orden_id: string;
  tipo: TipoLinea;
  descripcion: string;
  cantidad: number;
  precio_unitario_centimos: number;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: ClienteRow;
        Insert: ClienteInsert;
        Update: Partial<ClienteInsert>;
        Relationships: [];
      };
      vehiculos: {
        Row: VehiculoRow;
        Insert: VehiculoInsert;
        Update: Partial<VehiculoInsert>;
        Relationships: [
          {
            foreignKeyName: "vehiculos_cliente_fkey";
            columns: ["cliente_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      ordenes: {
        Row: OrdenRow;
        Insert: OrdenInsert;
        Update: Partial<OrdenInsert>;
        Relationships: [
          {
            foreignKeyName: "ordenes_vehiculo_fkey";
            columns: ["vehiculo_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "vehiculos";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      lineas_orden: {
        Row: LineaOrdenRow;
        Insert: LineaOrdenInsert;
        Update: Partial<LineaOrdenInsert>;
        Relationships: [
          {
            foreignKeyName: "lineas_orden_orden_fkey";
            columns: ["orden_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "ordenes";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
