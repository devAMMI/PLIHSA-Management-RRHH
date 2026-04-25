/*
  # Update employee profile photos

  Assigns professional Pexels stock photos to all employees that currently have:
  - NULL photo
  - The local placeholder /Profile-pic-plihsa-logo-foto.jpg
  - The generic imgur placeholder https://i.imgur.com/cJmSkjt.jpeg

  Excludes:
  - Jean Kenneth (has own personal photo)
  - Employees with real Supabase Storage photos (Adriana, Alejandro, Jessica, Mario Johel, Myryám)

  Photos are assigned alternating from a pool of male/female professional headshots from Pexels,
  determined by first name gender.
*/

DO $$
DECLARE
  -- Female Pexels photos (professional headshots)
  female_photos TEXT[] := ARRAY[
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  ];

  -- Male Pexels photos (professional headshots)
  male_photos TEXT[] := ARRAY[
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/775358/pexels-photo-775358.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  ];

  -- Female names for classification
  female_names TEXT[] := ARRAY[
    'Andrea','Evelyn','Heidy','Isis','Jennifer','Karla','Lilian','Lily','Lucía',
    'Mercedes','Marietta','Nilzia','Sandra','Silvia','Suanny','Suyapa','Victoria',
    'Virginia','Gina','Yensi'
  ];

  emp RECORD;
  fi INTEGER := 1;
  mi INTEGER := 1;
  is_female BOOLEAN;
  fname TEXT;
BEGIN
  FOR emp IN
    SELECT id, first_name
    FROM employees
    WHERE (
      photo_url IS NULL
      OR photo_url = '/Profile-pic-plihsa-logo-foto.jpg'
      OR photo_url = 'https://i.imgur.com/cJmSkjt.jpeg'
    )
    AND first_name NOT ILIKE '%kenneth%'
    ORDER BY first_name
  LOOP
    -- Extract first word of first_name for gender check
    fname := split_part(trim(emp.first_name), ' ', 1);
    is_female := fname = ANY(female_names);

    IF is_female THEN
      UPDATE employees
      SET photo_url = female_photos[fi]
      WHERE id = emp.id;
      fi := (fi % array_length(female_photos, 1)) + 1;
    ELSE
      UPDATE employees
      SET photo_url = male_photos[mi]
      WHERE id = emp.id;
      mi := (mi % array_length(male_photos, 1)) + 1;
    END IF;
  END LOOP;
END $$;
