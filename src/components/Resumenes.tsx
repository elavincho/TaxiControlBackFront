/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getStoredViajes, getStoredCombustible, getStoredMantenimiento, getStoredMonotributo, getStoredSeguro, calculateSummary, filterByRange, getTodayDateString } from '../utils/storage';
import { Viaje, GastoCombustible, Mantenimiento, MonotributoRecord, SeguroRecord } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  Wrench, 
  Calendar, 
  Fuel, 
  ChevronRight, 
  Gauge, 
  Compass, 
  Activity,
  ArrowRight
} from 'lucide-react';

interface ResumenesProps {
  userId: string;
}

export default function Resumenes({ userId }: ResumenesProps) {
  const REFERENCE_DATE = getTodayDateString();
  const [selectedDailyDate, setSelectedDailyDate] = useState(REFERENCE_DATE);

  // Load all user data
  const viajes = getStoredViajes(userId);
  const combustibles = getStoredCombustible(userId);
  const mantenimientos = getStoredMantenimiento(userId);
  const monotributos = getStoredMonotributo(userId);
  const seguros = getStoredSeguro(userId);

  // Map fechaPago to fecha for compatibility with filterByRange
  const monotributosMapped = monotributos.map(m => ({ ...m, fecha: m.fechaPago }));
  const segurosMapped = seguros.map(s => ({ ...s, fecha: s.fechaPago }));

  // --- MONTHLY SUMMARY (Current Month: July 2026) ---
  const viajesMes = filterByRange<Viaje>(viajes, 'mes', REFERENCE_DATE);
  const combustiblesMes = filterByRange<GastoCombustible>(combustibles, 'mes', REFERENCE_DATE);
  const mantenimientosMes = filterByRange<Mantenimiento>(mantenimientos, 'mes', REFERENCE_DATE);
  const monotributosMes = filterByRange<MonotributoRecord & { fecha: string }>(monotributosMapped, 'mes', REFERENCE_DATE);
  const segurosMes = filterByRange<SeguroRecord & { fecha: string }>(segurosMapped, 'mes', REFERENCE_DATE);

  const monthlyStats = calculateSummary(viajesMes, combustiblesMes, mantenimientosMes);
  const totalMonotributoMes = monotributosMes.reduce((sum, m) => sum + m.importe, 0);
  const totalSeguroMes = segurosMes.reduce((sum, s) => sum + s.importe, 0);
  const totalGastosMesFinal = monthlyStats.gastosTotales + totalMonotributoMes + totalSeguroMes;
  const gananciaNetaMesFinal = monthlyStats.ingresosTotales - totalGastosMesFinal;

  // --- SELECTED DAY SUMMARY ---
  // We filter by selected date
  const viajesDia = viajes.filter(v => v.fecha === selectedDailyDate);
  const combustiblesDia = combustibles.filter(c => c.fecha === selectedDailyDate);
  const mantenimientosDia = mantenimientos.filter(m => m.fecha === selectedDailyDate);
  const monotributosDia = monotributos.filter(m => m.fechaPago === selectedDailyDate);
  const segurosDia = seguros.filter(s => s.fechaPago === selectedDailyDate);

  const dailyStats = calculateSummary(viajesDia, combustiblesDia, mantenimientosDia);
  const totalMonotributoDia = monotributosDia.reduce((sum, m) => sum + m.importe, 0);
  const totalSeguroDia = segurosDia.reduce((sum, s) => sum + s.importe, 0);
  const totalGastosDiaFinal = dailyStats.gastosTotales + totalMonotributoDia + totalSeguroDia;
  const gananciaNetaDiaFinal = dailyStats.ingresosTotales - totalGastosDiaFinal;

  return (
    <div className="space-y-8 font-sans pb-12" id="resumenes-view">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900 font-display uppercase">Auditoría Financiera Integral</h2>
        <p className="text-xs text-slate-400 font-bold">Resúmenes estadísticos detallados de tu actividad diaria y mensual.</p>
      </div>

      {/* SECTION 1: RESUMEN MENSUAL */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-black text-slate-900 font-display uppercase">Resumen Mensual <span className="text-slate-400 font-mono text-sm">({new Date(REFERENCE_DATE).toLocaleString('es-ES', { month: 'long', year: 'numeric' })})</span></h3>
        </div>

        {/* 3x3 Grid of stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ingresos Mensuales */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-2">Ingresos Mensuales</span>
            <div>
              <h4 className="text-2xl font-black text-emerald-600">$ {monthlyStats.ingresosTotales.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Suma total recaudada en viajes</p>
            </div>
          </div>

          {/* Gasto GNC Mensual */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-2">Gasto GNC Mensual</span>
            <div>
              <h4 className="text-2xl font-black text-yellow-600">$ {monthlyStats.gastosGNC.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Cargas de GNC realizadas</p>
            </div>
          </div>

          {/* Gasto Nafta Mensual */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-2">Gasto Nafta Mensual</span>
            <div>
              <h4 className="text-2xl font-black text-orange-600">$ {monthlyStats.gastosNafta.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Combustible líquido alternativo</p>
            </div>
          </div>

          {/* Gasto Monotributo Mensual */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-2">Monotributo Mensual</span>
            <div>
              <h4 className="text-2xl font-black text-purple-600">$ {totalMonotributoMes.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Impuesto monotributo pagado</p>
            </div>
          </div>

          {/* Gasto Seguro Mensual */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-2">Seguro Mensual</span>
            <div>
              <h4 className="text-2xl font-black text-pink-600">$ {totalSeguroMes.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Seguro de taxi pagado</p>
            </div>
          </div>

          {/* Total Gastos Mensuales */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between border-l-4 border-l-rose-500 shadow-sm">
            <span className="text-[10px] font-mono text-rose-500 uppercase font-black block mb-2">Total de Gastos</span>
            <div>
              <h4 className="text-2xl font-black text-rose-600">$ {totalGastosMesFinal.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Combustibles + Taller + Monotributo + Seguro</p>
            </div>
          </div>

          {/* Ganancia Neta Mensual */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between border-l-4 border-l-yellow-400 shadow-sm">
            <span className="text-[10px] font-mono text-yellow-600 uppercase font-black block mb-2">Ganancia Neta Mensual</span>
            <div>
              <h4 className="text-2xl font-black text-slate-900">$ {gananciaNetaMesFinal.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Tu beneficio limpio después de gastos</p>
            </div>
          </div>

          {/* Cantidad de Viajes Realizados */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-2">Viajes Completados</span>
            <div>
              <h4 className="text-2xl font-black text-slate-900">{monthlyStats.cantViajes} <span className="text-xs font-bold text-slate-400">viajes</span></h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Pasajeros trasladados en el mes</p>
            </div>
          </div>

          {/* Cargas GNC y Nafta */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-2">Cargas Realizadas</span>
            <div>
              <h4 className="text-xl font-black text-slate-900">
                GNC: {monthlyStats.cantCargasGNC} <span className="text-slate-300 font-black">•</span> Nafta: {monthlyStats.cantCargasNafta}
              </h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Cantidad de visitas al surtidor</p>
            </div>
          </div>

          {/* Promedio Viajes Realizados */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-2">Ingreso Promedio</span>
            <div>
              <h4 className="text-2xl font-black text-yellow-600">$ {Math.round(monthlyStats.promedioViaje).toLocaleString()}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Ingreso estimado por viaje individual</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: RESUMEN DIARIO */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-black text-slate-900 font-display uppercase">Auditoría Diaria Interactiva</h3>
          </div>
          
          {/* Date Selector to audit any day */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-mono font-bold">Seleccione fecha de auditoría:</span>
            <input
              type="date"
              value={selectedDailyDate}
              onChange={(e) => setSelectedDailyDate(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-yellow-400 font-mono shadow-sm"
            />
          </div>
        </div>

        {/* Daily Stats Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-mono">Informe para la fecha: {selectedDailyDate}</h4>
              <p className="text-xs text-slate-400 font-bold">Cálculos automáticos en tiempo real basados en tus cargas</p>
            </div>
            <div className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
              dailyStats.gananciaNeta >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {dailyStats.gananciaNeta >= 0 ? 'Superávit diario' : 'Déficit diario'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1: Ingreso total */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-black block">Ingreso Total Diario</span>
              <div className="text-2xl font-black text-emerald-600">$ {dailyStats.ingresosTotales.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">({viajesDia.length} viajes realizados)</div>
            </div>

            {/* KPI 2: Gastos GNC */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-black block">Gasto GNC Diario</span>
              <div className="text-2xl font-black text-yellow-600">$ {dailyStats.gastosGNC.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                ({combustiblesDia.filter(c => c.tipo === 'GNC').length} cargas registradas)
              </div>
            </div>

            {/* KPI 3: Gastos Nafta */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-black block">Gasto Nafta Diario</span>
              <div className="text-2xl font-black text-orange-600">$ {dailyStats.gastosNafta.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                ({combustiblesDia.filter(c => c.tipo === 'Nafta').length} cargas registradas)
              </div>
            </div>

            {/* KPI 4: Total Gastos */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-black block">Total de Gastos Diario</span>
              <div className="text-2xl font-black text-rose-600">$ {totalGastosDiaFinal.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                (Combustibles + Talleres + Monotributo + Seguro)
              </div>
            </div>
          </div>

          {/* Highlighted Net Result Row */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl gap-4">
            <div className="flex items-center space-x-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                gananciaNetaDiaFinal >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-black block">Ganancia Neta Limpia (Día)</span>
                <span className="text-xs text-slate-500 font-bold">Total ingresos menos total gastos diarios</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-3xl font-black font-mono ${
                gananciaNetaDiaFinal >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                $ {gananciaNetaDiaFinal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
