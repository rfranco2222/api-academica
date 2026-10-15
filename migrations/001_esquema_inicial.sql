-- Roles del sistema
CREATE TYPE rol_usuario AS ENUM ('admin', 'profesor', 'estudiante');

-- Función reutilizable para mantener "actualizado_en" al día
CREATE OR REPLACE FUNCTION set_actualizado_en() RETURNS trigger AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cuentas de acceso
CREATE TABLE usuarios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           varchar(255) NOT NULL,
  password_hash   text NOT NULL,
  rol             rol_usuario NOT NULL,
  activo          boolean NOT NULL DEFAULT true,
  creado_en       timestamptz NOT NULL DEFAULT now(),
  actualizado_en  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX usuarios_email_unico ON usuarios (lower(email));
CREATE TRIGGER usuarios_actualizado BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

-- Información personal (1 a 1 con usuarios)
CREATE TABLE perfiles (
  usuario_id        uuid PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  nombres           varchar(80) NOT NULL,
  apellidos         varchar(80) NOT NULL,
  cedula            varchar(13) UNIQUE,
  fecha_nacimiento  date,
  telefono          varchar(20),
  direccion         varchar(255),
  actualizado_en    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER perfiles_actualizado BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

CREATE TABLE estudiantes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  matricula   varchar(20) NOT NULL UNIQUE,
  nivel       varchar(40) NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profesores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  especialidad  varchar(100) NOT NULL,
  creado_en     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cursos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       varchar(20) NOT NULL UNIQUE,
  nombre       varchar(120) NOT NULL,
  periodo      varchar(20) NOT NULL,
  profesor_id  uuid REFERENCES profesores(id) ON DELETE SET NULL,
  creado_en    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cursos_profesor_idx ON cursos (profesor_id);

CREATE TABLE inscripciones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id  uuid NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  curso_id       uuid NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (estudiante_id, curso_id)
);
CREATE INDEX inscripciones_curso_idx ON inscripciones (curso_id);

CREATE TABLE calificaciones (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id   uuid NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
  evaluacion       varchar(80) NOT NULL,
  nota             numeric(5,2) NOT NULL CHECK (nota BETWEEN 0 AND 100),
  peso             numeric(5,2) NOT NULL DEFAULT 1 CHECK (peso > 0),
  comentario       varchar(500),
  registrada_por   uuid REFERENCES profesores(id) ON DELETE SET NULL,
  creado_en        timestamptz NOT NULL DEFAULT now(),
  actualizado_en   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inscripcion_id, evaluacion)
);
CREATE TRIGGER calificaciones_actualizado BEFORE UPDATE ON calificaciones
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

-- Refresh tokens (guardamos solo el HASH, nunca el token)
CREATE TABLE refresh_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash   char(64) NOT NULL UNIQUE,
  familia_id   uuid NOT NULL,
  expira_en    timestamptz NOT NULL,
  revocado_en  timestamptz,
  user_agent   varchar(255),
  ip           varchar(45),
  creado_en    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_usuario_idx ON refresh_tokens (usuario_id);
CREATE INDEX refresh_tokens_familia_idx ON refresh_tokens (familia_id);
