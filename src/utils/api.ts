import { UserProfile, Viaje, GastoCombustible, Mantenimiento, AlertNotification, MonotributoRecord, SeguroRecord } from '../types';
import * as localStorageDB from './storage';

let isMongoConnected = false;

// Determine if we should use MongoDB or fall back to local storage
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Unreachable');
    const data = await res.json();
    isMongoConnected = data.status === 'ok' && data.mongodb === 'connected';
  } catch (e) {
    isMongoConnected = false;
  }
  return isMongoConnected;
}

// Check on module load
checkDatabaseConnection();

// --- AUTHENTICATION & PROFILE ---

export async function loginUser(identifier: string, passwordHash: string): Promise<UserProfile> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, passwordHash })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Credenciales inválidas.');
      }
      const user = await res.json();
      if (user && user._id) {
        user.id = user._id;
      }
      return user;
    } catch (e: any) {
      console.warn("Fallback to local login due to:", e.message);
    }
  }
  
  // Local fallback
  const users = localStorageDB.getStoredUsers();
  const matchedUser = users.find(
    u => (u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase())
  );
  if (!matchedUser) throw new Error('Usuario o correo electrónico no registrado.');
  if (matchedUser.passwordHash !== passwordHash) throw new Error('Contraseña incorrecta.');
  return matchedUser;
}

export async function registerUser(userData: Partial<UserProfile>): Promise<UserProfile> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al registrar chofer.');
      }
      const user = await res.json();
      if (user && user._id) {
        user.id = user._id;
      }
      return user;
    } catch (e: any) {
      console.warn("Fallback to local registration due to:", e.message);
    }
  }

  // Local fallback
  const users = localStorageDB.getStoredUsers();
  const existing = users.find(u => u.email === userData.email || u.username === userData.username);
  if (existing) throw new Error('El usuario o correo electrónico ya se encuentra registrado.');
  
  const newUser: UserProfile = {
    id: `u-${Date.now()}`,
    name: userData.name || '',
    email: userData.email || '',
    phone: userData.phone || '',
    username: userData.username || '',
    passwordHash: userData.passwordHash || '',
    carBrand: userData.carBrand || '',
    carModel: userData.carModel || '',
    carYear: userData.carYear || 2026,
    carPlate: userData.carPlate || '',
    carKilometers: userData.carKilometers || 0,
    verified: true,
    avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userData.username}`
  };
  
  localStorageDB.saveStoredUsers([...users, newUser]);
  return newUser;
}

export async function updateUserProfile(userId: string, updatedFields: Partial<UserProfile>): Promise<UserProfile> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const user = await res.json();
        if (user && user._id) {
          user.id = user._id;
        }
        return user;
      }
    } catch (e) {
      console.warn("Update profile API call failed, syncing with local storage");
    }
  }

  // Local fallback
  const users = localStorageDB.getStoredUsers();
  const updatedUsers = users.map(u => {
    if (u.id === userId) {
      return { ...u, ...updatedFields };
    }
    return u;
  });
  localStorageDB.saveStoredUsers(updatedUsers);
  const found = updatedUsers.find(u => u.id === userId);
  if (!found) throw new Error("Usuario no encontrado");
  return found;
}

export async function deleteUserProfile(userId: string): Promise<boolean> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn("Delete profile API call failed, falling back to local storage");
    }
  }

  // Local fallback
  const users = localStorageDB.getStoredUsers();
  const updatedUsers = users.filter(u => u.id !== userId);
  localStorageDB.saveStoredUsers(updatedUsers);
  return true;
}

// --- VIAJES ---

export async function getViajes(userId: string): Promise<Viaje[]> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/viajes/${userId}`);
      if (res.ok) {
        const list = await res.json();
        return list.map((v: any) => ({ ...v, id: v._id }));
      }
    } catch (e) {}
  }
  return localStorageDB.getStoredViajes(userId);
}

