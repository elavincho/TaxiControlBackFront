/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mantenimiento, AlertNotification, UserProfile } from '../src/types';
import { 
  getStoredMantenimiento, 
  getStoredAlertas, 
  getTodayDateString
} from '../utils/storage';
import { 
  getMantenimiento, 
  saveMantenimiento, 
  updateMantenimiento, 
  deleteMantenimiento, 
  getAlertas, 
  saveAlerta, 
  updateUserProfile 
} from '../utils/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Wrench, 
  Calendar, 
  Search, 
  X, 
  AlertTriangle,
  Receipt,
  MapPin,
  Sparkles,
  Layers,
  ChevronDown,
  Clock,
  Gauge
} from 'lucide-react';

interface MantenimientoProps {
  user: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  // Handler to catch dashboard trigger
  initialRegisterActive?: boolean;
  clearInitialRegisterActive?: () => void;
}

const TIPOS_MANTENIMIENTO = [
  'Cambio de Aceite',
  'Frenos',
  'Neumáticos',
  'Amortiguación / Suspensión',
  'Correa de Distribución',
  'Batería / Electricidad',
  'Embrague / Caja',
  'Alineación y Balanceo',
  'Otras Reparaciones'
];

export default function MantenimientoComponent({ 
  user, 
  onUserUpdate,
  initialRegisterActive,
  clearInitialRegisterActive
}: MantenimientoProps) {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>(() => getStoredMantenimiento(user.id));
  const [alertas, setAlertas] = useState<AlertNotification[]>(() => getStoredAlertas(user.id));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    Promise.all([
      getMantenimiento(user.id),
      getAlertas(user.id)
    ])
      .then(([mants, alerts]) => {
        if (active) {
          setMantenimientos(mants);
          setAlertas(alerts);
        }
      })
      .catch(err => console.error("Error loading maintenance & alerts:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleStorageUpdate = () => {
      Promise.all([
        getMantenimiento(user.id),
        getAlertas(user.id)
      ]).then(([mants, alerts]) => {
        if (active) {
          setMantenimientos(mants);
          setAlertas(alerts);
        }
      });
    };
    window.addEventListener('storage-update', handleStorageUpdate);

    return () => {
      active = false;
      window.removeEventListener('storage-update', handleStorageUpdate);
    };
  }, [user.id]);

  // Modals & States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Mantenimiento | null>(null);

  // Form States
  const [fecha, setFecha] = useState('');
  const [tipoMantenimiento, setTipoMantenimiento] = useState(TIPOS_MANTENIMIENTO[0]);
  const [descripcion, setDescripcion] = useState('');
  const [importe, setImporte] = useState('');
  const [kilometrajeActual, setKilometrajeActual] = useState('');
  const [proximoSugeridoKilometraje, setProximoSugeridoKilometraje] = useState('');
  const [proximoSugeridaFecha, setProximoSugeridaFecha] = useState('');
  const [taller, setTaller] = useState('');
  const [nroFactura, setNroFactura] = useState('');
  const [formError, setFormError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const REFERENCE_DATE = getTodayDateString();

  // Listen to dashboard quick shortcuts
  React.useEffect(() => {
    if (initialRegisterActive) {
      setEditingItem(null);
      setFecha(REFERENCE_DATE);
      setTipoMantenimiento(TIPOS_MANTENIMIENTO[0]);
      setDescripcion('');
      setImporte('');
      setKilometrajeActual(user.carKilometers.toString());
      setProximoSugeridoKilometraje((user.carKilometers + 10000).toString());
      setProximoSugeridaFecha('2026-10-08');
      setTaller('');
      setNroFactura('');
      setFormError('');
      setIsModalOpen(true);
      if (clearInitialRegisterActive) clearInitialRegisterActive();
    }
  }, [initialRegisterActive]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFecha(REFERENCE_DATE);
    setTipoMantenimiento(TIPOS_MANTENIMIENTO[0]);
    setDescripcion('');
    setImporte('');
    setKilometrajeActual(user.carKilometers.toString());
    setProximoSugeridoKilometraje((user.carKilometers + 10000).toString());
    setProximoSugeridaFecha('2026-10-08');
    setTaller('');
    setNroFactura('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Mantenimiento) => {
    setEditingItem(item);
    setFecha(item.fecha);
    setTipoMantenimiento(item.tipoMantenimiento);
    setDescripcion(item.descripcion);
    setImporte(item.importe.toString());
    setKilometrajeActual(item.kilometrajeActual.toString());
    setProximoSugeridoKilometraje(item.proximoSugeridoKilometraje.toString());
    setProximoSugeridaFecha(item.proximoSugeridaFecha);
    setTaller(item.taller);
    setNroFactura(item.nroFactura);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta tarea de mantenimiento?')) {
      await deleteMantenimiento(id, user.id);
      const updated = mantenimientos.filter(m => m.id !== id);
      setMantenimientos(updated);
      window.dispatchEvent(new Event('storage-update'));
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fecha || !tipoMantenimiento || !descripcion || !importe || !kilometrajeActual || !taller || !nroFactura) {
      setFormError('Por favor complete todos los campos obligatorios.');
      return;
    }

    const numImporte = parseFloat(importe);
    const numKm = parseInt(kilometrajeActual);
    const numProximoKm = parseInt(proximoSugeridoKilometraje);

    if (isNaN(numImporte) || numImporte <= 0) {
      setFormError('El importe debe ser un número positivo.');
      return;
    }
    if (isNaN(numKm) || numKm <= 0) {
      setFormError('El kilometraje actual debe ser un número positivo.');
      return;
    }

    const nextKm = isNaN(numProximoKm) ? numKm + 10000 : numProximoKm;
    const nextDate = proximoSugeridaFecha || '2026-12-31';

    const payload = {
      userId: user.id,
      fecha,
      tipoMantenimiento,
      descripcion,
      importe: numImporte,
      kilometrajeActual: numKm,
      proximoSugeridoKilometraje: nextKm,
      proximoSugeridaFecha: nextDate,
      taller,
      nroFactura
    };

    try {
      let savedItem: Mantenimiento;
      if (editingItem) {
        savedItem = await updateMantenimiento(editingItem.id, payload, user.id);
        setMantenimientos(mantenimientos.map(m => m.id === editingItem.id ? savedItem : m));
      } else {
        savedItem = await saveMantenimiento(payload);
        setMantenimientos([savedItem, ...mantenimientos]);
      }

      // 2. Automatically sync user's car mileage with the newly registered maintenance if higher
      if (numKm > user.carKilometers) {
        const updatedUser = await updateUserProfile(user.id, { carKilometers: numKm });
        onUserUpdate(updatedUser);
      }

      // 3. Automatically generate a notification/reminder for this upcoming maintenance
      const currentAlerts = await getAlertas(user.id);

      // Remove existing alert for this type if any, and add updated one
      const existingAlert = currentAlerts.find(a => a.tipo === 'mantenimiento' && a.mensaje.includes(tipoMantenimiento));
      if (existingAlert) {
        // delete it from backend
        await fetch(`/api/alertas/${existingAlert.id}`, { method: 'DELETE' });
      }

      const newAlert = await saveAlerta({
        userId: user.id,
        tipo: 'mantenimiento',
        mensaje: `Sugerido: Próximo ${tipoMantenimiento} a los ${nextKm.toLocaleString()} KM (${nextDate})`,
        fechaLimite: nextDate,
        kmLimite: nextKm,
        resuelta: false
      });

      setAlertas([newAlert, ...currentAlerts.filter(a => a.id !== existingAlert?.id)]);
      setIsModalOpen(false);
      window.dispatchEvent(new Event('storage-update'));
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el mantenimiento.');
    }
  };

  // Stats Calculations
  const totalMantenimiento = mantenimientos.reduce((sum, m) => sum + m.importe, 0);

  // Breakdown by type
  const breakdownData = TIPOS_MANTENIMIENTO.map(tipo => {
    const total = mantenimientos.filter(m => m.tipoMantenimiento === tipo).reduce((sum, m) => sum + m.importe, 0);
    return { tipo, total };
  }).filter(b => b.total > 0).sort((a,b) => b.total - a.total);

  // Text search
  const filteredMants = mantsToDisplay();
  
  function mantsToDisplay() {
    return mantenimientos.filter(m => {
      const q = searchQuery.toLowerCase();
      return (
        m.tipoMantenimiento.toLowerCase().includes(q) ||
        m.descripcion.toLowerCase().includes(q) ||
        m.taller.toLowerCase().includes(q) ||
        m.nroFactura.toLowerCase().includes(q) ||
        m.fecha.includes(q)
      );
    });
  }

  // Active future tasks / reminders
  const activeReminders = alertas.filter(a => !a.resuelta && a.tipo === 'mantenimiento');

  return (
    <div className="space-y-6 font-sans pb-12" id="maintenance-view">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-display uppercase">Mantenimiento del Vehículo</h2>
          <p className="text-xs text-slate-400 font-bold">Planifica, registra y audita todas las tareas preventivas y correctivas de tu taxi.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 py-2.5 px-5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-yellow-400/10 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Mantenimiento</span>
        </button>
      </div>

      {/* Stats Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI: Total Cost */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Gasto Acumulado</span>
            <h4 className="text-3xl font-black text-slate-900">$ {totalMantenimiento.toLocaleString()}</h4>
            <p className="text-xs text-slate-400 font-bold mt-1">Inversión total en talleres y repuestos</p>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Tareas Realizadas:</span>
            <strong className="text-slate-900">{mantenimientos.length} servicios</strong>
          </div>
        </div>

        {/* Breakdown of Categories (Visual Bars) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl md:col-span-2 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-2">Desglose de Gastos por Tipo</span>
          {breakdownData.length > 0 ? (
            <div className="space-y-3">
              {breakdownData.slice(0, 4).map(item => {
                const percent = Math.round((item.total / totalMantenimiento) * 100);
                return (
                  <div key={item.tipo} className="text-xs">
                    <div className="flex justify-between text-slate-600 font-bold mb-1">
                      <span>{item.tipo}</span>
                      <span className="text-yellow-600">${item.total.toLocaleString()} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-yellow-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-slate-400 italic font-bold">No hay mantenimiento registrado para desglosar.</div>
          )}
        </div>
      </div>

      {/* Alerts and Reminders Alerts Block */}
      {activeReminders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-yellow-700 text-xs font-black uppercase tracking-wider mb-2">
            <Clock className="h-4 w-4" />
            <span>Alertas de Próximo Vencimiento Preventivo</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {activeReminders.map(rem => (
              <div key={rem.id} className="p-3 bg-white border border-yellow-200 rounded-lg flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-slate-950 font-bold">{rem.mensaje}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Fecha Est: {rem.fechaLimite}</p>
                </div>
                {rem.kmLimite && rem.kmLimite <= user.carKilometers + 1000 && (
                  <span className="inline-flex px-2 py-0.5 rounded text-[9px] bg-rose-50 text-rose-600 border border-rose-200 animate-pulse font-bold">VENCIMIENTO CERCANO</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table List with Search */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-1 shadow-sm">
        {/* Table Search bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <span className="text-xs font-mono font-bold text-slate-500">Historial Técnico del Vehículo</span>
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar servicio, taller, factura..."
              className="block w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] font-bold bg-slate-50">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Servicio</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Km Actual</th>
                <th className="py-3 px-4">Taller / Comprobante</th>
                <th className="py-3 px-4 text-right">Costo</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMants.length > 0 ? (
                filteredMants.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold">{item.fecha}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="flex items-center space-x-1.5">
                        <Wrench className="h-3.5 w-3.5 text-yellow-600" />
                        <span>{item.tipoMantenimiento}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500 font-medium" title={item.descripcion}>{item.descripcion}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{item.kilometrajeActual.toLocaleString()} KM</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="text-slate-800 font-bold">{item.taller}</div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Receipt className="h-2.5 w-2.5 shrink-0" />
                        <span>{item.nroFactura}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-rose-600">$ {item.importe.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                          title="Modificar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic font-bold">No hay registros de taller que coincidan con la búsqueda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-xl relative overflow-y-auto max-h-[90vh] text-slate-900">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 font-display">
              <span className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg">
                <Wrench className="h-4 w-4" />
              </span>
              <span>{editingItem ? 'Modificar Registro de Mantenimiento' : 'Registrar Nuevo Mantenimiento'}</span>
            </h3>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Fecha del Trabajo
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                  />
                </div>

                {/* Maintenance Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tipo de Servicio
                  </label>
                  <div className="relative">
                    <select
                      value={tipoMantenimiento}
                      onChange={(e) => setTipoMantenimiento(e.target.value)}
                      className="block w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 appearance-none cursor-pointer"
                    >
                      {TIPOS_MANTENIMIENTO.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Import/Cost */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Importe o Costo ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={importe}
                    onChange={(e) => setImporte(e.target.value)}
                    placeholder="Ej: 38000"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 font-mono"
                  />
                </div>

                {/* Current car odometer */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Kilometraje de Registro
                  </label>
                  <input
                    type="number"
                    required
                    value={kilometrajeActual}
                    onChange={(e) => setKilometrajeActual(e.target.value)}
                    placeholder="Ej: 144800"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 font-mono"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Descripción Detallada de Tareas / Repuestos Cambiados
                </label>
                <textarea
                  required
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Se cambiaron bujías, cables, aceite Elaion 5W40, filtro de aceite y filtro de GNC de alta presión..."
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mechanic workshop name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Taller o Mecánico Responsable
                  </label>
                  <input
                    type="text"
                    required
                    value={taller}
                    onChange={(e) => setTaller(e.target.value)}
                    placeholder="Ej: Lubricentro Warnes Express"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                  />
                </div>

                {/* Invoice or ticket number */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nº de Factura o Ticket
                  </label>
                  <input
                    type="text"
                    required
                    value={nroFactura}
                    onChange={(e) => setNroFactura(e.target.value)}
                    placeholder="Ej: A-0004-9842"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 font-mono"
                  />
                </div>
              </div>

              {/* Suggestions / Future schedules */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center space-x-1 font-bold text-slate-600">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-600" />
                  <span>Programación del Próximo Mantenimiento (Preventivo)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Próximo Kilometraje Sugerido</label>
                    <input
                      type="number"
                      value={proximoSugeridoKilometraje}
                      onChange={(e) => setProximoSugeridoKilometraje(e.target.value)}
                      placeholder="Ej: 154800"
                      className="block w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-yellow-400 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Fecha Próximo Servicio (Est.)</label>
                    <input
                      type="date"
                      value={proximoSugeridaFecha}
                      onChange={(e) => setProximoSugeridaFecha(e.target.value)}
                      className="block w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-yellow-400 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-yellow-400 text-slate-950 rounded-xl hover:bg-yellow-500 transition-colors cursor-pointer"
                >
                  {editingItem ? 'Actualizar Ficha' : 'Guardar Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
