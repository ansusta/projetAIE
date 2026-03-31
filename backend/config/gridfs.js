const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

const getGridFSBucket = () => {
  // Check if mongoose is connected (readyState 1 means connected)
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection is not ready yet. Current state: " + mongoose.connection.readyState);
  }

  const db = mongoose.connection.db;
  return new GridFSBucket(db, {
    bucketName: "documents"
  });
};

module.exports = getGridFSBucket;