export async function saveViaje(viajeData: Omit<Viaje, 'id'>): Promise<Viaje> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch('/api/viajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(viajeData)
      });
      if (res.ok) {
        const created = await res.json();
        const normalized = { ...created, id: created._id };
        const viajes = localStorageDB.getStoredViajes(viajeData.userId);
        localStorageDB.saveStoredViajes([...viajes, normalized], viajeData.userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const nuevoViaje: Viaje = {
    ...viajeData,
    id: `v-${Date.now()}`
  };
  const viajes = localStorageDB.getStoredViajes(viajeData.userId);
  localStorageDB.saveStoredViajes([...viajes, nuevoViaje], viajeData.userId);
  return nuevoViaje;
}

export async function updateViaje(id: string, viajeData: Partial<Viaje>, userId: string): Promise<Viaje> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/viajes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(viajeData)
      });
      if (res.ok) {
        const updated = await res.json();
        const normalized = { ...updated, id: updated._id };
        const viajes = localStorageDB.getStoredViajes(userId);
        const updatedList = viajes.map(v => v.id === id ? normalized : v);
        localStorageDB.saveStoredViajes(updatedList, userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const viajes = localStorageDB.getStoredViajes(userId);
  const updatedList = viajes.map(v => v.id === id ? { ...v, ...viajeData } : v);
  localStorageDB.saveStoredViajes(updatedList, userId);
  const found = updatedList.find(v => v.id === id);
  if (!found) throw new Error("Viaje no encontrado");
  return found;
}

export async function deleteViaje(id: string, userId: string): Promise<boolean> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/viajes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const viajes = localStorageDB.getStoredViajes(userId);
        localStorageDB.saveStoredViajes(viajes.filter(v => v.id !== id), userId);
        return true;
      }
    } catch (e) {}
  }

  const viajes = localStorageDB.getStoredViajes(userId);
  localStorageDB.saveStoredViajes(viajes.filter(v => v.id !== id), userId);
  return true;
}

// --- COMBUSTIBLE ---

export async function getCombustible(userId: string): Promise<GastoCombustible[]> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/combustible/${userId}`);
      if (res.ok) {
        const list = await res.json();
        return list.map((c: any) => ({ ...c, id: c._id }));
      }
    } catch (e) {}
  }
  return localStorageDB.getStoredCombustible(userId);
}

export async function saveCombustible(cargaData: Omit<GastoCombustible, 'id'>): Promise<GastoCombustible> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch('/api/combustible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cargaData)
      });
      if (res.ok) {
        const created = await res.json();
        const normalized = { ...created, id: created._id };
        const cargas = localStorageDB.getStoredCombustible(cargaData.userId);
        localStorageDB.saveStoredCombustible([...cargas, normalized], cargaData.userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const nuevaCarga: GastoCombustible = {
    ...cargaData,
    id: `c-${Date.now()}`
  };
  const cargas = localStorageDB.getStoredCombustible(cargaData.userId);
  localStorageDB.saveStoredCombustible([...cargas, nuevaCarga], cargaData.userId);
  return nuevaCarga;
}

export async function updateCombustible(id: string, cargaData: Partial<GastoCombustible>, userId: string): Promise<GastoCombustible> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/combustible/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cargaData)
      });
      if (res.ok) {
        const updated = await res.json();
        const normalized = { ...updated, id: updated._id };
        const cargas = localStorageDB.getStoredCombustible(userId);
        const updatedList = cargas.map(c => c.id === id ? normalized : c);
        localStorageDB.saveStoredCombustible(updatedList, userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const cargas = localStorageDB.getStoredCombustible(userId);
  const updatedList = cargas.map(c => c.id === id ? { ...c, ...cargaData } : c);
  localStorageDB.saveStoredCombustible(updatedList, userId);
  const found = updatedList.find(c => c.id === id);
  if (!found) throw new Error("Gasto no encontrado");
  return found;
}

export async function deleteCombustible(id: string, userId: string): Promise<boolean> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/combustible/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const cargas = localStorageDB.getStoredCombustible(userId);
        localStorageDB.saveStoredCombustible(cargas.filter(c => c.id !== id), userId);
        return true;
      }
    } catch (e) {}
  }

  const cargas = localStorageDB.getStoredCombustible(userId);
  localStorageDB.saveStoredCombustible(cargas.filter(c => c.id !== id), userId);
  return true;
}

// --- MANTENIMIENTO ---

export async function getMantenimiento(userId: string): Promise<Mantenimiento[]> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/mantenimiento/${userId}`);
      if (res.ok) {
        const list = await res.json();
        return list.map((m: any) => ({ ...m, id: m._id }));
      }
    } catch (e) {}
  }
  return localStorageDB.getStoredMantenimiento(userId);
}

