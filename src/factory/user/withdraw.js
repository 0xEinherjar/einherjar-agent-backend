import Database from "../../database/client.js";
import Repository from "../../database/user-repository.js";
import Service from "../../service/user/withdraw.js";

export const WithdrawFactory = () => {
  const database = new Database();
  const repository = new Repository(database);
  const service = new Service({ repository });
  return service;
};