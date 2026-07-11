/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  passwordHash: string; // Stored securely
  carBrand: string;
  carModel: string;
  carYear: number;
  carPlate: string;
  carKilometers: number;
  verified: boolean;
  avatarUrl?: string;
  licenciaTaxi?: string;
  vtvVencimiento?: string;
}

export type PaymentMethod = 
  | 'Efectivo' 
  | 'Tarjeta de Débito' 
  | 'Tarjeta de Crédito' 
  | 'Mercado Pago' 
  | 'Transferencia' 
  | 'App Taxi';

export interface Viaje {
  id: string;
  userId: string;
  fecha: string; // YYYY-MM-DD
  formaPago: PaymentMethod;
  monto: number;
}

export interface GastoCombustible {
  id: string;
  userId: string;
  fecha: string; // YYYY-MM-DD
  importe: number;
  nota: string;
  tipo: 'GNC' | 'Nafta';
}

export interface Mantenimiento {
  id: string;
  userId: string;
  fecha: string; // YYYY-MM-DD
  tipoMantenimiento: string; // Ej: 'Cambio de Aceite', 'Frenos', 'Neumáticos', etc.
  descripcion: string;
  importe: number;
  kilometrajeActual: number;
  proximoSugeridoKilometraje: number;
  proximoSugeridaFecha: string; // YYYY-MM-DD
  taller: string;
  nroFactura: string;
}

export interface MonotributoRecord {
  id: string;
  userId: string;
  fechaPago: string; // YYYY-MM-DD
  importe: number;
  categoria: string;
  fechaVencimiento: string; // YYYY-MM-DD
}

export interface SeguroRecord {
  id: string;
  userId: string;
  fechaPago: string; // YYYY-MM-DD
  importe: number;
  fechaVencimiento: string; // YYYY-MM-DD
  aseguradora?: string;
}

export interface AlertNotification {
  id: string;
  userId: string;
  tipo: 'mantenimiento' | 'seguro' | 'vtv' | 'otro' | 'monotributo';
  mensaje: string;
  fechaLimite: string; // YYYY-MM-DD
  kmLimite?: number;
  resuelta: boolean;
}

export type FilterRange = 'dia' | 'semana' | 'mes' | 'ano' | 'todos';

export interface GlobalFilter {
  range: FilterRange;
  customDate?: string; // Specific date for 'dia'
}
