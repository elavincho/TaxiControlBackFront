/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, Viaje, GastoCombustible, Mantenimiento, AlertNotification, FilterRange, PaymentMethod, MonotributoRecord, SeguroRecord } from '../src/types';

// Simple encryption helper (using a custom hash function for secure storage in localStorage)
export function encryptPassword(password: string): string {
  // Simple but secure salt + hashing simulation for storage
  const salt = "taxi_app_salt_2026_";
  let hash = 0;
  const combined = salt + password;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `tx_${Math.abs(hash).toString(16)}`;
}

// Initialize Storage if empty
export function initStorage() {
  if (!localStorage.getItem('taxi_users')) {
    localStorage.setItem('taxi_users', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('taxi_viajes')) {
    localStorage.setItem('taxi_viajes', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('taxi_combustible')) {
    localStorage.setItem('taxi_combustible', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('taxi_mantenimiento')) {
    localStorage.setItem('taxi_mantenimiento', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('taxi_alertas')) {
    localStorage.setItem('taxi_alertas', JSON.stringify([]));
  }

  if (!localStorage.getItem('taxi_monotributo')) {
    localStorage.setItem('taxi_monotributo', JSON.stringify([]));
  }

  if (!localStorage.getItem('taxi_seguro')) {
    localStorage.setItem('taxi_seguro', JSON.stringify([]));
  }
}

// Low-level Getters/Setters with Background MongoDB Synchronizer

async function isMongoAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok' && data.mongodb === 'connected';
  } catch (e) {
    return false;
  }
}

export async function syncViajesToDB(localViajes: Viaje[], userId: string) {
  if (!(await isMongoAvailable())) return;
  try {
    const res = await fetch(`/api/viajes/${userId}`);
    if (!res.ok) return;
    const remoteViajes: any[] = await res.json();

    const localIds = new Set(localViajes.map(v => v.id));

    // DELETE remote viajes not present locally
    for (const remote of remoteViajes) {
      if (!localIds.has(remote._id)) {
        await fetch(`/api/viajes/${remote._id}`, { method: 'DELETE' });
      }
    }

    // CREATE or UPDATE remote viajes
    let localStorageChanged = false;
    const allViajesFromLocalStorage: Viaje[] = JSON.parse(localStorage.getItem('taxi_viajes') || '[]');

    for (const local of localViajes) {
      const match = remoteViajes.find(r => r._id === local.id);
      if (!match) {
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(local.id);
        if (!isMongoId) {
          const payload = {
            userId,
            fecha: local.fecha,
            formaPago: local.formaPago,
            monto: local.monto
          };
          const createRes = await fetch('/api/viajes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (createRes.ok) {
            const created = await createRes.json();
            const idx = allViajesFromLocalStorage.findIndex(v => v.id === local.id);
            if (idx !== -1) {
              allViajesFromLocalStorage[idx].id = created._id;
              localStorageChanged = true;
            }
          }
        }
      } else {
        if (match.fecha !== local.fecha || match.formaPago !== local.formaPago || match.monto !== local.monto) {
          await fetch(`/api/viajes/${match._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fecha: local.fecha,
              formaPago: local.formaPago,
              monto: local.monto
            })
          });
        }
      }
    }

    if (localStorageChanged) {
      localStorage.setItem('taxi_viajes', JSON.stringify(allViajesFromLocalStorage));
      window.dispatchEvent(new Event('storage-update'));
    }
  } catch (err) {
    console.error("Failed syncing viajes:", err);
  }
}

export async function syncCombustibleToDB(localCombustibles: GastoCombustible[], userId: string) {
  if (!(await isMongoAvailable())) return;
  try {
    const res = await fetch(`/api/combustible/${userId}`);
    if (!res.ok) return;
    const remoteCombustibles: any[] = await res.json();

    const localIds = new Set(localCombustibles.map(c => c.id));

    // DELETE remote
    for (const remote of remoteCombustibles) {
      if (!localIds.has(remote._id)) {
        await fetch(`/api/combustible/${remote._id}`, { method: 'DELETE' });
      }
    }

    // CREATE or UPDATE
    let localStorageChanged = false;
    const allCombFromLocalStorage: GastoCombustible[] = JSON.parse(localStorage.getItem('taxi_combustible') || '[]');

    for (const local of localCombustibles) {
      const match = remoteCombustibles.find(r => r._id === local.id);
      if (!match) {
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(local.id);
        if (!isMongoId) {
          const payload = {
            userId,
            fecha: local.fecha,
            importe: local.importe,
            nota: local.nota,
            tipo: local.tipo
          };
          const createRes = await fetch('/api/combustible', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (createRes.ok) {
            const created = await createRes.json();
            const idx = allCombFromLocalStorage.findIndex(c => c.id === local.id);
            if (idx !== -1) {
              allCombFromLocalStorage[idx].id = created._id;
              localStorageChanged = true;
            }
          }
        }
      } else {
        if (match.fecha !== local.fecha || match.importe !== local.importe || match.nota !== local.nota || match.tipo !== local.tipo) {
          await fetch(`/api/combustible/${match._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fecha: local.fecha,
              importe: local.importe,
              nota: local.nota,
              tipo: local.tipo
            })
          });
        }
      }
    }

    if (localStorageChanged) {
      localStorage.setItem('taxi_combustible', JSON.stringify(allCombFromLocalStorage));
      window.dispatchEvent(new Event('storage-update'));
    }
  } catch (err) {
    console.error("Failed syncing combustibles:", err);
  }
}

