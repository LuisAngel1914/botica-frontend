import { beforeEach, describe, expect, it } from 'vitest';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  const auth = useAuth();

  beforeEach(() => {
    auth.clearSession();
  });

  it('actualiza de forma reactiva el acceso y el rol al iniciar sesión', () => {
    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.isAdmin.value).toBe(false);

    auth.setSession({
      token: 'token-de-prueba',
      user: { nombre: 'Administrador', role: 'admin' },
    });

    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.isAdmin.value).toBe(true);
    expect(auth.currentUser.value.nombre).toBe('Administrador');
  });

  it('elimina de forma reactiva una sesión cerrada', () => {
    auth.setSession({ token: 'token-de-prueba', user: { role: 'cajero' } });
    auth.clearSession();

    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.isAdmin.value).toBe(false);
    expect(auth.currentUser.value).toEqual({});
  });
});
