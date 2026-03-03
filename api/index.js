/**
 * api/index.js — Vercel serverless entry point
 * Wraps the Express app for Vercel's Node.js runtime.
 */
const app = require("../server");
module.exports = app;