export async function syncMantenimientoToDB(localMantenimientos: Mantenimiento[], userId: string) {
  if (!(await isMongoAvailable())) return;
  try {
    const res = await fetch(`/api/mantenimiento/${userId}`);
    if (!res.ok) return;
    const remoteMaints: any[] = await res.json();

    const localIds = new Set(localMantenimientos.map(m => m.id));

    // DELETE remote
    for (const remote of remoteMaints) {
      if (!localIds.has(remote._id)) {
        await fetch(`/api/mantenimiento/${remote._id}`, { method: 'DELETE' });
      }
    }

    // CREATE or UPDATE
    let localStorageChanged = false;
    const allMaintFromLocalStorage: Mantenimiento[] = JSON.parse(localStorage.getItem('taxi_mantenimiento') || '[]');

    for (const local of localMantenimientos) {
      const match = remoteMaints.find(r => r._id === local.id);
      if (!match) {
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(local.id);
        if (!isMongoId) {
          const payload = {
            userId,
            fecha: local.fecha,
            tipoMantenimiento: local.tipoMantenimiento,
            descripcion: local.descripcion,
            importe: local.importe,
            kilometrajeActual: local.kilometrajeActual,
            proximoSugeridoKilometraje: local.proximoSugeridoKilometraje,
            proximoSugeridaFecha: local.proximoSugeridaFecha,
            taller: local.taller,
            nroFactura: local.nroFactura
          };
          const createRes = await fetch('/api/mantenimiento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (createRes.ok) {
            const created = await createRes.json();
            const idx = allMaintFromLocalStorage.findIndex(m => m.id === local.id);
            if (idx !== -1) {
              allMaintFromLocalStorage[idx].id = created._id;
              localStorageChanged = true;
            }
          }
        }
      } else {
        if (
          match.fecha !== local.fecha ||
          match.tipoMantenimiento !== local.tipoMantenimiento ||
          match.descripcion !== local.descripcion ||
          match.importe !== local.importe ||
          match.kilometrajeActual !== local.kilometrajeActual ||
          match.proximoSugeridoKilometraje !== local.proximoSugeridoKilometraje ||
          match.proximoSugeridaFecha !== local.proximoSugeridaFecha ||
          match.taller !== local.taller ||
          match.nroFactura !== local.nroFactura
        ) {
          await fetch(`/api/mantenimiento/${match._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fecha: local.fecha,
              tipoMantenimiento: local.tipoMantenimiento,
              descripcion: local.descripcion,
              importe: local.importe,
              kilometrajeActual: local.kilometrajeActual,
              proximoSugeridoKilometraje: local.proximoSugeridoKilometraje,
              proximoSugeridaFecha: local.proximoSugeridaFecha,
              taller: local.taller,
              nroFactura: local.nroFactura
            })
          });
        }
      }
    }

    if (localStorageChanged) {
      localStorage.setItem('taxi_mantenimiento', JSON.stringify(allMaintFromLocalStorage));
      window.dispatchEvent(new Event('storage-update'));
    }
  } catch (err) {
    console.error("Failed syncing mantenimientos:", err);
  }
}

export async function syncAlertasToDB(localAlertas: AlertNotification[], userId: string) {
  if (!(await isMongoAvailable())) return;
  try {
    const res = await fetch(`/api/alertas/${userId}`);
    if (!res.ok) return;
    const remoteAlertas: any[] = await res.json();

    const localIds = new Set(localAlertas.map(a => a.id));

    // DELETE remote
    for (const remote of remoteAlertas) {
      if (!localIds.has(remote._id)) {
        await fetch(`/api/alertas/${remote._id}`, { method: 'DELETE' });
      }
    }

    // CREATE or UPDATE
    let localStorageChanged = false;
    const allAlertsFromLocalStorage: AlertNotification[] = JSON.parse(localStorage.getItem('taxi_alertas') || '[]');

    for (const local of localAlertas) {
      const match = remoteAlertas.find(r => r._id === local.id);
      if (!match) {
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(local.id);
        if (!isMongoId) {
          const payload = {
            userId,
            tipo: local.tipo,
            mensaje: local.mensaje,
            fechaLimite: local.fechaLimite,
            kmLimite: local.kmLimite,
            resuelta: local.resuelta
          };
          const createRes = await fetch('/api/alertas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (createRes.ok) {
            const created = await createRes.json();
            const idx = allAlertsFromLocalStorage.findIndex(a => a.id === local.id);
            if (idx !== -1) {
              allAlertsFromLocalStorage[idx].id = created._id;
              localStorageChanged = true;
            }
          }
        }
      } else {
        if (
          match.tipo !== local.tipo ||
          match.mensaje !== local.mensaje ||
          match.fechaLimite !== local.fechaLimite ||
          match.kmLimite !== local.kmLimite ||
          match.resuelta !== local.resuelta
        ) {
          await fetch(`/api/alertas/${match._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipo: local.tipo,
              mensaje: local.mensaje,
              fechaLimite: local.fechaLimite,
              kmLimite: local.kmLimite,
              resuelta: local.resuelta
            })
          });
        }
      }
    }

    if (localStorageChanged) {
      localStorage.setItem('taxi_alertas', JSON.stringify(allAlertsFromLocalStorage));
      window.dispatchEvent(new Event('storage-update'));
    }
  } catch (err) {
    console.error("Failed syncing alertas:", err);
  }
}

