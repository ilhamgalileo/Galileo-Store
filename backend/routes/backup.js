import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import moment from "moment";

const router = express.Router();

router.post("/", (req, res) => {
  const dbName = "galileo_store";
  const collections = ["orders", "cashorders", "orderstores"];

  const dateFolder = moment().format("DD-MM-YYYY");
  const backupPath = path.join("D:/dump", dateFolder);

  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  let commands = collections.map(
    (collection) =>
      `mongoexport --db ${dbName} --collection ${collection} --out="${backupPath}/${collection}.json" --jsonArray`
  );

  exec(commands.join(" && "), (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup error: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Backup failed",
        error: stderr,
      });
    }
    res.status(200).json({
      success: true,
      message: `Backup completed successfully in folder: ${backupPath}`,
    });
  });
});

export default router;