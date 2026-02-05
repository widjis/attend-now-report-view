const sql = require('mssql');
const crypto = require('crypto');
const { poolPromise, orangeDbPoolPromise } = require('../config/db');

class SyncScheduleService {
  constructor() {
    this.orangeDbPoolPromise = orangeDbPoolPromise;
    this.employeeWorkflowPoolPromise = poolPromise;
  }

  computeScheduleHash(row) {
    const payload = [
      row.employee_name,
      row.gender,
      row.division,
      row.department,
      row.section,
      row.supervisor_id,
      row.supervisor_name,
      row.position_title,
      row.grade_interval,
      row.phone,
      row.day_type,
      row.description,
      row.time_in,
      row.time_out,
      row.next_day
    ].map(val => (val === null || val === undefined) ? '' : String(val)).join('|');

    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  async fetchOrangeEmployeesWithSchedule() {
    try {
      const pool = await this.orangeDbPoolPromise();
      const result = await pool.request().query(`
        SELECT
            e.employee_id,
            e.employee_name,
            e.gender,
            e.division,
            e.department,
            e.section,
            e.supervisor_id,
            e.supervisor_name,
            e.position_title,
            e.grade_interval,
            e.phone,
            dt.day_type,
            dt.description,
            dt.time_in,
            dt.time_out,
            dt.next_day
        FROM dbo.it_mti_employee_database_tbl AS e
        CROSS APPLY dbo.sp_it_get_day_type(
            'MTI',
            e.employee_id,
            GETDATE()
        ) AS dt
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Orange employees:', error);
      throw error;
    }
  }

  async fetchExistingScheduleHashes(pool) {
    const mapping = {};
    const result = await pool.request().query(`
      SELECT
          employee_id,
          employee_name,
          gender,
          division,
          department,
          section,
          supervisor_id,
          supervisor_name,
          position_title,
          grade_interval,
          phone,
          day_type,
          description,
          time_in,
          time_out,
          next_day
      FROM MTIUsers
    `);

    for (const row of result.recordset) {
      mapping[row.employee_id] = this.computeScheduleHash(row);
    }
    return mapping;
  }

  async getPhoneMaxLength(pool) {
    try {
      const result = await pool.request().query(`
        SELECT CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'MTIUsers'
          AND COLUMN_NAME = 'phone'
      `);
      if (result.recordset.length > 0 && result.recordset[0].CHARACTER_MAXIMUM_LENGTH) {
        return result.recordset[0].CHARACTER_MAXIMUM_LENGTH;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async syncOrangeToMtiUsers() {
    const timestamp = new Date();
    const logs = [];
    const updatedDetails = [];
    const insertedDetails = [];
    let updatedCount = 0;
    let insertedCount = 0;

    const log = (msg) => {
      console.log(msg);
      logs.push(msg);
    };

    try {
      log(`Starting sync at ${timestamp.toISOString()}`);
      
      const orangeRows = await this.fetchOrangeEmployeesWithSchedule();
      const employeeWorkflowPool = await this.employeeWorkflowPoolPromise();
      
      const existingHashes = await this.fetchExistingScheduleHashes(employeeWorkflowPool);
      const phoneMaxLen = await this.getPhoneMaxLength(employeeWorkflowPool);
      
      log(`Fetched ${orangeRows.length} rows from Orange DB`);

      for (const row of orangeRows) {
        let phone = row.phone ? String(row.phone) : '';
        if (phoneMaxLen > 0 && phone.length > phoneMaxLen) {
          phone = phone.substring(0, phoneMaxLen);
        }
        
        // Normalize row for hashing (similar to Python logic)
        const normalizedRow = { ...row, phone };
        const newHash = this.computeScheduleHash(normalizedRow);
        const oldHash = existingHashes[row.employee_id];

        if (oldHash === newHash) {
          continue;
        }

        const checkRequest = employeeWorkflowPool.request();
        checkRequest.input('employee_id', sql.VarChar, row.employee_id);
        const checkResult = await checkRequest.query('SELECT COUNT(1) as count FROM MTIUsers WHERE employee_id = @employee_id');
        const exists = checkResult.recordset[0].count > 0;

        const request = employeeWorkflowPool.request();
        request.input('employee_id', sql.VarChar, row.employee_id);
        request.input('employee_name', sql.VarChar, row.employee_name);
        request.input('gender', sql.VarChar, row.gender);
        request.input('division', sql.VarChar, row.division);
        request.input('department', sql.VarChar, row.department);
        request.input('section', sql.VarChar, row.section);
        request.input('supervisor_id', sql.VarChar, row.supervisor_id);
        request.input('supervisor_name', sql.VarChar, row.supervisor_name);
        request.input('position_title', sql.VarChar, row.position_title);
        request.input('grade_interval', sql.VarChar, row.grade_interval);
        request.input('phone', sql.VarChar, phone);
        request.input('day_type', sql.VarChar, row.day_type);
        request.input('description', sql.VarChar, row.description);
        request.input('time_in', sql.VarChar, row.time_in);
        request.input('time_out', sql.VarChar, row.time_out);
        request.input('next_day', sql.VarChar, row.next_day);

        if (exists) {
          await request.query(`
            UPDATE MTIUsers
            SET
                employee_name = @employee_name,
                gender = @gender,
                division = @division,
                department = @department,
                section = @section,
                supervisor_id = @supervisor_id,
                supervisor_name = @supervisor_name,
                position_title = @position_title,
                grade_interval = @grade_interval,
                phone = @phone,
                day_type = @day_type,
                description = @description,
                time_in = @time_in,
                time_out = @time_out,
                next_day = @next_day
            WHERE employee_id = @employee_id
          `);
          updatedCount++;
          updatedDetails.push(`${row.employee_id} | ${row.employee_name}`);
        } else {
          await request.query(`
            INSERT INTO MTIUsers (
                employee_id, employee_name, gender, division, department, section,
                supervisor_id, supervisor_name, position_title, grade_interval, phone,
                day_type, description, time_in, time_out, next_day
            )
            VALUES (
                @employee_id, @employee_name, @gender, @division, @department, @section,
                @supervisor_id, @supervisor_name, @position_title, @grade_interval, @phone,
                @day_type, @description, @time_in, @time_out, @next_day
            )
          `);
          insertedCount++;
          insertedDetails.push(`${row.employee_id} | ${row.employee_name}`);
        }
      }

      const total = orangeRows.length;
      const unchanged = total - updatedCount - insertedCount;
      const summary = `Sync completed. Total: ${total}, Updated: ${updatedCount}, Inserted: ${insertedCount}, Unchanged: ${unchanged}`;
      log(summary);

      return {
        success: true,
        summary,
        updatedDetails,
        insertedDetails,
        logs
      };

    } catch (error) {
      log(`Error during sync: ${error.message}`);
      console.error(error);
      return {
        success: false,
        error: error.message,
        logs
      };
    }
  }
}

module.exports = { SyncScheduleService };