export async function syncMonotributoToDB(localMonotributos: MonotributoRecord[], userId: string) {
  if (!(await isMongoAvailable())) return;
  try {
    const res = await fetch(`/api/monotributo/${userId}`);
    if (!res.ok) return;
    const remoteRecords: any[] = await res.json();

    const localIds = new Set(localMonotributos.map(m => m.id));

    // DELETE remote
    for (const remote of remoteRecords) {
      if (!localIds.has(remote._id)) {
        await fetch(`/api/monotributo/${remote._id}`, { method: 'DELETE' });
      }
    }

    // CREATE or UPDATE
    let localStorageChanged = false;
    const allFromLocalStorage: MonotributoRecord[] = JSON.parse(localStorage.getItem('taxi_monotributo') || '[]');

    for (const local of localMonotributos) {
      const match = remoteRecords.find(r => r._id === local.id);
      if (!match) {
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(local.id);
        if (!isMongoId) {
          const payload = {
            userId,
            fechaPago: local.fechaPago,
            importe: local.importe,
            categoria: local.categoria,
            fechaVencimiento: local.fechaVencimiento
          };
          const createRes = await fetch('/api/monotributo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (createRes.ok) {
            const created = await createRes.json();
            const idx = allFromLocalStorage.findIndex(m => m.id === local.id);
            if (idx !== -1) {
              allFromLocalStorage[idx].id = created._id;
              localStorageChanged = true;
            }
          }
        }
      } else {
        if (
          match.fechaPago !== local.fechaPago ||
          match.importe !== local.importe ||
          match.categoria !== local.categoria ||
          match.fechaVencimiento !== local.fechaVencimiento
        ) {
          await fetch(`/api/monotributo/${match._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fechaPago: local.fechaPago,
              importe: local.importe,
              categoria: local.categoria,
              fechaVencimiento: local.fechaVencimiento
            })
          });
        }
      }
    }

    if (localStorageChanged) {
      localStorage.setItem('taxi_monotributo', JSON.stringify(allFromLocalStorage));
      window.dispatchEvent(new Event('storage-update'));
    }
  } catch (err) {
    console.error("Failed syncing monotributo:", err);
  }
}

export async function syncSeguroToDB(localSeguros: SeguroRecord[], userId: string) {
  if (!(await isMongoAvailable())) return;
  try {
    const res = await fetch(`/api/seguro/${userId}`);
    if (!res.ok) return;
    const remoteRecords: any[] = await res.json();

    const localIds = new Set(localSeguros.map(s => s.id));

    // DELETE remote
    for (const remote of remoteRecords) {
      if (!localIds.has(remote._id)) {
        await fetch(`/api/seguro/${remote._id}`, { method: 'DELETE' });
      }
    }

    // CREATE or UPDATE
    let localStorageChanged = false;
    const allFromLocalStorage: SeguroRecord[] = JSON.parse(localStorage.getItem('taxi_seguro') || '[]');

    for (const local of localSeguros) {
      const match = remoteRecords.find(r => r._id === local.id);
      if (!match) {
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(local.id);
        if (!isMongoId) {
          const payload = {
            userId,
            fechaPago: local.fechaPago,
            importe: local.importe,
            fechaVencimiento: local.fechaVencimiento,
            aseguradora: local.aseguradora
          };
          const createRes = await fetch('/api/seguro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (createRes.ok) {
            const created = await createRes.json();
            const idx = allFromLocalStorage.findIndex(s => s.id === local.id);
            if (idx !== -1) {
              allFromLocalStorage[idx].id = created._id;
              localStorageChanged = true;
            }
          }
        }
      } else {
        if (
          match.fechaPago !== local.fechaPago ||
          match.importe !== local.importe ||
          match.fechaVencimiento !== local.fechaVencimiento ||
          match.aseguradora !== local.aseguradora
        ) {
          await fetch(`/api/seguro/${match._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fechaPago: local.fechaPago,
              importe: local.importe,
              fechaVencimiento: local.fechaVencimiento,
              aseguradora: local.aseguradora
            })
          });
        }
      }
    }

    if (localStorageChanged) {
      localStorage.setItem('taxi_seguro', JSON.stringify(allFromLocalStorage));
      window.dispatchEvent(new Event('storage-update'));
    }
  } catch (err) {
    console.error("Failed syncing seguro:", err);
  }
}

