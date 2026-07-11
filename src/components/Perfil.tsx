/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { encryptPassword, getStoredUsers } from '../utils/storage';
import { updateUserProfile, deleteUserProfile } from '../utils/api';
import { 
  User, 
  Mail, 
  Phone, 
  KeyRound, 
  Car, 
  Trash2, 
  Check, 
  AlertTriangle,
  Lock,
  X,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface PerfilProps {
  user: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  onAccountDeleted: () => void;
}

export default function Perfil({ user, onUserUpdate, onAccountDeleted }: PerfilProps) {
  // Personal Info form
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [username, setUsername] = useState(user.username);

  // Car Info form
  const [carBrand, setCarBrand] = useState(user.carBrand);
  const [carModel, setCarModel] = useState(user.carModel);
  const [carYear, setCarYear] = useState(user.carYear.toString());
  const [carPlate, setCarPlate] = useState(user.carPlate);
  const [carKilometers, setCarKilometers] = useState(user.carKilometers.toString());
  const [licenciaTaxi, setLicenciaTaxi] = useState(user.licenciaTaxi || '');
  const [vtvVencimiento, setVtvVencimiento] = useState(user.vtvVencimiento || '');

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPwForm, setShowPwForm] = useState(false);

  // Modals / Feedback
  const [infoMsg, setInfoMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('');

  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMsg('');
    setErrorMsg('');

    if (!name || !email || !phone || !username) {
      setErrorMsg('Por favor complete todos los campos obligatorios del perfil.');
      return;
    }

    try {
      const updatedUser = await updateUserProfile(user.id, {
        name,
        email,
        phone,
        username,
      });

      onUserUpdate(updatedUser);
      setInfoMsg('¡Perfil actualizado con éxito!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar el perfil.');
    }
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMsg('');
    setErrorMsg('');

    const yearNum = parseInt(carYear);
    const kmNum = parseInt(carKilometers);

    if (isNaN(yearNum) || yearNum <= 1900) {
      setErrorMsg('Por favor ingrese un año de vehículo válido.');
      return;
    }

    if (isNaN(kmNum) || kmNum < 0) {
      setErrorMsg('El kilometraje no puede ser menor a 0.');
      return;
    }

    try {
      const updatedUser = await updateUserProfile(user.id, {
        carBrand,
        carModel,
        carYear: yearNum,
        carPlate,
        carKilometers: kmNum,
        licenciaTaxi,
        vtvVencimiento
      });

      onUserUpdate(updatedUser);
      setInfoMsg('¡Datos del taxi actualizados con éxito!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar datos del taxi.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMsg('');
    setErrorMsg('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setErrorMsg('Por favor complete todos los campos de contraseña.');
      return;
    }

    const currentHash = encryptPassword(currentPassword);
    if (user.passwordHash !== currentHash) {
      setErrorMsg('La contraseña actual es incorrecta.');
      return;
    }

    // New password security checks
    if (newPassword.length < 8) {
      setErrorMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Las contraseñas nuevas no coinciden.');
      return;
    }

    try {
      const newHash = encryptPassword(newPassword);
      const updatedUser = await updateUserProfile(user.id, {
        passwordHash: newHash
      });

      onUserUpdate(updatedUser);

      setInfoMsg('¡Contraseña cambiada con éxito!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPwForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar la contraseña.');
    }
  };

  const handleDeleteAccount = async () => {
    setErrorMsg('');
    if (deleteConfirmationWord !== 'ELIMINAR') {
      setErrorMsg('Debe escribir exactamente "ELIMINAR" para confirmar.');
      return;
    }

    try {
      await deleteUserProfile(user.id);

      // Wipe other data associated with this user locally as well
      const viajesAll = JSON.parse(localStorage.getItem('taxi_viajes') || '[]');
      const filteredViajes = viajesAll.filter((v: any) => v.userId !== user.id);
      localStorage.setItem('taxi_viajes', JSON.stringify(filteredViajes));

      const combAll = JSON.parse(localStorage.getItem('taxi_combustible') || '[]');
      const filteredComb = combAll.filter((c: any) => c.userId !== user.id);
      localStorage.setItem('taxi_combustible', JSON.stringify(filteredComb));

      const mantAll = JSON.parse(localStorage.getItem('taxi_mantenimiento') || '[]');
      const filteredMant = mantAll.filter((m: any) => m.userId !== user.id);
      localStorage.setItem('taxi_mantenimiento', JSON.stringify(filteredMant));

      const alertsAll = JSON.parse(localStorage.getItem('taxi_alertas') || '[]');
      const filteredAlerts = alertsAll.filter((a: any) => a.userId !== user.id);
      localStorage.setItem('taxi_alertas', JSON.stringify(filteredAlerts));

      setShowDeleteConfirmModal(false);
      onAccountDeleted(); // Parent will handle logout
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar la cuenta.');
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12" id="perfil-view">
      {/* View Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900 font-display uppercase">Mi Perfil</h2>
        <p className="text-xs text-slate-400 font-bold">Administra tus credenciales personales y los parámetros operativos de tu vehículo.</p>
      </div>

      {/* Messages */}
      {infoMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-start space-x-2 animate-fadeIn">
          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{infoMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl flex items-start space-x-2 animate-shake">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Profile info & Password change */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Personal Data Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2 font-display">
              <User className="h-4 w-4 text-yellow-600" />
              <span>Datos Personales</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase font-bold">Nombre y Apellido</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase font-bold">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase font-bold">Teléfono de contacto</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase font-bold">Nombre de usuario (@)</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-extrabold rounded-xl transition-all cursor-pointer text-xs shadow-sm shadow-yellow-400/10"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Password Change Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 font-display">
                <Lock className="h-4 w-4 text-yellow-600" />
                <span>Seguridad de Acceso</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPwForm(!showPwForm)}
                className="text-xs text-yellow-600 font-bold hover:underline cursor-pointer"
              >
                {showPwForm ? 'Ocultar formulario' : 'Cambiar contraseña'}
              </button>
            </div>

            {showPwForm && (
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1.5 uppercase font-bold">Contraseña Actual</label>
                    <div className="relative">
                      <input
                        type={showPwCurrent ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwCurrent(!showPwCurrent)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPwCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1.5 uppercase font-bold">Nueva Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPwNew ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                        placeholder="Mín. 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwNew(!showPwNew)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPwNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1.5 uppercase font-bold">Confirmar Nueva</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-yellow-400 text-slate-950 font-extrabold rounded-xl hover:bg-yellow-500 transition-colors text-xs cursor-pointer shadow-sm shadow-yellow-400/10"
                  >
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Taxi Vehicle & Account Destruction */}
        <div className="space-y-6">
          {/* Card 3: Taxi Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2 font-display">
              <Car className="h-4 w-4 text-yellow-600" />
              <span>Configuración del Taxi</span>
            </h3>

            <form onSubmit={handleUpdateVehicle} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Marca del Vehículo</label>
                  <input
                    type="text"
                    required
                    value={carBrand}
                    onChange={(e) => setCarBrand(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Modelo del Vehículo</label>
                  <input
                    type="text"
                    required
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Año</label>
                    <input
                      type="number"
                      required
                      value={carYear}
                      onChange={(e) => setCarYear(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Patente / Dominio</label>
                    <input
                      type="text"
                      required
                      value={carPlate}
                      onChange={(e) => setCarPlate(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 text-yellow-600 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Odometer actual (Kms)</label>
                  <input
                    type="number"
                    required
                    value={carKilometers}
                    onChange={(e) => setCarKilometers(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">N° de Licencia</label>
                  <input
                    type="text"
                    value={licenciaTaxi}
                    onChange={(e) => setLicenciaTaxi(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400"
                    placeholder="Ej: LIC-10492"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Fecha de Vencimiento de la VTV</label>
                  <input
                    type="date"
                    value={vtvVencimiento}
                    onChange={(e) => setVtvVencimiento(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-50 border border-slate-200 hover:border-yellow-400 hover:bg-slate-100 text-slate-700 font-extrabold rounded-xl transition-all cursor-pointer text-xs"
                >
                  Guardar Vehículo
                </button>
              </div>
            </form>
          </div>

          {/* Card 4: Account Self-Destruction Block */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center space-x-1.5 font-display">
              <AlertTriangle className="h-4 w-4" />
              <span>Zona de peligro</span>
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
              La eliminación de tu cuenta es irreversible. Se borrarán de forma definitiva tu perfil y todos los datos asociados de viajes, cargas de combustible y mantenimientos en este equipo.
            </p>
            <button
              onClick={() => setShowDeleteConfirmModal(true)}
              className="w-full py-2 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-300 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Eliminar mi Cuenta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-4 relative shadow-2xl text-slate-900">
            <button
              onClick={() => setShowDeleteConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-black text-rose-600 flex items-center space-x-2 font-display uppercase">
              <AlertTriangle className="h-5 w-5 animate-bounce" />
              <span>¿Eliminar tu cuenta por completo?</span>
            </h3>

            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              Esta acción eliminará de forma irreversible el perfil de <strong>@{user.username}</strong> y todos sus historiales cargados de viajes, GNC/Nafta y registros de taller.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-[11px] text-slate-600 border border-slate-200">
              <p className="font-bold text-slate-700">Escribe <strong className="text-rose-600">ELIMINAR</strong> en el siguiente campo para confirmar la autodestrucción:</p>
              <input
                type="text"
                value={deleteConfirmationWord}
                onChange={(e) => setDeleteConfirmationWord(e.target.value)}
                placeholder="Escribe ELIMINAR"
                className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-rose-600 text-xs font-black tracking-widest text-center focus:outline-none focus:border-rose-500 mt-2"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                No, cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationWord !== 'ELIMINAR'}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Sí, eliminar para siempre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
