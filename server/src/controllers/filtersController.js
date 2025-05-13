
const { poolPromise } = require('../config/db');

// Get filter options for dropdowns
exports.getFilterOptions = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    // Get distinct departments
    const departmentsQuery = `
      SELECT DISTINCT Department
      FROM tblAttendanceReport
      WHERE Department IS NOT NULL AND Department <> ''
      ORDER BY Department
    `;
    const departmentsResult = await pool.request().query(departmentsQuery);
    
    // Get distinct companies
    const companiesQuery = `
      SELECT DISTINCT Company
      FROM tblAttendanceReport
      WHERE Company IS NOT NULL AND Company <> ''
      ORDER BY Company
    `;
    const companiesResult = await pool.request().query(companiesQuery);
    
    // Get distinct card types
    const cardTypesQuery = `
      SELECT DISTINCT CardType
      FROM tblAttendanceReport
      WHERE CardType IS NOT NULL AND CardType <> ''
      ORDER BY CardType
    `;
    const cardTypesResult = await pool.request().query(cardTypesQuery);
    
    // Format the response with "all" option at the beginning
    res.json({
      departments: [
        { value: 'all', label: 'All Departments' },
        ...departmentsResult.recordset.map(item => ({
          value: item.Department,
          label: item.Department
        }))
      ],
      companies: [
        { value: 'all', label: 'All Companies' },
        ...companiesResult.recordset.map(item => ({
          value: item.Company,
          label: item.Company
        }))
      ],
      cardTypes: [
        { value: 'all', label: 'All Card Types' },
        ...cardTypesResult.recordset.map(item => ({
          value: item.CardType,
          label: item.CardType
        }))
      ]
    });
  } catch (err) {
    next(err);
  }
};
