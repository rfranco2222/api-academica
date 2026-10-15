import { NotFoundError } from '../../utils/errors.js';
import * as perfilRepo from './perfil.repository.js';
import type { CambiosPerfil, PerfilFila } from './perfil.repository.js';

export async function obtener(usuarioId: string): Promise<PerfilFila> {
  const perfil = await perfilRepo.obtener(usuarioId);
  if (!perfil) throw new NotFoundError('Perfil');
  return perfil;
}

export async function actualizar(usuarioId: string, cambios: CambiosPerfil): Promise<PerfilFila> {
  await obtener(usuarioId);
  await perfilRepo.actualizar(usuarioId, cambios);
  return obtener(usuarioId);
}
