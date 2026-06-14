const Dashboard = require("../models/dashboard");
const response = require("../utils/responseHelper");
const { checkExpiredMemberships } = require("../utils/membershipHelper");

const DashboardController = {
  getAdminDashboard: async (req, res) => {
    try {
      await checkExpiredMemberships();

      const data = await Dashboard.getAdminDashboardData();
      return response.success(res, "Berhasil memuat dashboard Admin", data);
    } catch (error) {
      console.error("error getAdminDashboard:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  getCustomerDashboard: async (req, res) => {
    try {
      const id_user = req.user.id_user;

      await checkExpiredMemberships();

      const data = await Dashboard.getCustomerDashboardData(id_user);
      if (!data) {
        return response.error(res, "Profil customer tidak ditemukan", 404);
      }

      return response.success(res, "Berhasil memuat dashboard Customer", data);
    } catch (error) {
      console.error("error getCustomerDashboard:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  getPetugasDashboard: async (req, res) => {
    try {
      const id_user = req.user.id_user;

      const data = await Dashboard.getPetugasDashboardData(id_user);
      if (!data) {
        return response.error(res, "Profil petugas tidak ditemukan", 404);
      }

      return response.success(res, "Berhasil memuat dashboard Petugas", data);
    } catch (error) {
      console.error("error getPetugasDashboard:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  }
};

module.exports = DashboardController;
