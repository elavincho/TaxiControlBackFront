/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, Viaje, GastoCombustible, Mantenimiento, AlertNotification, MonotributoRecord, SeguroRecord } from '../types';
import { 
  calculateSummary, 
  filterByRange, 
  getStoredViajes, 
  getStoredCombustible, 
  getStoredMantenimiento, 
  getStoredAlertas, 
  getStoredMonotributo,
  getStoredSeguro,
  getTodayDateString
} from '../utils/storage';
import {
  getViajes,
  getCombustible,
  getMantenimiento,
  getAlertas,
  saveAlerta,
  updateAlerta,
  getMonotributo,
  getSeguro
} from '../utils/api';
import { 
  DollarSign, 
  TrendingUp, 
  Compass, 
  Wrench, 
  Calendar, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  CheckCircle2, 
  Car, 
  Clock, 
  FileDown, 
  FileSpreadsheet,
  Fuel, 
  Layers, 
  PlusCircle, 
  BellRing,
  Wallet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { motion } from 'motion/react';

interface DashboardProps {
  user: UserProfile;
  onNavigate: (view: string) => void;
  onQuickAction: (action: string) => void;
}

export default function Dashboard({ user, onNavigate, onQuickAction }: DashboardProps) {
  const [activeActivityTab, setActiveActivityTab] = useState<'viajes' | 'combustible' | 'mantenimiento'>('viajes');
  const [exporting, setExporting] = useState(false);

  // Load user data
  const [viajes, setViajes] = useState<Viaje[]>(() => getStoredViajes(user.id));
  const [combustibles, setCombustibles] = useState<GastoCombustible[]>(() => getStoredCombustible(user.id));
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>(() => getStoredMantenimiento(user.id));
  const [alertas, setAlertas] = useState<AlertNotification[]>(() => getStoredAlertas(user.id));
  const [monotributos, setMonotributos] = useState<MonotributoRecord[]>(() => getStoredMonotributo(user.id));
  const [seguros, setSeguros] = useState<SeguroRecord[]>(() => getStoredSeguro(user.id));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      getViajes(user.id),
      getCombustible(user.id),
      getMantenimiento(user.id),
      getAlertas(user.id),
      getMonotributo(user.id),
      getSeguro(user.id)
    ])
      .then(([vList, cList, mList, aList, mtList, sList]) => {
        if (active) {
          setViajes(vList);
          setCombustibles(cList);
          setMantenimientos(mList);
          setAlertas(aList);
          setMonotributos(mtList);
          setSeguros(sList);
        }
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleStorageUpdate = () => {
      Promise.all([
        getViajes(user.id),
        getCombustible(user.id),
        getMantenimiento(user.id),
        getAlertas(user.id),
        getMonotributo(user.id),
        getSeguro(user.id)
      ]).then(([vList, cList, mList, aList, mtList, sList]) => {
        if (active) {
          setViajes(vList);
          setCombustibles(cList);
          setMantenimientos(mList);
          setAlertas(aList);
          setMonotributos(mtList);
          setSeguros(sList);
        }
      });
    };
    window.addEventListener('storage-update', handleStorageUpdate);

    return () => {
      active = false;
      window.removeEventListener('storage-update', handleStorageUpdate);
    };
  }, [user.id]);

  // Reference date: dynamic today's date
  const REFERENCE_DATE = getTodayDateString();

  // Map fechaPago to fecha for compatibility with filterByRange
  const monotributosMapped = monotributos.map(m => ({ ...m, fecha: m.fechaPago }));
  const segurosMapped = seguros.map(s => ({ ...s, fecha: s.fechaPago }));

  // Stats calculations
  // Today's Stats
  const viajesHoy = filterByRange<Viaje>(viajes, 'dia', REFERENCE_DATE);
  const combustibleHoy = filterByRange<GastoCombustible>(combustibles, 'dia', REFERENCE_DATE);
  // No maintenance typically registered in a single day, but calculate just in case
  const mantenimientoHoy = filterByRange<Mantenimiento>(mantenimientos, 'dia', REFERENCE_DATE);
  const statsHoyBase = calculateSummary(viajesHoy, combustibleHoy, mantenimientoHoy);

  const monotributosHoy = filterByRange<MonotributoRecord & { fecha: string }>(monotributosMapped, 'dia', REFERENCE_DATE);
  const segurosHoy = filterByRange<SeguroRecord & { fecha: string }>(segurosMapped, 'dia', REFERENCE_DATE);
  const totalMonotributoHoy = monotributosHoy.reduce((sum, m) => sum + m.importe, 0);
  const totalSeguroHoy = segurosHoy.reduce((sum, s) => sum + s.importe, 0);

  const statsHoy = {
    ...statsHoyBase,
    gastosTotales: statsHoyBase.gastosTotales + totalMonotributoHoy + totalSeguroHoy,
    gananciaNeta: statsHoyBase.ingresosTotales - (statsHoyBase.gastosTotales + totalMonotributoHoy + totalSeguroHoy)
  };

  // Month's Stats
  const viajesMes = filterByRange<Viaje>(viajes, 'mes', REFERENCE_DATE);
  const combustibleMes = filterByRange<GastoCombustible>(combustibles, 'mes', REFERENCE_DATE);
  const mantenimientoMes = filterByRange<Mantenimiento>(mantenimientos, 'mes', REFERENCE_DATE);
  const statsMesBase = calculateSummary(viajesMes, combustibleMes, mantenimientoMes);

  const monotributosMes = filterByRange<MonotributoRecord & { fecha: string }>(monotributosMapped, 'mes', REFERENCE_DATE);
  const segurosMes = filterByRange<SeguroRecord & { fecha: string }>(segurosMapped, 'mes', REFERENCE_DATE);
  const totalMonotributoMes = monotributosMes.reduce((sum, m) => sum + m.importe, 0);
  const totalSeguroMes = segurosMes.reduce((sum, s) => sum + s.importe, 0);

  const statsMes = {
    ...statsMesBase,
    gastosTotales: statsMesBase.gastosTotales + totalMonotributoMes + totalSeguroMes,
    gananciaNeta: statsMesBase.ingresosTotales - (statsMesBase.gastosTotales + totalMonotributoMes + totalSeguroMes)
  };

  // Next Maintenance schedule
  const activeAlerts = [...alertas.filter(a => !a.resuelta)];

  if (user.vtvVencimiento) {
    const isVtvResolved = alertas.some(a => a.tipo === 'vtv' && a.resuelta && a.fechaLimite === user.vtvVencimiento);
    if (!isVtvResolved && !activeAlerts.some(a => a.tipo === 'vtv')) {
      activeAlerts.push({
        id: 'al-vtv-dynamic',
        userId: user.id,
        tipo: 'vtv',
        mensaje: `Vencimiento de la VTV (Verificación Técnica Vehicular)`,
        fechaLimite: user.vtvVencimiento,
        resuelta: false
      });
    }
  }

  const nextMaintenanceAlert = activeAlerts.find(a => a.tipo === 'mantenimiento');
  const nextMaintenanceMsg = nextMaintenanceAlert 
    ? nextMaintenanceAlert.mensaje 
    : 'No hay mantenimientos programados.';

  // --- CHART 1: LAST 30 DAYS INCOMES VS EXPENSES ---
  // Generate past 30 days records
  const generateLast30DaysChartData = () => {
    const data = [];
    const dateObj = new Date(REFERENCE_DATE);
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(dateObj);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.getDate() + '/' + (d.getMonth() + 1);

      // Incomes
      const dayIncomes = viajes
        .filter(v => v.fecha === dateStr)
        .reduce((sum, v) => sum + v.monto, 0);

      // Expenses
      const dayComb = combustibles
        .filter(c => c.fecha === dateStr)
        .reduce((sum, c) => sum + c.importe, 0);
      const dayMaint = mantenimientos
        .filter(m => m.fecha === dateStr)
        .reduce((sum, m) => sum + m.importe, 0);
      const dayMono = monotributos
        .filter(m => m.fechaPago === dateStr)
        .reduce((sum, m) => sum + m.importe, 0);
      const daySeg = seguros
        .filter(s => s.fechaPago === dateStr)
        .reduce((sum, s) => sum + s.importe, 0);

      data.push({
        name: dayLabel,
        Ingresos: dayIncomes,
        Gastos: dayComb + dayMaint + dayMono + daySeg,
      });
    }
    return data;
  };

  const trendData = generateLast30DaysChartData();

  // --- CHART 2: MONTHLY EXPENSES BY CATEGORY ---
  const expensesPieData = [
    { name: 'GNC', value: statsMesBase.gastosGNC },
    { name: 'Nafta', value: statsMesBase.gastosNafta },
    { name: 'Taller', value: statsMesBase.gastosMantenimiento },
    { name: 'Monotributo', value: totalMonotributoMes },
    { name: 'Seguro', value: totalSeguroMes },
  ].filter(item => item.value > 0);

  const getSliceColor = (name: string) => {
    switch (name) {
      case 'GNC': return '#EAB308'; // Bright Yellow
      case 'Nafta': return '#F97316'; // Orange-500
      case 'Taller': return '#0EA5E9'; // Sky-500 (contrasts beautifully with dark backgrounds)
      case 'Monotributo': return '#A855F7'; // Purple-500
      case 'Seguro': return '#EC4899'; // Pink-500
      default: return '#64748b';
    }
  };

  // --- CHART 3: PAYMENT METHODS ---
  const generatePaymentMethodsData = () => {
    const methods: Record<string, number> = {
      'Efectivo': 0,
      'Mercado Pago': 0,
      'Tarjeta de Débito': 0,
      'Tarjeta de Crédito': 0,
      'Transferencia': 0,
      'App Taxi': 0,
    };
    
    viajesMes.forEach(v => {
      if (methods[v.formaPago] !== undefined) {
        methods[v.formaPago] += v.monto;
      }
    });

    return Object.keys(methods).map(key => ({
      name: key,
      Monto: methods[key]
    })).filter(item => item.Monto > 0);
  };

  const paymentData = generatePaymentMethodsData();

  // Recent activity data
  const recentTrips = [...viajes].sort((a,b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
  const recentExpenses = [...combustibles].sort((a,b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
  const recentMaintenance = [...mantenimientos].sort((a,b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);

  const handleResolveAlert = async (id: string) => {
    try {
      // Optimistically update the UI state immediately so it's snappy and robust!
      setAlertas(prevAlertas => prevAlertas.map(a => (a.id === id || (a as any)._id === id) ? { ...a, resuelta: true } : a));

      if (id === 'al-vtv-dynamic') {
        const payload = {
          userId: user.id,
          tipo: 'vtv' as const,
          mensaje: `Vencimiento de la VTV (Verificación Técnica Vehicular)`,
          fechaLimite: user.vtvVencimiento || '',
          resuelta: true
        };
        const newAl = await saveAlerta(payload);
        setAlertas(prevAlertas => prevAlertas.map(a => a.id === 'al-vtv-dynamic' ? { ...newAl, id: newAl.id || (newAl as any)._id } : a));
      } else {
        const found = alertas.find(a => a.id === id || (a as any)._id === id);
        if (found) {
          const updated = await updateAlerta(id, { resuelta: true }, user.id);
          setAlertas(prevAlertas => prevAlertas.map(a => (a.id === id || (a as any)._id === id) ? { ...updated, id: updated.id || (updated as any)._id } : a));
        }
      }
      window.dispatchEvent(new Event('storage-update'));
    } catch (err) {
      console.error("Error resolving alert:", err);
    }
  };

  // Export report to Excel (CSV with UTF-8 BOM)
  const handleExportExcel = () => {
    setExporting(true);
    setTimeout(() => {
      let csvContent = "";
      
      // 1. Resumen Mensual
      csvContent += "=== RESUMEN MENSUAL ===\n";
      csvContent += `Concepto;Monto\n`;
      csvContent += `Ingresos Totales del Mes;$${statsMes.ingresosTotales}\n`;
      csvContent += `Gastos GNC;$${statsMes.gastosGNC}\n`;
      csvContent += `Gastos Nafta;$${statsMes.gastosNafta}\n`;
      csvContent += `Gastos Mantenimiento / Taller;$${statsMes.gastosMantenimiento}\n`;
      csvContent += `Total Gastos;$${statsMes.gastosTotales}\n`;
      csvContent += `Ganancia Neta;$${statsMes.gananciaNeta}\n\n`;

      // 2. Detalle de Viajes
      csvContent += "=== DETALLE DE VIAJES DEL MES ===\n";
      csvContent += "Fecha;Forma de Pago;Monto ($)\n";
      viajesMes.forEach(v => {
        csvContent += `${v.fecha};${v.formaPago};${v.monto}\n`;
      });
      csvContent += "\n";

      // 3. Detalle de Combustible
      csvContent += "=== DETALLE DE CARGAS DE COMBUSTIBLE DEL MES ===\n";
      csvContent += "Fecha;Tipo de Combustible;Importe ($);Notas\n";
      combustibleMes.forEach(c => {
        csvContent += `${c.fecha};${c.tipo};${c.importe};${c.nota || ''}\n`;
      });
      csvContent += "\n";

      // 4. Detalle de Mantenimiento
      csvContent += "=== DETALLE DE MANTENIMIENTO / TALLER DEL MES ===\n";
      csvContent += "Fecha;Detalle;Importe ($);Kilometraje Actual (KM);Taller\n";
      mantenimientoMes.forEach(m => {
        csvContent += `${m.fecha};${m.descripcion};${m.importe};${m.kilometrajeActual};${m.taller || ''}\n`;
      });

      // Add UTF-8 BOM to make Excel read it correctly in Spanish
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Reporte_Taxi_Control_${user.username}_Julio2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(false);
    }, 1000);
  };

  // Export report to PDF
  const handleExportPDF = () => {
    setExporting(true);
    setTimeout(() => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Por favor habilite las ventanas emergentes (popups) para descargar el PDF.");
        setExporting(false);
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte Taxi Control - ${user.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; }
            h1 { font-size: 24px; color: #0f172a; margin-bottom: 5px; font-weight: 800; text-transform: uppercase; border-bottom: 3px solid #facc15; padding-bottom: 10px; }
            h2 { font-size: 14px; color: #475569; margin-top: 0; margin-bottom: 30px; font-weight: bold; }
            h3 { font-size: 16px; color: #0f172a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; font-weight: bold; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-card { background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 15px; border-radius: 12px; }
            .info-card p { margin: 5px 0; font-size: 12px; }
            .info-card strong { color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background-color: #f1f5f9; text-align: left; padding: 8px 10px; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e1; }
            td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            tr:hover { background-color: #f8fafc; }
            .monto { font-weight: bold; text-align: right; }
            .text-right { text-align: right; }
            .kpi-container { display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .kpi-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; text-align: center; }
            .kpi-title { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
            .kpi-value { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 5px; }
            .kpi-value.positive { color: #16a34a; }
            .kpi-value.negative { color: #dc2626; }
            .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Reporte de Finanzas y Actividad</h1>
          <h2>Taxi Control Premium — Resumen de Gestión de Julio 2026</h2>
          
          <div class="info-grid">
            <div class="info-card">
              <p><strong>Usuario:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Usuario:</strong> @${user.username}</p>
              <p><strong>N° de Licencia:</strong> ${user.licenciaTaxi || 'No registrada'}</p>
            </div>
            <div class="info-card">
              <p><strong>Vehículo:</strong> ${user.carBrand || 'No registrado'} ${user.carModel || ''}</p>
              <p><strong>Patente:</strong> ${user.carPlate || 'No registrada'}</p>
              <p><strong>Kilometraje:</strong> ${user.carKilometers ? user.carKilometers.toLocaleString() + ' KM' : '0 KM'}</p>
              <p><strong>Vencimiento VTV:</strong> ${user.vtvVencimiento || 'No registrada'}</p>
            </div>
          </div>

          <div class="kpi-container">
            <div class="kpi-card" style="border-left: 4px solid #16a34a;">
              <div class="kpi-title">Ingresos Totales</div>
              <div class="kpi-value positive">$${statsMes.ingresosTotales.toLocaleString()}</div>
            </div>
            <div class="kpi-card" style="border-left: 4px solid #dc2626;">
              <div class="kpi-title">Gastos Totales</div>
              <div class="kpi-value negative">$${statsMes.gastosTotales.toLocaleString()}</div>
            </div>
            <div class="kpi-card" style="border-left: 4px solid #ca8a04; background-color: #fef9c3;">
              <div class="kpi-title">Ganancia Neta</div>
              <div class="kpi-value" style="color: #ca8a04;">$${statsMes.gananciaNeta.toLocaleString()}</div>
            </div>
          </div>

          <h3>Resumen de Gastos Detallados</h3>
          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th class="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Combustible GNC</td>
                <td class="monto">$${statsMes.gastosGNC.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Combustible Nafta</td>
                <td class="monto">$${statsMes.gastosNafta.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Mantenimiento / Taller</td>
                <td class="monto">$${statsMes.gastosMantenimiento.toLocaleString()}</td>
              </tr>
              <tr style="background-color: #f8fafc; font-weight: bold;">
                <td>Total de Gastos del Mes</td>
                <td class="monto">$${statsMes.gastosTotales.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <h3>Detalle de Viajes (Julio 2026)</h3>
          ${viajesMes.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Forma de Pago</th>
                  <th class="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${viajesMes.map(v => `
                  <tr>
                    <td>${v.fecha}</td>
                    <td>${v.formaPago}</td>
                    <td class="monto">$${v.monto.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="font-size: 12px; color: #64748b; font-style: italic;">No hay viajes registrados este mes.</p>'}

          <div style="page-break-before: always;"></div>

          <h3>Detalle de Combustible (Julio 2026)</h3>
          ${combustibleMes.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Nota</th>
                  <th class="text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                ${combustibleMes.map(c => `
                  <tr>
                    <td>${c.fecha}</td>
                    <td>${c.tipo}</td>
                    <td>${c.nota || ''}</td>
                    <td class="monto">$${c.importe.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="font-size: 12px; color: #64748b; font-style: italic;">No hay cargas de combustible registradas este mes.</p>'}

          <h3>Detalle de Mantenimiento (Julio 2026)</h3>
          ${mantenimientoMes.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Kilometraje Actual</th>
                  <th>Taller</th>
                  <th class="text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                ${mantenimientoMes.map(m => `
                  <tr>
                    <td>${m.fecha}</td>
                    <td>${m.descripcion}</td>
                    <td>${m.kilometrajeActual ? m.kilometrajeActual.toLocaleString() + ' KM' : 'N/A'}</td>
                    <td>${m.taller || ''}</td>
                    <td class="monto">$${m.importe.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="font-size: 12px; color: #64748b; font-style: italic;">No hay mantenimientos registrados este mes.</p>'}

          <div class="footer">
            <p>Reporte generado el 08/07/2026 para el usuario ${user.name} - Taxi Control Premium</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setExporting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12 font-sans" id="dashboard-container">
      {/* 1. Header Profile & Vehicle Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        {/* Background yellow glow */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-yellow-400/5 blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* User welcome */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={"/images/taxista-masculino.webp"} 
                alt={user.name} 
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-slate-50 p-0.5 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold tracking-wider uppercase">¡Hola!</p>
              <h2 className="text-2xl font-black text-slate-900 leading-tight font-display">{user.name}</h2>
              <p className="text-xs text-yellow-600 font-mono mt-0.5 font-bold"> @{user.username}</p>
            </div>
          </div>

          {/* Vehicle summary widget */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-50 border border-slate-200 p-4 rounded-xl gap-4 max-w-xl lg:max-w-none">
            {/* Small vehicle snapshot */}
            <div className="h-16 w-24 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 relative">
              <img 
                src="/images/taxi_logo.png" 
                alt="Taxi" 
                className="w-full h-full object-cover opacity-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              {/*<div className="absolute bottom-1 left-2 text-[9px] font-mono text-yellow-400 font-bold tracking-widest">{user.carPlate}</div>*/}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">VEHÍCULO</span>
                <strong className="text-slate-700">{user.carBrand} {user.carModel}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">AÑO / PATENTE</span>
                <strong className="text-slate-700">{user.carYear} • <span className="text-yellow-600 font-bold">{user.carPlate}</span></strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">KILOMETRAJE</span>
                <strong className="text-slate-700">{user.carKilometers.toLocaleString()} KM</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">ALERTA VTV</span>
                <span className="text-rose-600 font-bold">{user.vtvVencimiento || 'Sin configurar'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="quick-actions">
        <button 
          onClick={() => onQuickAction('registrar_viaje')}
          className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center group transition-all duration-300 hover:border-yellow-500 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="h-10 w-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <PlusCircle className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">Registrar Viaje</span>
        </button>

        <button 
          onClick={() => onQuickAction('registrar_gnc')}
          className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center group transition-all duration-300 hover:border-yellow-500 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="h-10 w-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Fuel className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">Cargar GNC</span>
        </button>

        <button 
          onClick={() => onQuickAction('registrar_nafta')}
          className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center group transition-all duration-300 hover:border-yellow-500 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Fuel className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">Cargar Nafta</span>
        </button>

        <button 
          onClick={() => onQuickAction('registrar_mantenimiento')}
          className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center group transition-all duration-300 hover:border-yellow-500 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="h-10 w-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">Mantenimiento</span>
        </button>

        <button 
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center group transition-all duration-300 hover:border-emerald-500 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">{exporting ? 'Exportando...' : 'Exportar Excel'}</span>
        </button>

        <button 
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center group transition-all duration-300 hover:border-rose-500 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <FileDown className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">{exporting ? 'Exportando...' : 'Exportar PDF'}</span>
        </button>
      </div>

      {/* 3. Alerts Panel (Active Notifications) */}
      {activeAlerts.length > 0 && (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm" id="notifications-panel">
          <div className="flex items-center space-x-2 text-yellow-600 font-black text-sm mb-3 font-display">
            <BellRing className="h-4 w-4 animate-swing text-yellow-500" />
            <span>Notificaciones y Alertas Activas ({activeAlerts.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeAlerts.map(alert => (
              <div 
                key={alert.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 text-xs ${
                  alert.tipo === 'vtv' || alert.tipo === 'seguro' || alert.tipo === 'monotributo'
                    ? 'bg-rose-50 border-rose-100 text-rose-800' 
                    : 'bg-yellow-50 border-yellow-100 text-yellow-800'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                    alert.tipo === 'vtv' || alert.tipo === 'seguro' || alert.tipo === 'monotributo' ? 'text-rose-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <p className="font-bold leading-relaxed">{alert.mensaje}</p>
                    <div className="flex gap-2 font-mono text-[10px] text-slate-500 mt-1">
                      <span>{alert.tipo === 'seguro' || alert.tipo === 'vtv' || alert.tipo === 'monotributo' ? 'Vencimiento' : 'Límite'}: {alert.fechaLimite}</span>
                      {alert.kmLimite && <span>• Km: {alert.kmLimite.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleResolveAlert(alert.id || (alert as any)._id)}
                  className="self-end inline-flex items-center space-x-1 py-1 px-2.5 bg-white hover:bg-slate-50 text-[10px] font-extrabold tracking-wider uppercase rounded-lg border border-slate-200 text-slate-700 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>
                    {alert.tipo === 'monotributo' || alert.tipo === 'seguro' ? 'Pagado' : 'Realizado'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. KPI Scorecards (Today vs Month) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-metrics">
        {/* Card 1: Ingresos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-36 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">INGRESOS</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-display">$ {statsMes.ingresosTotales.toLocaleString()}</div>
            <p className="text-slate-400 text-xs mt-1 font-bold">Este Mes</p>
          </div>
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold">Hoy:</span>
            <span className="text-emerald-600 font-bold flex items-center">
              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
              $ {statsHoy.ingresosTotales.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 2: Gastos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-36 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">GASTOS</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-display">$ {statsMes.gastosTotales.toLocaleString()}</div>
            <p className="text-slate-400 text-xs mt-1 font-bold">Combustible + Taller</p>
          </div>
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold">Hoy GNC/Nafta:</span>
            <span className="text-rose-600 font-bold flex items-center">
              <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
              $ {statsHoy.gastosTotales.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 3: Ganancia Neta */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-36 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono bg-yellow-55 text-yellow-700 px-2 py-0.5 rounded-full font-bold">NETO</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-yellow-600 font-display">$ {statsMes.gananciaNeta.toLocaleString()}</div>
            <p className="text-slate-400 text-xs mt-1 font-bold">Ganancia Real</p>
          </div>
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold">Hoy Neto:</span>
            <span className={`font-bold flex items-center ${statsHoy.gananciaNeta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              $ {statsHoy.gananciaNeta.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 4: Viajes y Próx Mantenimiento */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-36 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">ACTIVIDAD</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-display">{statsMes.cantViajes} <span className="text-xs font-normal text-slate-400">viajes mes</span></div>
            <p className="text-slate-500 text-[10px] truncate font-bold">Taller: <span className="text-yellow-600">{nextMaintenanceMsg}</span></p>
          </div>
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold">Viajes Hoy:</span>
            <span className="text-yellow-600 font-bold">{statsHoy.cantViajes} viajes</span>
          </div>
        </div>
      </div>

      {/* 5. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts">
        {/* Line Chart: Income vs Expenses Last 30 Days (Takes 2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between min-h-[350px] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base font-display">Evolución: Ingresos vs Gastos</h3>
              <p className="text-xs text-slate-400 font-bold">Historial diario de los últimos 30 días</p>
            </div>
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="Ingresos" stroke="#ca8a04" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Gastos" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Column 3: Doughnut Chart (Expenses breakdown) + Payment Method Bar Chart */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Doughnut Chart: Expenses breakdown */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex-1 flex flex-col justify-between shadow-sm">
            <div className="mb-2">
              <h3 className="font-black text-slate-900 text-base font-display">Desglose de Gastos</h3>
              <p className="text-xs text-slate-400 font-bold">Distribución de gastos de este mes</p>
            </div>
            
            {expensesPieData.length > 0 ? (
              <div className="flex items-center justify-center relative py-2">
                <div className="w-full h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expensesPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getSliceColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `$${val?.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Total</span>
                  <span className="text-sm font-black text-slate-900">${statsMes.gastosTotales.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 italic">No hay gastos registrados en el mes.</div>
            )}

            {/* Custom Legend */}
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center pt-2 border-t border-slate-100">
              <div className="flex flex-col items-center">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500 mb-1"></span>
                <span className="text-slate-400">GNC</span>
                <strong className="text-slate-700">${statsMes.gastosGNC.toLocaleString()}</strong>
              </div>
              <div className="flex flex-col items-center">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 mb-1"></span>
                <span className="text-slate-400">Nafta</span>
                <strong className="text-slate-700">${statsMes.gastosNafta.toLocaleString()}</strong>
              </div>
              <div className="flex flex-col items-center">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 mb-1"></span>
                <span className="text-slate-400">Taller</span>
                <strong className="text-slate-700">${statsMes.gastosMantenimiento.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Mini Bar Chart: Payment Methods */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex-1 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="font-black text-slate-900 text-base font-display">Medios de Pago</h3>
              <p className="text-xs text-slate-400 font-bold">Monto ingresado por forma de pago</p>
            </div>
            
            {paymentData.length > 0 ? (
              <div className="w-full h-32 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={80} tickLine={false} />
                    <Tooltip formatter={(val) => `$${val?.toLocaleString()}`} />
                    <Bar dataKey="Monto" fill="#ca8a04" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-xs text-slate-400 italic">No hay cobros registrados.</div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Recent Activity Panels */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm" id="recent-activity-panel">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="font-black text-slate-900 text-base font-display">Registro de Actividad Reciente</h3>
            <p className="text-xs text-slate-400 font-bold">Últimos movimientos cargados en la plataforma</p>
          </div>
          
          {/* Tabs */}
          <div className="inline-flex p-1 bg-slate-50 border border-slate-100 rounded-xl space-x-1 text-xs">
            <button
              onClick={() => setActiveActivityTab('viajes')}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                activeActivityTab === 'viajes' ? 'bg-yellow-400 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Viajes
            </button>
            <button
              onClick={() => setActiveActivityTab('combustible')}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                activeActivityTab === 'combustible' ? 'bg-yellow-400 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Combustibles
            </button>
            <button
              onClick={() => setActiveActivityTab('mantenimiento')}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                activeActivityTab === 'mantenimiento' ? 'bg-yellow-400 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Mantenimientos
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="overflow-x-auto">
          {activeActivityTab === 'viajes' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Método de Pago</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentTrips.length > 0 ? (
                  recentTrips.map(trip => (
                    <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono">{trip.fecha}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center space-x-1 font-semibold">
                          <Wallet className="h-3.5 w-3.5 text-yellow-500" />
                          <span>{trip.formaPago}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black font-mono text-emerald-600">+ $ {trip.monto.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 italic">No hay viajes recientes registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeActivityTab === 'combustible' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Combustible</th>
                  <th className="py-2.5 px-3">Descripción / Estación</th>
                  <th className="py-2.5 px-3 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentExpenses.length > 0 ? (
                  recentExpenses.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono">{item.fecha}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          item.tipo === 'GNC' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 truncate max-w-xs font-medium text-slate-600">{item.nota}</td>
                      <td className="py-2.5 px-3 text-right font-black font-mono text-rose-600">- $ {item.importe.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">No hay cargas recientes de combustible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeActivityTab === 'mantenimiento' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Servicio</th>
                  <th className="py-2.5 px-3">Taller responsable</th>
                  <th className="py-2.5 px-3">Kms Actuales</th>
                  <th className="py-2.5 px-3 text-right">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentMaintenance.length > 0 ? (
                  recentMaintenance.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono">{item.fecha}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{item.tipoMantenimiento}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-medium">{item.taller}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{item.kilometrajeActual.toLocaleString()} KM</td>
                      <td className="py-2.5 px-3 text-right font-black font-mono text-rose-600">- $ {item.importe.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">No hay tareas de mantenimiento registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
