const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * Report Generation Routes
 * All routes require authentication and appropriate permissions
 */

/**
 * @route POST /api/reports/generate
 * @desc Generate attendance report
 * @access Private (requires report-generation:create permission)
 */
router.post('/generate', 
  authenticate, 
  authorize('report-generation:create'), 
  reportController.generateReport
);

/**
 * @route POST /api/reports/process-unprocessed
 * @desc Process unprocessed attendance records
 * @access Private (requires report-generation:create permission)
 */
router.post('/process-unprocessed', 
  authenticate, 
  authorize('report-generation:create'), 
  reportController.processUnprocessedRecords
);

/**
 * @route GET /api/reports/statistics
 * @desc Get report statistics and analytics
 * @access Private (requires report-generation:read permission)
 */
router.get('/statistics', 
  authenticate, 
  authorize('report-generation:read'), 
  reportController.getStatistics
);

/**
 * @route GET /api/reports/history
 * @desc Get report generation history
 * @access Private (requires report-generation:read permission)
 */
router.get('/history', 
  authenticate, 
  authorize('report-generation:read'), 
  reportController.getReportHistory
);

/**
 * @route GET /api/reports/controllers
 * @desc Get available controllers for filtering
 * @access Private (requires report-generation:read permission)
 */
router.get('/controllers', 
  authenticate, 
  authorize('report-generation:read'), 
  reportController.getControllers
);

/**
 * @route GET /api/reports/export
 * @desc Export report data as CSV or JSON
 * @access Private (requires report-generation:read permission)
 */
router.get('/export', 
  authenticate, 
  authorize('report-generation:read'), 
  reportController.exportReport
);

/**
 * WhatsApp Integration Routes
 */

/**
 * @route POST /api/reports/whatsapp/send
 * @desc Send report via WhatsApp
 * @access Private (requires whatsapp:send permission)
 */
router.post('/whatsapp/send', 
  authenticate, 
  authorize('whatsapp:send'), 
  reportController.sendWhatsAppReport
);

/**
 * @route GET /api/reports/whatsapp/test
 * @desc Test WhatsApp API connection
 * @access Private (requires whatsapp:read permission)
 */
router.get('/whatsapp/test', 
  authenticate, 
  authorize('whatsapp:read'), 
  reportController.testWhatsAppConnection
);

/**
 * @route GET /api/reports/whatsapp/config
 * @desc Get WhatsApp configuration (safe version)
 * @access Private (requires whatsapp:read permission)
 */
router.get('/whatsapp/config', 
  authenticate, 
  authorize('whatsapp:read'), 
  reportController.getWhatsAppConfig
);

/**
 * @route PUT /api/reports/whatsapp/config
 * @desc Update WhatsApp configuration
 * @access Private (requires whatsapp:update permission)
 */
router.put('/whatsapp/config', 
  authenticate, 
  authorize('whatsapp:update'), 
  reportController.updateWhatsAppConfig
);

module.exports = router;