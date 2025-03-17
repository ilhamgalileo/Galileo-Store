import express from "express";
const router = express.Router();
import {
  authenticate,
  authorizeAdmin,
  superAdminAuth,
} from "../middlewares/middleware.js";
import * as order from "../controllers/order.js";

router.post("/checkout", authenticate, order.createOrder);
router.get("/", authenticate, authorizeAdmin, order.getAllOrder);
router.get("/mine", authenticate, order.getMyOrder);
router.get("/total-income", authenticate, order.calcTotalIncome);
router.get("/total-orders", authenticate, order.countTotalOrders);
router.get("/total-sales", authenticate, order.calcTotalSales);
router.get("/total-sales-by-date", authenticate, order.calcTotalSalesByDate);
router.get("/total-sales-by-month", authenticate, order.calcTotalSalesByMonth);
router.get("/total-sales-by-year", authenticate, order.calcTotalSalesByYear);
router.get("/total-sales-by-week", authenticate, order.calcTotalSalesByWeek);
router.get(
  "/all-orders",
  authenticate,
  authorizeAdmin,
  order.getAllCombinedOrders
);
router.get("/:id", authenticate, order.findOrderById);
router.put("/:id/pay", authenticate, order.markOrderIsPay);
router.put(
  "/:id/return",
  authenticate,
  superAdminAuth,
  order.markOrderAsReturned
);
router.put(
  "/:id/deliver",
  authenticate,
  authorizeAdmin,
  order.markOrderIsDeliver
);

export default router;
