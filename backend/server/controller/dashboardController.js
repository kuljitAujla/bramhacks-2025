const cloudService = require('../services/cloudService');

class DashboardController {
  /**
   * Get dashboard overview data
   * GET /api/dashboard/overview
   */
  async getOverview(req, res) {
    try {
      // TODO: Connect to real database/Arduino service
      const overview = {
        dronesActive: 18,
        flowersPollinated: 1240000,
        flowersPollinatedChange: 5.2, // percentage change
        successRate: 98.2,
        systemHealth: 'normal',
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get drone status data
   * GET /api/dashboard/drones
   */
  async getDrones(req, res) {
    try {
      // TODO: Connect to real Arduino service
      const drones = [
        { id: 'A01-C4', pollenLevel: 85, status: 'active', location: 'Zone A' },
        { id: 'B12-F9', pollenLevel: 45, status: 'active', location: 'Zone B' },
        { id: 'D04-A1', pollenLevel: 15, status: 'warning', location: 'Zone C' },
        { id: 'E21-B7', pollenLevel: 92, status: 'active', location: 'Zone D' }
      ];

      res.json({
        success: true,
        data: drones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get missions data
   * GET /api/dashboard/missions
   */
  async getMissions(req, res) {
    try {
      const missions = [
        {
          id: 'M78910',
          name: 'Orchard Zone B',
          date: new Date().toISOString().split('T')[0],
          time: '14:00',
          status: 'scheduled',
          location: { lat: 43.6532, lng: -79.3832 } // Toronto coordinates
        },
        {
          id: 'M78911',
          name: 'Greenhouse 3',
          date: new Date().toISOString().split('T')[0],
          time: '16:30',
          status: 'scheduled',
          location: { lat: 43.6510, lng: -79.3470 }
        },
        {
          id: 'M78912',
          name: 'Field Alpha',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          time: '09:00',
          status: 'scheduled',
          location: { lat: 43.7000, lng: -79.4000 }
        }
      ];

      res.json({
        success: true,
        data: missions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get analytics data
   * GET /api/dashboard/analytics
   */
  async getAnalytics(req, res) {
    try {
      const analytics = {
        totalMissions: 1204,
        missionsChange: 5.2,
        successRate: 92.1,
        successRateChange: 1.8,
        activeDrones: 16,
        activeDronesChange: 2,
        pollenStock: 48.5,
        pollenStockChange: -3.1,
        performanceData: {
          flowers: 15234,
          change: 12.5,
          period: 'Last 30 Days'
        }
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get alerts data
   * GET /api/dashboard/alerts
   */
  async getAlerts(req, res) {
    try {
      const alerts = [
        {
          id: 'alert-1',
          type: 'critical',
          title: 'Low Pollen Stock',
          message: 'Drone #D04-A1 has less than 15% pollen remaining. Refill required immediately.',
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          droneId: 'D04-A1'
        },
        {
          id: 'alert-2',
          type: 'warning',
          title: 'Battery Low',
          message: 'Drone #B12-F9 battery level is below 20%. Consider returning to base soon.',
          timestamp: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
          droneId: 'B12-F9'
        }
      ];

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get live mission data
   * GET /api/dashboard/live-missions
   */
  async getLiveMissions(req, res) {
    try {
      const liveMissions = await cloudService.getLiveMissions();
      
      res.json({
        success: true,
        data: liveMissions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get real-time mission updates
   * GET /api/dashboard/mission/:id/updates
   */
  async getMissionUpdates(req, res) {
    try {
      const { id } = req.params;
      const updates = await cloudService.getMissionUpdates(id);
      
      res.json({
        success: true,
        data: updates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new DashboardController();