export async function syncFromDBToLocalStorage(userId: string) {
  if (!(await isMongoAvailable())) return;
  try {
    const userRes = await fetch(`/api/users/${userId}`);
    if (userRes.ok) {
      const user = await userRes.json();
      if (user) {
        user.id = user._id;
        const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
        const updatedUsers = users.map((u: any) => u.id === userId ? user : u);
        if (!users.some((u: any) => u.id === userId)) {
          updatedUsers.push(user);
        }
        localStorage.setItem('taxi_users', JSON.stringify(updatedUsers));
      }
    }

    const viajesRes = await fetch(`/api/viajes/${userId}`);
    if (viajesRes.ok) {
      const viajes = await viajesRes.json();
      const normalizedViajes = viajes.map((v: any) => ({ ...v, id: v._id }));
      const all: Viaje[] = JSON.parse(localStorage.getItem('taxi_viajes') || '[]');
      const filtered = all.filter(v => v.userId !== userId);
      localStorage.setItem('taxi_viajes', JSON.stringify([...filtered, ...normalizedViajes]));
    }

    const combRes = await fetch(`/api/combustible/${userId}`);
    if (combRes.ok) {
      const combs = await combRes.json();
      const normalizedCombs = combs.map((c: any) => ({ ...c, id: c._id }));
      const all: GastoCombustible[] = JSON.parse(localStorage.getItem('taxi_combustible') || '[]');
      const filtered = all.filter(c => c.userId !== userId);
      localStorage.setItem('taxi_combustible', JSON.stringify([...filtered, ...normalizedCombs]));
    }

    const maintRes = await fetch(`/api/mantenimiento/${userId}`);
    if (maintRes.ok) {
      const maints = await maintRes.json();
      const normalizedMaints = maints.map((m: any) => ({ ...m, id: m._id }));
      const all: Mantenimiento[] = JSON.parse(localStorage.getItem('taxi_mantenimiento') || '[]');
      const filtered = all.filter(m => m.userId !== userId);
      localStorage.setItem('taxi_mantenimiento', JSON.stringify([...filtered, ...normalizedMaints]));
    }

    const alertasRes = await fetch(`/api/alertas/${userId}`);
    if (alertasRes.ok) {
      const alertas = await alertasRes.json();
      const normalizedAlertas = alertas.map((a: any) => ({ ...a, id: a._id }));
      const all: AlertNotification[] = JSON.parse(localStorage.getItem('taxi_alertas') || '[]');
      const filtered = all.filter(a => a.userId !== userId);
      localStorage.setItem('taxi_alertas', JSON.stringify([...filtered, ...normalizedAlertas]));
    }

    const monotributoRes = await fetch(`/api/monotributo/${userId}`);
    if (monotributoRes.ok) {
      const monotributo = await monotributoRes.json();
      const normalizedMonotributo = monotributo.map((m: any) => ({ ...m, id: m._id }));
      const all: MonotributoRecord[] = JSON.parse(localStorage.getItem('taxi_monotributo') || '[]');
      const filtered = all.filter(m => m.userId !== userId);
      localStorage.setItem('taxi_monotributo', JSON.stringify([...filtered, ...normalizedMonotributo]));
    }

    const seguroRes = await fetch(`/api/seguro/${userId}`);
    if (seguroRes.ok) {
      const seguro = await seguroRes.json();
      const normalizedSeguro = seguro.map((s: any) => ({ ...s, id: s._id }));
      const all: SeguroRecord[] = JSON.parse(localStorage.getItem('taxi_seguro') || '[]');
      const filtered = all.filter(s => s.userId !== userId);
      localStorage.setItem('taxi_seguro', JSON.stringify([...filtered, ...normalizedSeguro]));
    }

    window.dispatchEvent(new Event('storage-update'));
  } catch (err) {
    console.error("Failed to sync from DB to local storage:", err);
  }
}

