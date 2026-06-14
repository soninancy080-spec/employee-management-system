-- Create employee details view
DROP VIEW IF EXISTS employee_details_view CASCADE;
--;;
CREATE OR REPLACE VIEW employee_details_view AS
SELECT 
  e.id,
  e.name,
  e.email,
  e.phone,
  e.profile_image,
  e.resume_path,
  e.documents,
  e.department_id,
  d.name AS department_name,
  e.manager_id,
  m.name AS manager_name,
  e.user_id,
  u.role AS role,
  e.tracking_mode,
  e.gross_salary,
  e.created_at
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN employees m ON e.manager_id = m.id
LEFT JOIN users u ON e.user_id = u.id;

--;;

-- Create allocate asset stored procedure function
CREATE OR REPLACE FUNCTION allocate_asset_func(p_asset_id INT, p_employee_id INT, p_notes TEXT)
RETURNS INT AS $$
DECLARE
  v_allocation_id INT;
  v_status VARCHAR;
BEGIN
  -- Check asset status
  SELECT status INTO v_status FROM assets WHERE id = p_asset_id;
  
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Asset with ID % not found', p_asset_id;
  END IF;
  
  IF v_status != 'AVAILABLE' THEN
    RAISE EXCEPTION 'Asset is not available for allocation. Current status: %', v_status;
  END IF;
  
  -- Check employee existence
  IF NOT EXISTS (SELECT 1 FROM employees WHERE id = p_employee_id) THEN
    RAISE EXCEPTION 'Employee with ID % not found', p_employee_id;
  END IF;

  -- Create allocation record
  INSERT INTO asset_allocations (asset_id, employee_id, notes, allocated_at, created_at)
  VALUES (p_asset_id, p_employee_id, p_notes, NOW(), NOW())
  RETURNING id INTO v_allocation_id;

  -- Update asset status
  UPDATE assets SET status = 'ALLOCATED' WHERE id = p_asset_id;

  RETURN v_allocation_id;
END;
$$ LANGUAGE plpgsql;

--;;

-- Create return asset stored procedure function
CREATE OR REPLACE FUNCTION return_asset_func(p_asset_id INT, p_notes TEXT)
RETURNS VOID AS $$
DECLARE
  v_allocation_id INT;
  v_status VARCHAR;
BEGIN
  -- Check if asset exists
  SELECT status INTO v_status FROM assets WHERE id = p_asset_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Asset with ID % not found', p_asset_id;
  END IF;

  -- Find the active allocation (returned_at is NULL)
  SELECT id INTO v_allocation_id 
  FROM asset_allocations 
  WHERE asset_id = p_asset_id AND returned_at IS NULL
  ORDER BY allocated_at DESC
  LIMIT 1;

  IF v_allocation_id IS NULL THEN
    -- If there's no active allocation but status is ALLOCATED, reset status to AVAILABLE
    UPDATE assets SET status = 'AVAILABLE' WHERE id = p_asset_id;
    RETURN;
  END IF;

  -- Update allocation record
  UPDATE asset_allocations 
  SET returned_at = NOW(), notes = CASE WHEN p_notes IS NOT NULL AND p_notes != '' THEN p_notes ELSE notes END
  WHERE id = v_allocation_id;

  -- Update asset status to AVAILABLE
  UPDATE assets SET status = 'AVAILABLE' WHERE id = p_asset_id;
END;
$$ LANGUAGE plpgsql;