export async function saveMantenimiento(maintData: Omit<Mantenimiento, 'id'>): Promise<Mantenimiento> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch('/api/mantenimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintData)
      });
      if (res.ok) {
        const created = await res.json();
        const normalized = { ...created, id: created._id };
        const records = localStorageDB.getStoredMantenimiento(maintData.userId);
        localStorageDB.saveStoredMantenimiento([...records, normalized], maintData.userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const nuevoMaint: Mantenimiento = {
    ...maintData,
    id: `m-${Date.now()}`
  };
  const records = localStorageDB.getStoredMantenimiento(maintData.userId);
  localStorageDB.saveStoredMantenimiento([...records, nuevoMaint], maintData.userId);
  return nuevoMaint;
}

export async function updateMantenimiento(id: string, maintData: Partial<Mantenimiento>, userId: string): Promise<Mantenimiento> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/mantenimiento/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintData)
      });
      if (res.ok) {
        const updated = await res.json();
        const normalized = { ...updated, id: updated._id };
        const records = localStorageDB.getStoredMantenimiento(userId);
        const updatedList = records.map(m => m.id === id ? normalized : m);
        localStorageDB.saveStoredMantenimiento(updatedList, userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const records = localStorageDB.getStoredMantenimiento(userId);
  const updatedList = records.map(m => m.id === id ? { ...m, ...maintData } : m);
  localStorageDB.saveStoredMantenimiento(updatedList, userId);
  const found = updatedList.find(m => m.id === id);
  if (!found) throw new Error("Registro no encontrado");
  return found;
}

export async function deleteMantenimiento(id: string, userId: string): Promise<boolean> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/mantenimiento/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const records = localStorageDB.getStoredMantenimiento(userId);
        localStorageDB.saveStoredMantenimiento(records.filter(r => r.id !== id), userId);
        return true;
      }
    } catch (e) {}
  }

  const records = localStorageDB.getStoredMantenimiento(userId);
  localStorageDB.saveStoredMantenimiento(records.filter(r => r.id !== id), userId);
  return true;
}

// --- MONOTRIBUTO ---

export async function getMonotributo(userId: string): Promise<MonotributoRecord[]> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/monotributo/${userId}`);
      if (res.ok) {
        const list = await res.json();
        return list.map((m: any) => ({ ...m, id: m._id }));
      }
    } catch (e) {}
  }
  return localStorageDB.getStoredMonotributo(userId);
}

export async function saveMonotributo(recordData: Omit<MonotributoRecord, 'id'>): Promise<MonotributoRecord> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch('/api/monotributo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      if (res.ok) {
        const created = await res.json();
        const normalized = { ...created, id: created._id };
        const records = localStorageDB.getStoredMonotributo(recordData.userId);
        localStorageDB.saveStoredMonotributo([...records, normalized], recordData.userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const nuevoRecord: MonotributoRecord = {
    ...recordData,
    id: `mono-${Date.now()}`
  };
  const records = localStorageDB.getStoredMonotributo(recordData.userId);
  localStorageDB.saveStoredMonotributo([...records, nuevoRecord], recordData.userId);
  return nuevoRecord;
}

export async function updateMonotributo(id: string, recordData: Partial<MonotributoRecord>, userId: string): Promise<MonotributoRecord> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/monotributo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      if (res.ok) {
        const updated = await res.json();
        const normalized = { ...updated, id: updated._id };
        const records = localStorageDB.getStoredMonotributo(userId);
        const updatedList = records.map(m => m.id === id ? normalized : m);
        localStorageDB.saveStoredMonotributo(updatedList, userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const records = localStorageDB.getStoredMonotributo(userId);
  const updatedList = records.map(m => m.id === id ? { ...m, ...recordData } : m);
  localStorageDB.saveStoredMonotributo(updatedList, userId);
  const found = updatedList.find(m => m.id === id);
  if (!found) throw new Error("Registro no encontrado");
  return found;
}

export async function deleteMonotributo(id: string, userId: string): Promise<boolean> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/monotributo/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const records = localStorageDB.getStoredMonotributo(userId);
        localStorageDB.saveStoredMonotributo(records.filter(r => r.id !== id), userId);
        return true;
      }
    } catch (e) {}
  }

  const records = localStorageDB.getStoredMonotributo(userId);
  localStorageDB.saveStoredMonotributo(records.filter(r => r.id !== id), userId);
  return true;
}

// --- SEGURO ---

export async function getSeguro(userId: string): Promise<SeguroRecord[]> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/seguro/${userId}`);
      if (res.ok) {
        const list = await res.json();
        return list.map((s: any) => ({ ...s, id: s._id }));
      }
    } catch (e) {}
  }
  return localStorageDB.getStoredSeguro(userId);
}

