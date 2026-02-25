-- =====================================================
-- SEED DATA: Asistencia Escolar
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor)
-- =====================================================

-- ⚠️ PASO PREVIO REQUERIDO:
-- 1. Ve a Authentication → Users → Add User
-- 2. Email: leticia.romero@escuela.edu.mx
-- 3. Password: (el que gustes)
-- 4. Copia el UUID del usuario creado
-- 5. Reemplaza el valor de teacher_uuid abajo ↓

DO $$
DECLARE
  teacher_uuid uuid;
  class_uuid uuid;
BEGIN
  -- ===== 1. OBTENER EL UUID DEL USUARIO AUTH =====
  -- (Asume que ya creaste el user desde el dashboard de Auth)
  SELECT id INTO teacher_uuid FROM auth.users WHERE email = 'leticia.romero@escuela.edu.mx' LIMIT 1;

  IF teacher_uuid IS NULL THEN
    RAISE EXCEPTION 'No se encontró el usuario auth con email leticia.romero@escuela.edu.mx. Créalo primero en Authentication → Users.';
  END IF;

  -- ===== 2. TEACHER =====
  INSERT INTO teachers (id, email, full_name)
  VALUES (teacher_uuid, 'eurosonlatino@gmail.com', 'Leticia Romero')
  ON CONFLICT (id) DO NOTHING;

  -- ===== 3. CLASS =====
  INSERT INTO classes (id, teacher_id, name, grade, section, schedule)
  VALUES (
    gen_random_uuid(),
    teacher_uuid,
    'Historia',
    1,
    'A',
    '{"days": [1, 2, 3, 4, 5], "start_time": "08:00", "end_time": "09:30"}'::jsonb
  )
  RETURNING id INTO class_uuid;

  -- ===== 4. STUDENTS (49 alumnos) =====
  INSERT INTO students (id, class_id, first_name, last_name, student_id_official, active) VALUES
    (gen_random_uuid(), class_uuid, 'Melissa Jatziti', 'Aguilar Camacho', '20250001', true),
    (gen_random_uuid(), class_uuid, 'Cesar Nahum', 'Aguirre Romero', '20250002', true),
    (gen_random_uuid(), class_uuid, 'Yazmin', 'Aldana Morales', '20250003', true),
    (gen_random_uuid(), class_uuid, 'Maria Fernanda', 'Amado Sanchez', '20250004', true),
    (gen_random_uuid(), class_uuid, 'Liam Yaakov', 'Arevalo Carpio', '20250005', true),
    (gen_random_uuid(), class_uuid, 'Oscar Yael', 'Corona Lagunas', '20250006', true),
    (gen_random_uuid(), class_uuid, 'Leonardo', 'Cortes Montalvo', '20250007', true),
    (gen_random_uuid(), class_uuid, 'Maria Jose', 'Cuautitla Mila', '20250008', true),
    (gen_random_uuid(), class_uuid, 'Miranda', 'Diaz Ronquillo', '20250009', true),
    (gen_random_uuid(), class_uuid, 'Cesar Alexander', 'Dominguez Guzman', '20250010', true),
    (gen_random_uuid(), class_uuid, 'Daira Gisell', 'Escobar Estrada', '20250011', true),
    (gen_random_uuid(), class_uuid, 'Gibran', 'Flores Cuatecatl', '20250012', true),
    (gen_random_uuid(), class_uuid, 'Ashley Ivonne', 'Garcia Goyri', '20250013', true),
    (gen_random_uuid(), class_uuid, 'Kristel Mayllim', 'Gonzalez Sanchez', '20250014', true),
    (gen_random_uuid(), class_uuid, 'Daniela', 'Gutierrez Hernandez', '20250015', true),
    (gen_random_uuid(), class_uuid, 'Nicole', 'Hernandez Cortes', '20250016', true),
    (gen_random_uuid(), class_uuid, 'Jesus Leonel', 'Hernandez Coyotl', '20250017', true),
    (gen_random_uuid(), class_uuid, 'Heidi Estefany', 'Hernandez Flores', '20250018', true),
    (gen_random_uuid(), class_uuid, 'Ximena Zoe', 'Hernandez Quintero', '20250019', true),
    (gen_random_uuid(), class_uuid, 'Zaid Uriel', 'Huerta Chavez', '20250020', true),
    (gen_random_uuid(), class_uuid, 'Luna', 'Huerta Solorio', '20250021', false),
    (gen_random_uuid(), class_uuid, 'Lizbeth', 'Lezama Fragoso', '20250022', true),
    (gen_random_uuid(), class_uuid, 'Demyan Lionel', 'Lopez Bermudez', '20250023', true),
    (gen_random_uuid(), class_uuid, 'Jahir', 'Lopez Perez', '20250024', true),
    (gen_random_uuid(), class_uuid, 'Jesus', 'Mani Sarmiento', '20250025', true),
    (gen_random_uuid(), class_uuid, 'Alexa Nicole', 'Mastranzo Flores', '20250026', true),
    (gen_random_uuid(), class_uuid, 'Alejandra', 'Mendez Cortez', '20250027', true),
    (gen_random_uuid(), class_uuid, 'Luis Santiago', 'Mendez Picen', '20250028', true),
    (gen_random_uuid(), class_uuid, 'Alondra Vanessa', 'Mendoza Totolhua', '20250029', true),
    (gen_random_uuid(), class_uuid, 'Bruno', 'Mendoza Villavicencio', '20250030', true),
    (gen_random_uuid(), class_uuid, 'Aron', 'Mora Perez', '20250031', true),
    (gen_random_uuid(), class_uuid, 'Ian Yoab', 'Olmedo Mendoza', '20250032', true),
    (gen_random_uuid(), class_uuid, 'Diego Armando', 'Palacios Valdez', '20250033', true),
    (gen_random_uuid(), class_uuid, 'Adriana Yamilet', 'Perez Romero', '20250034', true),
    (gen_random_uuid(), class_uuid, 'Ivan Jesus', 'Perez Zenteno', '20250035', true),
    (gen_random_uuid(), class_uuid, 'Arleth Quetzaly', 'Ramirez Ramirez', '20250036', true),
    (gen_random_uuid(), class_uuid, 'Kenia', 'Ramirez Toxqui', '20250037', true),
    (gen_random_uuid(), class_uuid, 'Eduardo', 'Romero Alcantarilla', '20250038', true),
    (gen_random_uuid(), class_uuid, 'Romina', 'Romero Valero', '20250039', true),
    (gen_random_uuid(), class_uuid, 'Jaime', 'Rosas Hernandez', '20250040', true),
    (gen_random_uuid(), class_uuid, 'Fatima', 'Salazar Arce', '20250041', true),
    (gen_random_uuid(), class_uuid, 'Ximena', 'Salazar Vazquez', '20250042', true),
    (gen_random_uuid(), class_uuid, 'Angel Jareth', 'Sanchez Rico', '20250043', true),
    (gen_random_uuid(), class_uuid, 'Neymar Rafael', 'Trujeque Vazquez', '20250044', true),
    (gen_random_uuid(), class_uuid, 'Karla Vianey', 'Urbano Santos', '20250045', true),
    (gen_random_uuid(), class_uuid, 'Abdiel', 'Velazquez Cruz', '20250046', true),
    (gen_random_uuid(), class_uuid, 'Samantha', 'Vera Ramirez', '20250047', true),
    (gen_random_uuid(), class_uuid, 'Andrea Paola', 'Zapotitla Castro', '20250048', true),
    (gen_random_uuid(), class_uuid, 'Pamela', 'Zempoaltecatl Castillo', '20250049', true);

  RAISE NOTICE '✅ Seed completo: 1 teacher, 1 class, 49 students insertados.';
END $$;