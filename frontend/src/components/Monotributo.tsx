/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MonotributoRecord, AlertNotification } from '../src/types';
import { 
  getStoredMonotributo, 
  getStoredAlertas, 
  getTodayDateString
} from '../utils/storage';
import { 
  getMonotributo, 
  saveMonotributo, 
  updateMonotributo, 
  deleteMonotributo, 
  getAlertas, 
  saveAlerta, 
  deleteAlerta 
} from '../utils/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  Search, 
  X, 
  AlertCircle,
  TrendingUp,
  Award,
  DollarSign
} from 'lucide-react';

interface MonotributoProps {
  userId: string;
}

function getNextMonthSameDay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10); // 1-indexed
  let day = parseInt(parts[2], 10);

  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  // Handle cases like Oct 31 -> Nov 31 doesn't exist, cap at max days in month
  const maxDays = new Date(year, month, 0).getDate();
  if (day > maxDays) {
    day = maxDays;
  }

  const mm = month < 10 ? '0' + month : month;
  const dd = day < 10 ? '0' + day : day;
  return `${year}-${mm}-${dd}`;
}

const CATEGORIAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

export default function Monotributo({ userId }: MonotributoProps) {
  const [records, setRecords] = useState<MonotributoRecord[]>(() => getStoredMonotributo(userId));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMonotributo(userId)
      .then((data) => {
        if (active) setRecords(data);
      })
      .catch(err => console.error("Error loading Monotributo:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleStorageUpdate = () => {
      getMonotributo(userId).then((data) => {
        if (active) setRecords(data);
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
  const [editingRecord, setEditingRecord] = useState<MonotributoRecord | null>(null);
  
  // Form States
  const [fechaPago, setFechaPago] = useState('');
  const [categoria, setCategoria] = useState('A');
  const [importe, setImporte] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [formError, setFormError] = useState('');

  // Local search
  const [searchQuery, setSearchQuery] = useState('');

  const REFERENCE_DATE = getTodayDateString(); // System reference date

  // When payment date changes, auto-set next due date to same day of next month
  useEffect(() => {
    if (fechaPago && !editingRecord) {
      setFechaVencimiento(getNextMonthSameDay(fechaPago));
    }
  }, [fechaPago, editingRecord]);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFechaPago(REFERENCE_DATE);
    setCategoria('A');
    setImporte('');
    setFechaVencimiento(getNextMonthSameDay(REFERENCE_DATE));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: MonotributoRecord) => {
    setEditingRecord(rec);
    setFechaPago(rec.fechaPago);
    setCategoria(rec.categoria);
    setImporte(rec.importe.toString());
    setFechaVencimiento(rec.fechaVencimiento);
    setFormError('');
    setIsModalOpen(true);
  };

  const syncAlertForRecord = async (record: MonotributoRecord, isDeleted = false, oldVencimiento?: string) => {
    try {
      const alerts = await getAlertas(userId);
      const existing = alerts.find(a => 
        a.tipo === 'monotributo' && 
        (a.fechaLimite === record.fechaVencimiento || (oldVencimiento && a.fechaLimite === oldVencimiento))
      );
      if (existing) {
        await deleteAlerta(existing.id, userId);
      }
      
      if (!isDeleted) {
        await saveAlerta({
          userId: userId,
          tipo: 'monotributo',
          mensaje: `Vencimiento Monotributo (Categoría ${record.categoria}): $${record.importe}`,
          fechaLimite: record.fechaVencimiento,
          resuelta: false
        });
      }
    } catch (e) {
      console.error("Error syncing alert for monotributo:", e);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro de Monotributo?')) {
      const recordToDelete = records.find(r => r.id === id);
      await deleteMonotributo(id, userId);
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      
      if (recordToDelete) {
        await syncAlertForRecord(recordToDelete, true);
      }
      
      window.dispatchEvent(new Event('storage-update'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fechaPago || !categoria || !importe || !fechaVencimiento) {
      setFormError('Por favor complete todos los campos.');
      return;
    }

    const numImporte = parseFloat(importe);
    if (isNaN(numImporte) || numImporte <= 0) {
      setFormError('El importe debe ser un número positivo.');
      return;
    }

    try {
      let savedRecord: MonotributoRecord;
      if (editingRecord) {
        // Update
        const oldVencimiento = editingRecord.fechaVencimiento;
        savedRecord = await updateMonotributo(editingRecord.id, { fechaPago, categoria, importe: numImporte, fechaVencimiento }, userId);
        setRecords(records.map(r => r.id === editingRecord.id ? savedRecord : r));
        await syncAlertForRecord(savedRecord, false, oldVencimiento);
      } else {
        // Create
        savedRecord = await saveMonotributo({ userId, fechaPago, categoria, importe: numImporte, fechaVencimiento });
        setRecords([savedRecord, ...records]);
        await syncAlertForRecord(savedRecord, false);
      }

      setIsModalOpen(false);
      window.dispatchEvent(new Event('storage-update'));
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar monotributo.');
    }
  };

  // Filter records based on search query
  const filteredRecords = records.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.categoria.toLowerCase().includes(q) ||
      r.importe.toString().includes(q) ||
      r.fechaPago.includes(q) ||
      r.fechaVencimiento.includes(q)
    );
  });

  const totalPagado = records.reduce((sum, r) => sum + r.importe, 0);
  const ultimaCategoria = records.length > 0 ? records[0].categoria : '-';

  return (
    <div className="space-y-6" id="monotributo-section">
      {/* 1. Page Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">Monotributo AFIP</h1>
          <p className="text-sm text-slate-500">Control de pagos, vencimientos y categorías del monotributo.</p>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30 transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          <span>Registrar Pago</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Histórico</p>
            <p className="text-2xl font-black text-slate-900">${totalPagado.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Última Categoría</p>
            <p className="text-2xl font-black text-slate-900">Cat. {ultimaCategoria}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pagos Registrados</p>
            <p className="text-2xl font-black text-slate-900">{records.length}</p>
          </div>
        </div>
      </div>

      {/* 2. Main Content & Listing */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input 
              type="text"
              placeholder="Buscar por cat., importe, fecha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Mostrando {filteredRecords.length} de {records.length} registros
          </span>
        </div>

        {/* Records Table */}
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="py-4 px-6">Fecha Pago</th>
                  <th className="py-4 px-6">Categoría</th>
                  <th className="py-4 px-6">Importe</th>
                  <th className="py-4 px-6">Próximo Vencimiento</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-700">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{rec.fechaPago}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-100">
                        Categoría {rec.categoria}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-black text-slate-900">
                      ${rec.importe.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-rose-600">
                      <div className="flex items-center space-x-1.5">
                        <AlertCircle className="h-4 w-4 text-rose-500" />
                        <span>{rec.fechaVencimiento}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(rec)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 font-bold">No se encontraron registros</p>
            <p className="text-xs text-slate-400 mt-1">Intente una búsqueda diferente o cargue un nuevo pago.</p>
          </div>
        )}
      </div>

      {/* 3. Modal Form (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-100">
              <h3 className="font-black text-slate-950 text-base font-display">
                {editingRecord ? 'Editar Pago de Monotributo' : 'Registrar Pago de Monotributo'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Fecha Pago */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Fecha de Pago</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4.5 w-4.5 pointer-events-none" />
                  <input 
                    type="date"
                    value={fechaPago}
                    onChange={(e) => setFechaPago(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  />
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Categoría AFIP</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>Categoría {cat}</option>
                  ))}
                </select>
              </div>

              {/* Importe */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Importe Pagado ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={importe}
                    onChange={(e) => setImporte(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Fecha Proximo Vencimiento */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Fecha Próximo Vencimiento</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4.5 w-4.5 pointer-events-none" />
                  <input 
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Por defecto se calcula al mismo día del mes siguiente.</p>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all duration-200 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-xl shadow-md shadow-yellow-400/10 hover:shadow-yellow-400/20 transition-all duration-200 text-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
