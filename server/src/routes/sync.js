const express = require('express');
const { SyncController } = require('../controllers/syncController');

const router = express.Router();
const syncController = new SyncController();

// Manual sync attendance
router.post('/attendance', async (req, res) => {
  await syncController.syncAttendance(req, res);
});

// Get sync history
router.get('/history', async (req, res) => {
  await syncController.getSyncHistory(req, res);
});

// Get sync statistics
router.get('/statistics', async (req, res) => {
  await syncController.getSyncStatistics(req, res);
});

// Schedule management
router.get('/schedule', async (req, res) => {
  await syncController.getSyncSchedule(req, res);
});

router.put('/schedule', async (req, res) => {
  await syncController.updateSyncSchedule(req, res);
});

router.patch('/schedule/toggle', async (req, res) => {
  await syncController.toggleSchedule(req, res);
});

// Manual sync operations
router.post('/manual', async (req, res) => {
  await syncController.syncAttendance(req, res);
});

// WhatsApp integration
router.post('/whatsapp/test', async (req, res) => {
  await syncController.testWhatsAppConnection(req, res);
});

router.post('/whatsapp/send-report', async (req, res) => {
  await syncController.sendSyncReport(req, res);
});

// System health and monitoring
router.get('/health', async (req, res) => {
  await syncController.getSystemHealth(req, res);
});

// Data validation and preview
router.post('/preview', async (req, res) => {
  await syncController.previewSyncData(req, res);
});

router.post('/validate', async (req, res) => {
  await syncController.validateSyncData(req, res);
});

// Export functionality
router.get('/export', async (req, res) => {
  await syncController.exportSyncReport(req, res);
});

module.exports = router;