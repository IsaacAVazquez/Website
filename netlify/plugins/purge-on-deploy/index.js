module.exports = {
  async onSuccess({ utils }) {
    console.log("Purging Netlify Durable Cache after deploy...");
    try {
      const { purgeCache } = await import("@netlify/functions");
      await purgeCache();
      console.log("Durable Cache purged successfully.");
    } catch (error) {
      console.error("Failed to purge cache:", error);
      // Don't fail the deploy if purge fails
    }
  },
};
