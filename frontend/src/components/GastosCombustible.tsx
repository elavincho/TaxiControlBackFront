/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GastoCombustible, FilterRange } from '../src/types';
import { filterByRange, getTodayDateString, getStoredCombustible } from '../utils/storage';
import { getCombustible, saveCombustible, updateCombustible, deleteCombustible } from '../utils/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  Fuel, 
  Search, 
  X, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

interface GastosCombustibleProps {
  userId: string;
  globalFilterRange: FilterRange;
  setGlobalFilterRange: (range: FilterRange) => void;
  // Hook to automatically open the form from dashboard quick action
  initialTypeToRegister?: 'GNC' | 'Nafta' | null;
  clearInitialTypeToRegister?: () => void;
}

export default function GastosCombustible({ 
  userId, 
  globalFilterRange, 
  setGlobalFilterRange,
  initialTypeToRegister,
  clearInitialTypeToRegister
}: GastosCombustibleProps) {
  const [combustibles, setCombustibles] = useState<GastoCombustible[]>(() => getStoredCombustible(userId));
  const [activeTab, setActiveTab] = useState<'GNC' | 'Nafta'>('GNC');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCombustible(userId)
      .then((data) => {
        if (active) {
          setCombustibles(data);
        }
      })
      .catch(err => console.error("Error loading combustible:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleStorageUpdate = () => {
      getCombustible(userId).then((data) => {
        if (active) setCombustibles(data);
      });
    };
    window.addEventListener('storage-update', handleStorageUpdate);

    return () => {
      active = false;
      window.removeEventListener('storage-update', handleStorageUpdate);
    };
  }, [userId]);

  // Modals & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GastoCombustible | null>(null);

  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState<'GNC' | 'Nafta'>('GNC');
  const [importe, setImporte] = useState('');
  const [nota, setNota] = useState('');
  const [formError, setFormError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const REFERENCE_DATE = getTodayDateString();

  // Listen to quick actions from Dashboard
  React.useEffect(() => {
    if (initialTypeToRegister) {
      setEditingItem(null);
      setFecha(REFERENCE_DATE);
      setTipo(initialTypeToRegister);
      setImporte('');
      setNota('');
      setFormError('');
      setIsModalOpen(true);
      setActiveTab(initialTypeToRegister);
      if (clearInitialTypeToRegister) clearInitialTypeToRegister();
    }
  }, [initialTypeToRegister]);

  const handleOpenAddModal = (defaultTipo: 'GNC' | 'Nafta') => {
    setEditingItem(null);
    setFecha(REFERENCE_DATE);
    setTipo(defaultTipo);
    setImporte('');
    setNota('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: GastoCombustible) => {
    setEditingItem(item);
    setFecha(item.fecha);
    setTipo(item.tipo);
    setImporte(item.importe.toString());
    setNota(item.nota);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro de carga de combustible?')) {
      await deleteCombustible(id, userId);
      const updated = combustibles.filter(c => c.id !== id);
      setCombustibles(updated);
      window.dispatchEvent(new Event('storage-update'));
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fecha || !tipo || !importe || !nota) {
      setFormError('Por favor, complete todos los campos obligatorios.');
      return;
    }

    const numImporte = parseFloat(importe);
    if (isNaN(numImporte) || numImporte <= 0) {
      setFormError('El importe debe ser un número positivo.');
      return;
    }

    try {
      if (editingItem) {
        // Edit
        const updatedItem = await updateCombustible(editingItem.id, { fecha, tipo, importe: numImporte, nota }, userId);
        const updatedList = combustibles.map(c => c.id === editingItem.id ? updatedItem : c);
        setCombustibles(updatedList);
      } else {
        // Add
        const newItem = await saveCombustible({ userId, fecha, tipo, importe: numImporte, nota });
        setCombustibles([newItem, ...combustibles]);
      }

      setIsModalOpen(false);
      setActiveTab(tipo); // switch active view tab to match added item
      window.dispatchEvent(new Event('storage-update'));
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el gasto de combustible.');
    }
  };

  // Filter application
  const filteredCombByRange = filterByRange<GastoCombustible>(combustibles, globalFilterRange, REFERENCE_DATE);

  // Separate GNC vs Nafta
  const gncItems = filteredCombByRange.filter(c => c.tipo === 'GNC');
  const naftaItems = filteredCombByRange.filter(c => c.tipo === 'Nafta');

  // Query search filter
  const applySearch = (items: GastoCombustible[]) => {
    return items.filter(item => {
      const q = searchQuery.toLowerCase();
      return (
        item.fecha.includes(q) ||
        item.nota.toLowerCase().includes(q) ||
        item.importe.toString().includes(q)
      );
    });
  };

  const finalGncItems = applySearch(gncItems);
  const finalNaftaItems = applySearch(naftaItems);

  // Totals
  const totalGnc = finalGncItems.reduce((sum, item) => sum + item.importe, 0);
  const totalNafta = finalNaftaItems.reduce((sum, item) => sum + item.importe, 0);

  return (
    <div className="space-y-6 font-sans pb-12" id="combustibles-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-display uppercase">Gastos de Combustible</h2>
          <p className="text-xs text-slate-400 font-bold">Administra las cargas de GNC y Nafta realizadas en tu taxi.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleOpenAddModal('GNC')}
            className="flex items-center justify-center space-x-1.5 py-2 px-4 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-yellow-400/10 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Cargar GNC</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('Nafta')}
            className="flex items-center justify-center space-x-1.5 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Cargar Nafta</span>
          </button>
        </div>
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
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-900'
                }`}
              >
                {range === 'dia' ? 'Hoy' : range === 'semana' ? 'Semana' : range === 'mes' ? 'Este Mes' : range === 'ano' ? 'Año' : 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {/* Text Search Box */}
        <div className="relative w-full md:w-72">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Buscar por nota / importe</span>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en combustible..."
              className="block w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Fuel Type Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('GNC')}
          className={`px-6 py-3 font-black text-sm tracking-wide border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'GNC' 
              ? 'border-yellow-500 text-yellow-600 bg-slate-50/55' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Fuel className="h-4 w-4" />
          <span>Gastos de GNC</span>
          <span className="ml-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
            {finalGncItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Nafta')}
          className={`px-6 py-3 font-black text-sm tracking-wide border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'Nafta' 
              ? 'border-orange-500 text-orange-600 bg-slate-50/55' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Fuel className="h-4 w-4" />
          <span>Gastos de Nafta</span>
          <span className="ml-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
            {finalNaftaItems.length}
          </span>
        </button>
      </div>

      {/* Tab Contents: GNC vs Nafta */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-1 shadow-sm">
        {activeTab === 'GNC' ? (
          <div>
            {/* GNC Stats summary */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center text-xs font-mono text-slate-500 font-bold">
              <span>Listado de Cargas GNC del mes</span>
              <div>
                Total Gasto GNC: <strong className="text-yellow-600">$ {totalGnc.toLocaleString()}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px] font-bold bg-slate-50/50">
                    <th className="py-3 px-4">Fecha Carga</th>
                    <th className="py-3 px-4">Descripción / Estación</th>
                    <th className="py-3 px-4 text-right">Importe Cobrado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {finalGncItems.length > 0 ? (
                    finalGncItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold">{item.fecha}</td>
                        <td className="py-3 px-4 truncate max-w-sm text-slate-500 font-medium">{item.nota}</td>
                        <td className="py-3 px-4 text-right font-black font-mono text-rose-600">$ {item.importe.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center space-x-2">
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
                      <td colSpan={4} className="py-12 text-center text-slate-400 italic font-bold">No hay registros de GNC para este período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            {/* Nafta Stats summary */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center text-xs font-mono text-slate-500 font-bold">
              <span>Listado de Cargas Nafta del mes</span>
              <div>
                Total Gasto Nafta: <strong className="text-orange-600">$ {totalNafta.toLocaleString()}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px] font-bold bg-slate-50/50">
                    <th className="py-3 px-4">Fecha Carga</th>
                    <th className="py-3 px-4">Descripción / Estación</th>
                    <th className="py-3 px-4 text-right">Importe Cobrado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {finalNaftaItems.length > 0 ? (
                    finalNaftaItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold">{item.fecha}</td>
                        <td className="py-3 px-4 truncate max-w-sm text-slate-500 font-medium">{item.nota}</td>
                        <td className="py-3 px-4 text-right font-black font-mono text-rose-600">$ {item.importe.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center space-x-2">
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
                      <td colSpan={4} className="py-12 text-center text-slate-400 italic font-bold">No hay registros de Nafta para este período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Fuel Form Modal */}
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
              <span className={`p-1.5 rounded-lg ${tipo === 'GNC' ? 'bg-yellow-50 text-yellow-600' : 'bg-orange-50 text-orange-600'}`}>
                <Fuel className="h-4 w-4" />
              </span>
              <span>{editingItem ? 'Modificar Gasto de Combustible' : 'Registrar Carga de Combustible'}</span>
            </h3>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tipo de Combustible
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTipo('GNC')}
                    className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      tipo === 'GNC' ? 'bg-yellow-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    GNC
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('Nafta')}
                    className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      tipo === 'Nafta' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Nafta
                  </button>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Fecha de Carga
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                />
              </div>

              {/* Cost */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Importe Cobrado ($)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={importe}
                  onChange={(e) => setImporte(e.target.value)}
                  placeholder="Ej: 2150"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Estación de Servicio / Notas de Carga
                </label>
                <input
                  type="text"
                  required
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Ej: YPF Av. Centenario - Carga Diaria"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
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
                  {editingItem ? 'Actualizar Carga' : 'Guardar Carga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