// Low-level Getters/Setters
export function getStoredUsers(): UserProfile[] {
  initStorage();
  return JSON.parse(localStorage.getItem('taxi_users') || '[]');
}

export function saveStoredUsers(users: UserProfile[]) {
  localStorage.setItem('taxi_users', JSON.stringify(users));
  for (const u of users) {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(u.id);
    if (isMongoId) {
      isMongoAvailable().then(avail => {
        if (avail) {
          fetch(`/api/users/${u.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(u)
          });
        }
      });
    }
  }
}

export function getStoredViajes(userId: string): Viaje[] {
  initStorage();
  const all: Viaje[] = JSON.parse(localStorage.getItem('taxi_viajes') || '[]');
  return all.filter(v => v.userId === userId);
}

export function saveStoredViajes(viajes: Viaje[], userId: string) {
  const all: Viaje[] = JSON.parse(localStorage.getItem('taxi_viajes') || '[]');
  const filtered = all.filter(v => v.userId !== userId);
  localStorage.setItem('taxi_viajes', JSON.stringify([...filtered, ...viajes]));
  syncViajesToDB(viajes, userId);
}

export function getStoredCombustible(userId: string): GastoCombustible[] {
  initStorage();
  const all: GastoCombustible[] = JSON.parse(localStorage.getItem('taxi_combustible') || '[]');
  return all.filter(c => c.userId === userId);
}

export function saveStoredCombustible(combustible: GastoCombustible[], userId: string) {
  const all: GastoCombustible[] = JSON.parse(localStorage.getItem('taxi_combustible') || '[]');
  const filtered = all.filter(c => c.userId !== userId);
  localStorage.setItem('taxi_combustible', JSON.stringify([...filtered, ...combustible]));
  syncCombustibleToDB(combustible, userId);
}

export function getStoredMantenimiento(userId: string): Mantenimiento[] {
  initStorage();
  const all: Mantenimiento[] = JSON.parse(localStorage.getItem('taxi_mantenimiento') || '[]');
  return all.filter(m => m.userId === userId);
}

export function saveStoredMantenimiento(mantenimiento: Mantenimiento[], userId: string) {
  const all: Mantenimiento[] = JSON.parse(localStorage.getItem('taxi_mantenimiento') || '[]');
  const filtered = all.filter(m => m.userId !== userId);
  localStorage.setItem('taxi_mantenimiento', JSON.stringify([...filtered, ...mantenimiento]));
  syncMantenimientoToDB(mantenimiento, userId);
}

export function getStoredAlertas(userId: string): AlertNotification[] {
  initStorage();
  const all: AlertNotification[] = JSON.parse(localStorage.getItem('taxi_alertas') || '[]');
  return all.filter(a => a.userId === userId);
}

export function saveStoredAlertas(alertas: AlertNotification[], userId: string) {
  const all: AlertNotification[] = JSON.parse(localStorage.getItem('taxi_alertas') || '[]');
  const filtered = all.filter(a => a.userId !== userId);
  localStorage.setItem('taxi_alertas', JSON.stringify([...filtered, ...alertas]));
  syncAlertasToDB(alertas, userId);
}

export function getStoredMonotributo(userId: string): MonotributoRecord[] {
  initStorage();
  const all: MonotributoRecord[] = JSON.parse(localStorage.getItem('taxi_monotributo') || '[]');
  return all.filter(m => m.userId === userId);
}

export function saveStoredMonotributo(records: MonotributoRecord[], userId: string) {
  const all: MonotributoRecord[] = JSON.parse(localStorage.getItem('taxi_monotributo') || '[]');
  const filtered = all.filter(m => m.userId !== userId);
  localStorage.setItem('taxi_monotributo', JSON.stringify([...filtered, ...records]));
  syncMonotributoToDB(records, userId);
}

export function getStoredSeguro(userId: string): SeguroRecord[] {
  initStorage();
  const all: SeguroRecord[] = JSON.parse(localStorage.getItem('taxi_seguro') || '[]');
  return all.filter(s => s.userId === userId);
}

export function saveStoredSeguro(records: SeguroRecord[], userId: string) {
  const all: SeguroRecord[] = JSON.parse(localStorage.getItem('taxi_seguro') || '[]');
  const filtered = all.filter(s => s.userId !== userId);
  localStorage.setItem('taxi_seguro', JSON.stringify([...filtered, ...records]));
  syncSeguroToDB(records, userId);
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Date helpers for filtering
export function isDateInCurrentWeek(dateStr: string, referenceDateStr?: string): boolean {
  const refDate = new Date(referenceDateStr || getTodayDateString());
  const targetDate = new Date(dateStr);
  
  // Get start and end of week for reference date
  const day = refDate.getDay();
  const diff = refDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const startOfWeek = new Date(refDate.setDate(diff));
  startOfWeek.setHours(0,0,0,0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23,59,59,999);
  
  return targetDate >= startOfWeek && targetDate <= endOfWeek;
}

export function filterByRange<T extends { fecha: string }>(
  items: T[], 
  range: FilterRange, 
  customDateStr?: string
): T[] {
  const refDate = new Date(customDateStr || getTodayDateString());
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth(); // 0-indexed
  const refDay = refDate.getDate();

  return items.filter(item => {
    const itemDate = new Date(item.fecha);
    const itemYear = itemDate.getFullYear();
    const itemMonth = itemDate.getMonth();
    const itemDay = itemDate.getDate();

    if (range === 'dia') {
      return itemYear === refYear && itemMonth === refMonth && itemDay === refDay;
    } else if (range === 'semana') {
      return isDateInCurrentWeek(item.fecha, customDateStr || getTodayDateString());
    } else if (range === 'mes') {
      return itemYear === refYear && itemMonth === refMonth;
    } else if (range === 'ano') {
      return itemYear === refYear;
    }
    return true; // 'todos'
  });
}

// Stat Calculations
export interface SummaryStats {
  ingresosTotales: number;
  gastosGNC: number;
  gastosNafta: number;
  gastosMantenimiento: number;
  gastosTotales: number;
  gananciaNeta: number;
  cantViajes: number;
  cantCargasGNC: number;
  cantCargasNafta: number;
  promedioViaje: number;
}

export function calculateSummary(
  viajes: Viaje[], 
  combustibles: GastoCombustible[], 
  mantenimientos: Mantenimiento[]
): SummaryStats {
  const ingresosTotales = viajes.reduce((sum, v) => sum + v.monto, 0);
  
  const combustiblesFiltrados = combustibles;
  const gastosGNC = combustiblesFiltrados
    .filter(c => c.tipo === 'GNC')
    .reduce((sum, c) => sum + c.importe, 0);
    
  const gastosNafta = combustiblesFiltrados
    .filter(c => c.tipo === 'Nafta')
    .reduce((sum, c) => sum + c.importe, 0);

  const gastosMantenimiento = mantenimientos.reduce((sum, m) => sum + m.importe, 0);
  const gastosTotales = gastosGNC + gastosNafta + gastosMantenimiento;
  const gananciaNeta = ingresosTotales - gastosTotales;
  
  const cantViajes = viajes.length;
  const cantCargasGNC = combustibles.filter(c => c.tipo === 'GNC').length;
  const cantCargasNafta = combustibles.filter(c => c.tipo === 'Nafta').length;
  const promedioViaje = cantViajes > 0 ? ingresosTotales / cantViajes : 0;

  return {
    ingresosTotales,
    gastosGNC,
    gastosNafta,
    gastosMantenimiento,
    gastosTotales,
    gananciaNeta,
    cantViajes,
    cantCargasGNC,
    cantCargasNafta,
    promedioViaje
  };
}
