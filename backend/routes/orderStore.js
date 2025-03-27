import express from 'express'
const router = express.Router()
import { authenticate, authorizeAdmin, superAdminAuth } from '../middlewares/middleware.js'
import * as orderStore from '../controllers/orderStore.js'

router.get('/all', authenticate,authorizeAdmin, orderStore.getAllStoreOrder)
router.post('/', authenticate, orderStore.createInStoreOrder)
router.put('/:id/pay', authenticate, orderStore.markOrderIsPay)
router.get('/:phone/membership', authenticate, orderStore.getUserMembership)
router.get('/total-income-store', authenticate, orderStore.calcTotalIncomeStore)
router.get('/total-income-store-by-date', authenticate, orderStore.calcTotalProfitByDateStore)
router.get('/total-income-store-by-week', authenticate, orderStore.calcTotalProfitByWeekStore)
router.get('/total-income-store-by-month', authenticate, orderStore.calcTotalProfitByMonthStore)
router.get('/total-income-store-by-year', authenticate, orderStore.calcTotalProfitByYearStore)
router.get('/:id', authenticate,authorizeAdmin, orderStore.findOrderById)
router.put('/:id/return', authenticate, superAdminAuth, orderStore.markOrderAsReturned)

export default router