export async function saveSeguro(recordData: Omit<SeguroRecord, 'id'>): Promise<SeguroRecord> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch('/api/seguro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      if (res.ok) {
        const created = await res.json();
        const normalized = { ...created, id: created._id };
        const records = localStorageDB.getStoredSeguro(recordData.userId);
        localStorageDB.saveStoredSeguro([...records, normalized], recordData.userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const nuevoRecord: SeguroRecord = {
    ...recordData,
    id: `seg-${Date.now()}`
  };
  const records = localStorageDB.getStoredSeguro(recordData.userId);
  localStorageDB.saveStoredSeguro([...records, nuevoRecord], recordData.userId);
  return nuevoRecord;
}

export async function updateSeguro(id: string, recordData: Partial<SeguroRecord>, userId: string): Promise<SeguroRecord> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/seguro/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      if (res.ok) {
        const updated = await res.json();
        const normalized = { ...updated, id: updated._id };
        const records = localStorageDB.getStoredSeguro(userId);
        const updatedList = records.map(s => s.id === id ? normalized : s);
        localStorageDB.saveStoredSeguro(updatedList, userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const records = localStorageDB.getStoredSeguro(userId);
  const updatedList = records.map(s => s.id === id ? { ...s, ...recordData } : s);
  localStorageDB.saveStoredSeguro(updatedList, userId);
  const found = updatedList.find(s => s.id === id);
  if (!found) throw new Error("Registro no encontrado");
  return found;
}

export async function deleteSeguro(id: string, userId: string): Promise<boolean> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/seguro/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const records = localStorageDB.getStoredSeguro(userId);
        localStorageDB.saveStoredSeguro(records.filter(r => r.id !== id), userId);
        return true;
      }
    } catch (e) {}
  }

  const records = localStorageDB.getStoredSeguro(userId);
  localStorageDB.saveStoredSeguro(records.filter(r => r.id !== id), userId);
  return true;
}

// --- ALERTAS ---

export async function getAlertas(userId: string): Promise<AlertNotification[]> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/alertas/${userId}`);
      if (res.ok) {
        const list = await res.json();
        return list.map((a: any) => ({ ...a, id: a._id }));
      }
    } catch (e) {}
  }
  return localStorageDB.getStoredAlertas(userId);
}

export async function saveAlerta(alertaData: Omit<AlertNotification, 'id'>): Promise<AlertNotification> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertaData)
      });
      if (res.ok) {
        const created = await res.json();
        const normalized = { ...created, id: created._id };
        const alertas = localStorageDB.getStoredAlertas(alertaData.userId);
        localStorageDB.saveStoredAlertas([...alertas, normalized], alertaData.userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const nuevaAlerta: AlertNotification = {
    ...alertaData,
    id: `al-${Date.now()}`
  };
  const alertas = localStorageDB.getStoredAlertas(alertaData.userId);
  localStorageDB.saveStoredAlertas([...alertas, nuevaAlerta], alertaData.userId);
  return nuevaAlerta;
}

export async function updateAlerta(alertaId: string, updatedFields: Partial<AlertNotification>, userId: string): Promise<AlertNotification> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/alertas/${alertaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const updated = await res.json();
        const normalized = { ...updated, id: updated._id };
        const alertas = localStorageDB.getStoredAlertas(userId);
        const updatedList = alertas.map(a => a.id === alertaId ? normalized : a);
        localStorageDB.saveStoredAlertas(updatedList, userId);
        return normalized;
      }
    } catch (e) {}
  }

  // Local fallback
  const alertas = localStorageDB.getStoredAlertas(userId);
  const updatedAlertas = alertas.map(a => {
    if (a.id === alertaId) return { ...a, ...updatedFields };
    return a;
  });
  localStorageDB.saveStoredAlertas(updatedAlertas, userId);
  const found = updatedAlertas.find(a => a.id === alertaId);
  if (!found) throw new Error("Alerta no encontrada");
  return found;
}

export async function deleteAlerta(alertaId: string, userId: string): Promise<boolean> {
  const connected = await checkDatabaseConnection();
  if (connected) {
    try {
      const res = await fetch(`/api/alertas/${alertaId}`, { method: 'DELETE' });
      if (res.ok) {
        const alertas = localStorageDB.getStoredAlertas(userId);
        localStorageDB.saveStoredAlertas(alertas.filter(a => a.id !== alertaId), userId);
        return true;
      }
    } catch (e) {}
  }

  const alertas = localStorageDB.getStoredAlertas(userId);
  localStorageDB.saveStoredAlertas(alertas.filter(a => a.id !== alertaId), userId);
  return true;
}
