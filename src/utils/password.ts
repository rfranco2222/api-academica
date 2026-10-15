import argon2 from 'argon2';

// Argon2id: algoritmo recomendado por OWASP para contraseñas
export const hashPassword = (plano: string): Promise<string> => argon2.hash(plano, { type: argon2.argon2id });

export async function verificarPassword(hash: string, plano: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plano);
  } catch {
    return false;
  }
}

// Hash ficticio para igualar tiempos cuando el usuario no existe (evita enumerar emails)
let hashFicticio: string | undefined;
export async function verificacionFicticia(plano: string): Promise<false> {
  hashFicticio ??= await hashPassword('contraseña-ficticia-para-igualar-tiempos');
  await verificarPassword(hashFicticio, plano);
  return false;
}
