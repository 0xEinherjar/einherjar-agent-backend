import { MongoClient } from "mongodb";
import { constants } from "../shared/constant.js";

export class MongoDatabase {
  databaseName = constants.MONGODB_NAME_DATABASE;
  static client = new MongoClient(constants.MONGODB_URI);

  async close() {
    await MongoDatabase.client.close();
  }

  async connect() {
    await MongoDatabase.client.connect();
    await MongoDatabase.client.db("admin").command({ ping: 1 });
  }

  async find(collection, query) {
    return await MongoDatabase.client
      .db(this.databaseName)
      .collection(collection)
      .find(query)
      .toArray();
  }

  async findOne(collection, query) {
    return await MongoDatabase.client
      .db(this.databaseName)
      .collection(collection)
      .findOne(query);
  }

  async insert(collection, params) {
    await MongoDatabase.client
      .db(this.databaseName)
      .collection(collection)
      .insertOne(params);
  }

  async update(collection, query, params) {
    await MongoDatabase.client
      .db(this.databaseName)
      .collection(collection)
      .updateOne(query, { $set: params });
  }

  async deleteOne(collection, query) {
    await MongoDatabase.client
      .db(this.databaseName)
      .collection(collection)
      .deleteOne(query);
  }

  async count(collection, query) {
    return await MongoDatabase.client
      .db(this.databaseName)
      .collection(collection)
      .countDocuments(query);
  }

  async aggregate(collection, pipeline) {
    return await MongoDatabase.client
      .db(this.databaseName)
      .collection(collection)
      .aggregate(pipeline)
      .toArray();
  }
}
