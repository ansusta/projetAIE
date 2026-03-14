const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

const getGridFSBucket = () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready yet. Cannot create GridFSBucket.");
  }

  return new GridFSBucket(db, {
    bucketName: "documents"
  });
};

module.exports = getGridFSBucket;