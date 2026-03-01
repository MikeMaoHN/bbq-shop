<template>
  <div class="order-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单详情</span>
          <el-button @click="$router.back()">返回列表</el-button>
        </div>
      </template>

      <el-descriptions title="订单信息" :column="3" border>
        <el-descriptions-item label="订单号">{{ order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="statusType(order.status)">{{ statusText(order.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ order.created_at }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ order.receiver_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ order.receiver_phone }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ order.paid_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发货时间">{{ order.shipped_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ order.completed_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户备注" :span="3">{{ order.remark || '无' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-descriptions title="收货地址" :column="2" border>
        <el-descriptions-item label="地址" :span="2">
          {{ order.receiver_address }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-descriptions title="物流信息" :column="2" border v-if="order.status >= 2">
        <el-descriptions-item label="物流公司">{{ order.logistics_company || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流单号">{{ order.logistics_no || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <h3>商品清单</h3>
      <el-table :data="order.items" style="width: 100%">
        <el-table-column type="index" width="50" />
        <el-table-column prop="product_name" label="商品名称" />
        <el-table-column prop="price" label="单价" width="100" align="right">
          <template #default="{ row }">¥{{ row.price / 100 }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column label="小计" width="100" align="right">
          <template #default="{ row }">¥{{ (row.price * row.quantity) / 100 }}</template>
        </el-table-column>
      </el-table>

      <el-divider />

      <div class="amount-summary">
        <div class="amount-row">
          <span>订单总额：</span>
          <span>¥{{ order.total_amount / 100 }}</span>
        </div>
        <div class="amount-row">
          <span>运费：</span>
          <span>¥{{ order.freight_amount / 100 }}</span>
        </div>
        <div class="amount-row total">
          <span>实付金额：</span>
          <span>¥{{ order.pay_amount / 100 }}</span>
        </div>
      </div>

      <div class="action-bar" v-if="order.status === 1">
        <el-button type="success" @click="showShipDialog">发货</el-button>
      </div>
    </el-card>

    <!-- 发货对话框 -->
    <el-dialog v-model="shipDialogVisible" title="发货" width="500px">
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="物流公司">
          <el-input v-model="shipForm.logisticsCompany" placeholder="请输入物流公司名称" />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="shipForm.logisticsNo" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const route = useRoute()
const order = ref({ items: [] })
const shipDialogVisible = ref(false)

const shipForm = reactive({
  logisticsCompany: '',
  logisticsNo: ''
})

const statusMap = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  3: '已完成',
  4: '已取消'
}

const statusTypeMap = {
  0: 'warning',
  1: 'primary',
  2: 'success',
  3: 'success',
  4: 'info'
}

const statusText = (status) => statusMap[status] || '未知'
const statusType = (status) => statusTypeMap[status] || 'info'

onMounted(() => {
  loadOrderDetail()
})

const loadOrderDetail = async () => {
  try {
    order.value = await api.getOrder(route.params.id)
  } catch (error) {
    console.error('加载订单详情失败:', error)
  }
}

const showShipDialog = () => {
  shipForm.logisticsCompany = ''
  shipForm.logisticsNo = ''
  shipDialogVisible.value = true
}

const handleShip = async () => {
  if (!shipForm.logisticsCompany || !shipForm.logisticsNo) {
    ElMessage.warning('请填写完整的物流信息')
    return
  }

  try {
    await api.shipOrder(order.value.id, shipForm)
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    loadOrderDetail()
  } catch (error) {
    console.error('发货失败:', error)
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h3 {
  margin: 20px 0 15px;
  font-size: 16px;
}

.amount-summary {
  margin-top: 20px;
  text-align: right;
}

.amount-row {
  margin: 10px 0;
  font-size: 14px;
}

.amount-row.total {
  font-size: 18px;
  font-weight: bold;
  color: #e74c3c;
}

.action-bar {
  margin-top: 30px;
  text-align: center;
}
</style>
