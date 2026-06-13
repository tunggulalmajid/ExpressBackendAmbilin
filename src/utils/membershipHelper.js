const db = require("../config/dbConf");

const checkExpiredMemberships = async () => {
  try {
    // Update is_member to 0 if expired_member_date is in the past (less than current timestamp)
    await db.query(`
      UPDATE customer 
      SET is_member = 0 
      WHERE is_member = 1 AND expired_member_date IS NOT NULL AND expired_member_date < NOW()
    `);
  } catch (error) {
    console.error("Error checking/updating expired memberships:", error);
  }
};

module.exports = { checkExpiredMemberships };
