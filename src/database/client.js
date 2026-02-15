import { MongoClient } from "mongodb";
import { constants } from "../shared/constant.js"

export default class Database {
  databaseName = constants.MONGODB_NAME_DATABASE;
  static client = new MongoClient(constants.MONGODB_URI);

  async close() {
    await Database.client.close();
  }

  async connect() {
    await Database.client.connect();
    await Database.client.db("admin").command({ ping: 1 });
  }

  async find(collection, query) {
    return await Database.client.db(this.databaseName).collection(collection).find(query).toArray();
  }

  async findOne(collection, query) {
    return await Database.client.db(this.databaseName).collection(collection).findOne(query);
  }

  async insert(collection, params) {
    await Database.client.db(this.databaseName).collection(collection).insertOne(params);
  }

  async update(collection, query, params) {
    await Database.client.db(this.databaseName).collection(collection).updateOne(query, { $set: params });
  }
}