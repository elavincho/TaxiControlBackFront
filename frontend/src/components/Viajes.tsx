/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Viaje, PaymentMethod, FilterRange } from '../src/types';
import { filterByRange, getTodayDateString, getStoredViajes } from '../utils/storage';
import { getViajes, saveViaje, updateViaje, deleteViaje } from '../utils/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  CreditCard, 
  Coins, 
  Search, 
  SlidersHorizontal, 
  X, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

interface ViajesProps {
  userId: string;
  // Sync filter globally if needed
  globalFilterRange: FilterRange;
  setGlobalFilterRange: (range: FilterRange) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Efectivo', 
  'Tarjeta de Débito', 
  'Tarjeta de Crédito', 
  'Mercado Pago', 
  'Transferencia', 
  'App Taxi'
];

export default function Viajes({ userId, globalFilterRange, setGlobalFilterRange }: ViajesProps) {
  const [viajes, setViajes] = useState<Viaje[]>(() => getStoredViajes(userId));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getViajes(userId)
      .then((data) => {
        if (active) {
          setViajes(data);
        }
      })
      .catch(err => console.error("Error loading viajes:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleStorageUpdate = () => {
      getViajes(userId).then((data) => {
        if (active) setViajes(data);
      });
    };
    window.addEventListener('storage-update', handleStorageUpdate);

    return () => {
      active = false;
      window.removeEventListener('storage-update', handleStorageUpdate);
    };
  }, [userId]);
  
  // Modals & States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Viaje | null>(null);
  
  // Form States
  const [fecha, setFecha] = useState('');
  const [formaPago, setFormaPago] = useState<PaymentMethod>('Efectivo');
  const [monto, setMonto] = useState('');
  const [formError, setFormError] = useState('');

  // Local state for additional text search (like amount or method)
  const [searchQuery, setSearchQuery] = useState('');

  const REFERENCE_DATE = getTodayDateString(); // System reference date

  const handleOpenAddModal = () => {
    setEditingTrip(null);
    setFecha(REFERENCE_DATE); // default to current mock date
    setFormaPago('Efectivo');
    setMonto('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trip: Viaje) => {
    setEditingTrip(trip);
    setFecha(trip.fecha);
    setFormaPago(trip.formaPago);
    setMonto(trip.monto.toString());
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteTrip = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este viaje?')) {
      await deleteViaje(id, userId);
      const updated = viajes.filter(v => v.id !== id);
      setViajes(updated);
      window.dispatchEvent(new Event('storage-update'));
    }
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fecha || !formaPago || !monto) {
      setFormError('Por favor, complete todos los campos obligatorios.');
      return;
    }

    const numMonto = parseFloat(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      setFormError('El monto ingresado debe ser un número positivo.');
      return;
    }

    try {
      if (editingTrip) {
        // Edit
        const updatedItem = await updateViaje(editingTrip.id, { fecha, formaPago, monto: numMonto }, userId);
        const updatedViajes = viajes.map(v => v.id === editingTrip.id ? updatedItem : v);
        setViajes(updatedViajes);
      } else {
        // Add
        const newTrip = await saveViaje({ userId, fecha, formaPago, monto: numMonto });
        setViajes([newTrip, ...viajes]);
      }

      setIsModalOpen(false);
      window.dispatchEvent(new Event('storage-update'));
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el viaje.');
    }
  };

  // Filter application
  const filteredViajesByRange = filterByRange<Viaje>(viajes, globalFilterRange, REFERENCE_DATE);
  
  // Optional query text filtering
  const filteredViajes = filteredViajesByRange.filter(v => {
    const q = searchQuery.toLowerCase();
    return (
      v.formaPago.toLowerCase().includes(q) ||
      v.monto.toString().includes(q) ||
      v.fecha.includes(q)
    );
  });

  const totalIncomesFiltered = filteredViajes.reduce((sum, v) => sum + v.monto, 0);

  return (
    <div className="space-y-6 font-sans pb-12" id="viajes-view">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-display uppercase">Registro Diario de Viajes</h2>
          <p className="text-xs text-slate-400 font-bold">Administración y control de viajes del mes en curso.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 py-2.5 px-5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-yellow-400/10 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Nuevo Viaje</span>
        </button>
      </div>

      {/* Global Filter & Local Query Search Panel */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        {/* Filter Selection Chips */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-black block">Filtro Temporal Global</span>
          <div className="flex flex-wrap gap-1.5">
            {(['dia', 'semana', 'mes', 'ano', 'todos'] as FilterRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setGlobalFilterRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                  globalFilterRange === range 
                    ? 'bg-yellow-400 text-slate-950 shadow-sm' 
                    : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {range === 'dia' ? 'Hoy' : range === 'semana' ? 'Esta Semana' : range === 'mes' ? 'Este Mes' : range === 'ano' ? 'Año' : 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {/* Text Search Box */}
        <div className="relative w-full md:w-72">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Buscar por texto</span>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar fecha, pago, monto..."
              className="block w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Summary Stat Board */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between font-mono text-xs">
        <span className="text-slate-400 uppercase font-bold">Resumen de Filtro Activo:</span>
        <div className="flex items-center space-x-4">
          <div className="text-slate-600 font-bold">
            Cantidad: <strong className="text-slate-900">{filteredViajes.length} viajes</strong>
          </div>
          <div className="text-slate-600 font-bold">
            Ingreso Total: <strong className="text-yellow-600">$ {totalIncomesFiltered.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Listing Content */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] font-bold bg-slate-50">
                <th className="py-3 px-4">Fecha del Viaje</th>
                <th className="py-3 px-4">Forma de Pago</th>
                <th className="py-3 px-4 text-right">Monto Recaudado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredViajes.length > 0 ? (
                filteredViajes.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold">{trip.fecha}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-150 text-slate-700 font-bold space-x-1.5">
                        {trip.formaPago === 'Efectivo' ? (
                          <Coins className="h-3 w-3 text-yellow-600" />
                        ) : (
                          <CreditCard className="h-3 w-3 text-yellow-600" />
                        )}
                        <span>{trip.formaPago}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-emerald-600">$ {trip.monto.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(trip)}
                          className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Modificar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrip(trip.id)}
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
                  <td colSpan={4} className="py-12 text-center text-slate-400 italic font-bold">
                    No se encontraron viajes que coincidan con el filtro o búsqueda seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-xl relative text-slate-900">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 font-display">
              <span className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg">
                {editingTrip ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
              <span>{editingTrip ? 'Modificar Registro de Viaje' : 'Registrar Nuevo Viaje'}</span>
            </h3>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTrip} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Fecha del Viaje
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Forma de Pago
                </label>
                <div className="relative">
                  <select
                    value={formaPago}
                    onChange={(e) => setFormaPago(e.target.value as PaymentMethod)}
                    className="block w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 appearance-none cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Monto Cobrado ($)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej: 5400"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 font-mono"
                />
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
                  {editingTrip ? 'Actualizar Viaje' : 'Guardar Viaje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
