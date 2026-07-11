/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getStoredUsers, encryptPassword } from '../utils/storage';
import { registerUser } from '../utils/api';
import { UserProfile } from '../types';
import { User, Mail, Phone, Lock, KeyRound, AlertTriangle, CheckCircle, ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onNavigateToLogin }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Security checks state
  const [pwValidations, setPwValidations] = useState({
    length: false,
    number: false,
    uppercase: false,
    specialChar: false,
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [tempCreatedUser, setTempCreatedUser] = useState<UserProfile | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);

    setPwValidations({
      length: val.length >= 8,
      number: /[0-9]/.test(val),
      uppercase: /[A-Z]/.test(val),
      specialChar: /[^A-Za-z0-9]/.test(val),
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !phone || !username || !password || !confirmPassword) {
      setErrorMsg('Por favor complete todos los campos.');
      return;
    }

    // Password criteria check
    const isValid = pwValidations.length && pwValidations.number && pwValidations.uppercase && pwValidations.specialChar;
    if (!isValid) {
      setErrorMsg('La contraseña no cumple con todos los requisitos de seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    const users = getStoredUsers();

    // Check availability
    const isEmailTaken = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (isEmailTaken) {
      setErrorMsg('Este correo electrónico ya está registrado.');
      return;
    }

    const isUsernameTaken = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (isUsernameTaken) {
      setErrorMsg('Este nombre de usuario ya está tomado.');
      return;
    }

    // Create user in pending activation state
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      username,
      passwordHash: encryptPassword(password),
      carBrand: '',
      carModel: '',
      carYear: 0,
      carPlate: '',
      carKilometers: 0,
      licenciaTaxi: '',
      vtvVencimiento: '',
      verified: false, // Must verify
      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`
    };

    setTempCreatedUser(newUser);
    setIsVerificationModalOpen(true);
  };

  const handleActivateAccount = async () => {
    if (!tempCreatedUser) return;

    try {
      const activatedUser = { ...tempCreatedUser, verified: true };
      await registerUser(activatedUser);
      setIsVerificationModalOpen(false);
      onRegisterSuccess(); // Notifies parent to show success and redirect
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al activar la cuenta');
      setIsVerificationModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans relative overflow-hidden" id="register-view">
      {/* Decorative background glow */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-yellow-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-slate-200/50 blur-[120px] pointer-events-none" />

      {/* Left side: Golden Dark Taxi Image Banner */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-950 relative overflow-hidden items-center justify-center border-r border-slate-200/40">
        <img 
          src="/images/taxi_dark_gold_1783567838853.jpg" 
          alt="Premium Taxi" 
          className="absolute inset-0 w-full h-full object-cover opacity-75 transform scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/10 to-slate-950" />
        
        {/* Banner content */}
        <div className="absolute bottom-16 left-16 right-16 z-10 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-3 py-1 bg-yellow-400 text-slate-950 text-xs font-mono font-bold tracking-widest rounded-full uppercase"
          >
            Únete Hoy
          </motion.div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-display">
            Toma el volante de tus <span className="text-yellow-400 font-bold">finanzas</span>.
          </h1>
          <p className="text-slate-300 max-w-md text-sm lg:text-base">
            Regístrate y comienza a auditar tus ganancias reales, administrar tus cargas de combustibles y planificar mantenimientos preventivos en segundos.
          </p>
        </div>
      </div>

      {/* Right side: Register Console */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-6 py-8 sm:px-12 lg:px-16 z-10 bg-white shadow-xl md:shadow-none border-l border-slate-200 md:overflow-y-auto md:max-h-screen min-h-screen">
        {/* Mobile Header Image */}
        <div className="md:hidden -mx-6 -mt-8 mb-6 sm:-mx-12 relative overflow-hidden shrink-0">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden border-b border-slate-200 dark:border-zinc-800 bg-slate-950">
            <img 
              src="/images/taxi_dark_gold_1783567838853.jpg" 
              alt="Taxi Header" 
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            {/* Ambient vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
          </div>
          <div className="text-center mt-5 px-6">
            <h2 className="text-3xl font-black text-slate-900 font-display uppercase tracking-wider">
              REGISTRO DE <span className="text-yellow-500 font-black">USUARIO</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Crear Cuenta Nueva — Taxi Control</p>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto space-y-6 py-4">
          <button
            onClick={onNavigateToLogin}
            className="flex items-center space-x-2 text-slate-500 hover:text-yellow-600 transition-colors focus:outline-none mb-4 group text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver al inicio de sesión</span>
          </button>

          {/* Desktop Header */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-2 text-yellow-600 font-mono text-xs tracking-wider uppercase mb-1">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span>Registro de USUARIO</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 font-display uppercase">
              Crear Cuenta Nueva
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Registra tu perfil para gestionar tus operaciones diarias.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-2 animate-shake">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nombre y Apellido
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 transition-colors"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 transition-colors"
                    placeholder="Ej: juan@taxicontrol.com"
                  />
                </div>
              </div>

              {/* Phone & Username in row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Teléfono
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 transition-colors"
                      placeholder="11-1234-5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nombre de Usuario
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <span className="text-xs font-mono">@</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 transition-colors"
                      placeholder="juan86"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {/* Security validations display */}
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-1.5 text-[10px]">
                <div className="font-bold text-slate-600 mb-1 flex items-center space-x-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-yellow-600" />
                  <span>Requisitos de Seguridad de Contraseña:</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${pwValidations.length ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span className={pwValidations.length ? 'text-emerald-600 font-bold' : 'text-slate-400'}>Mínimo 8 caracteres</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${pwValidations.number ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span className={pwValidations.number ? 'text-emerald-600 font-bold' : 'text-slate-400'}>Incluye un número</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${pwValidations.uppercase ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span className={pwValidations.uppercase ? 'text-emerald-600 font-bold' : 'text-slate-400'}>Incluye una Mayúscula</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${pwValidations.specialChar ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span className={pwValidations.specialChar ? 'text-emerald-600 font-bold' : 'text-slate-400'}>Caracter especial (!@#$..)</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-yellow-400 transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-yellow-400/10 cursor-pointer"
              >
                <span>Registrar y Enviar Activación</span>
              </button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={onNavigateToLogin}
                className="text-yellow-600 font-bold hover:text-yellow-700 hover:underline transition-colors focus:outline-none"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Simulated Email Verification Modal */}
      {isVerificationModalOpen && tempCreatedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-6 relative overflow-hidden shadow-xl text-slate-900">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400" />
            
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="h-10 w-10 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-600">
                <Mail className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display">Correo de Activación Simulado</h3>
                <p className="text-[10px] text-slate-500">De: noreply@taxicontrol.com | Para: {tempCreatedUser.email}</p>
              </div>
            </div>

            <div className="space-y-4 py-2">
              <p className="text-xs text-slate-600">
                ¡Hola <strong className="text-yellow-600 font-bold">{tempCreatedUser.name}</strong>! Gracias por registrarte en nuestra plataforma de administración de taxis.
              </p>
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs space-y-3">
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Para activar tu cuenta y empezar a cargar tus viajes, cargas de combustibles y mantenimientos, haz clic en el siguiente enlace de verificación seguro (este es un flujo de prueba interactivo):
                </p>
                <div className="text-center py-2">
                  <button
                    onClick={handleActivateAccount}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-yellow-400/10 hover:shadow-yellow-400/20 transition-all cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Verificar y Activar Cuenta</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic text-center">
                Nota: Al hacer clic en el botón de arriba, se guardará tu registro de forma segura en el almacenamiento local y se habilitará tu inicio de sesión de inmediato.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
