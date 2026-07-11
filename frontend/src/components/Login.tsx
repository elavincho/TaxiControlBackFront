/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { encryptPassword } from '../utils/storage';
import { loginUser } from '../utils/api';
import { UserProfile } from '../types';
import { KeyRound, Mail, User, Eye, EyeOff, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (user: UserProfile, rememberMe: boolean) => void;
  onNavigateToRegister: () => void;
}

export default function Login({ onLoginSuccess, onNavigateToRegister }: LoginProps) {
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Modals / Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!identifier || !password) {
      setErrorMsg('Por favor complete todos los campos.');
      return;
    }

    const hash = encryptPassword(password);

    try {
      const user = await loginUser(identifier, hash);
      if (!user.verified) {
        setErrorMsg('Su cuenta aún no ha sido activada. Por favor, verifique su correo electrónico.');
        return;
      }
      onLoginSuccess(user, rememberMe);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de inicio de sesión');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;

    // Simulate recovery email sending
    setInfoMsg(`Se ha enviado un enlace de recuperación a ${recoveryEmail}.`);
    setShowRecoveryModal(false);
    setRecoveryEmail('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans relative overflow-hidden" id="login-view">
      {/* Decorative background glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-yellow-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-slate-200/50 blur-[120px] pointer-events-none" />

      {/* Left side: Golden Dark Taxi Image Banner */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-950 relative overflow-hidden items-center justify-center border-r border-slate-200/40">
        <img 
          src="/src/public/images/taxi_dark_gold_1783567838853.jpg" 
          alt="Premium Taxi" 
          className="absolute inset-0 w-full h-full object-cover opacity-75 transform scale-105 hover:scale-100 transition-transform duration-10000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/10 to-slate-950" />
        
        {/* Banner content */}
        <div className="absolute bottom-16 left-16 right-16 z-10 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-block px-3 py-1 bg-yellow-400 text-slate-950 text-xs font-mono font-bold tracking-widest rounded-full uppercase"
          >
            Taxi Control Premium
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-display"
          >
            Gestión de ingresos y gastos con estilo <span className="text-yellow-400 font-bold">profesional</span>.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-slate-300 max-w-md text-sm lg:text-base"
          >
            Control total sobre tus ingresos diarios, consumos de GNC/Nafta y planes de mantenimiento. Maximiza el rendimiento de tu taxi hoy mismo.
          </motion.p>
        </div>
      </div>

      {/* Right side: Login Console */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 z-10 bg-white shadow-xl md:shadow-none border-l border-slate-200">
        {/* Mobile Header Image placeholder */}
        <div className="md:hidden -mx-6 -mt-12 mb-8 sm:-mx-12 relative overflow-hidden">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden border-b border-slate-200 dark:border-zinc-800 bg-slate-950">
            <img 
              src="/src/public/images/taxi_dark_gold_1783567838853.jpg" 
              alt="Taxi Header" 
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            {/* Ambient vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
          </div>
          <div className="text-center mt-5 px-6">
            <h2 className="text-3xl font-black text-slate-900 font-display uppercase tracking-wider">
              Taxi <span className="text-yellow-500 font-black">Control</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Gestión Inteligente de Ingresos y Gastos</p>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="hidden md:block">
            <div className="flex items-center space-x-2 text-yellow-600 font-mono text-xs tracking-wider uppercase mb-1">
              <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>Acceso Usuarios</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 font-display uppercase">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa tus credenciales para administrar tu vehículo.
            </p>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-2 animate-shake">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Form */}
          <form className="mt-6 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                    placeholder="Ej: Juan o juan@taxicontrol.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-xs text-yellow-600 hover:text-yellow-700 font-bold transition-colors focus:outline-none"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 bg-slate-50 text-yellow-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer accent-yellow-400"
                />
                <span className="text-xs text-slate-500 group-hover:text-slate-800 transition-colors">Recordarme en este equipo</span>
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-yellow-400/10 hover:shadow-yellow-400/20 focus:outline-none cursor-pointer"
              >
                <span>Iniciar Sesión</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-slate-500">
              ¿No tienes una cuenta?{' '}
              <button
                onClick={onNavigateToRegister}
                className="text-yellow-600 font-bold hover:text-yellow-700 hover:underline transition-colors focus:outline-none"
              >
                Regístrate gratis aquí
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Recover Password Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-xl text-slate-900">
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center space-x-2">
              <Mail className="h-5 w-5 text-yellow-500" />
              <span>Recuperar Contraseña</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta de taxista. Te enviaremos instrucciones de recuperación al instante.
            </p>
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <input
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                placeholder="ejemplo@taxi.com"
              />
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-yellow-400 text-slate-950 rounded-xl hover:bg-yellow-500 transition-colors"
                >
                  Enviar Instrucciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
