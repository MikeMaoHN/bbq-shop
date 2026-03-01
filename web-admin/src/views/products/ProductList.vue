<template>
  <div class="product-list">
    <el-card>
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索商品名称"
            style="width: 200px; margin-right: 10px;"
            clearable
            @clear="loadProducts"
          />
          <el-select v-model="searchForm.categoryId" placeholder="选择分类" clearable style="width: 150px; margin-right: 10px;">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <el-select v-model="searchForm.status" placeholder="商品状态" clearable style="width: 120px; margin-right: 10px;">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
          <el-button type="primary" @click="loadProducts">搜索</el-button>
        </div>
        <div class="toolbar-right">
          <el-tag type="success" style="margin-right: 10px;">
            商品总数：{{ pagination.total }}
          </el-tag>
          <el-tag type="warning" style="margin-right: 10px;">
            有库存：{{ stockCount }}
          </el-tag>
          <el-button type="primary" @click="goToStock">
            <el-icon><Box /></el-icon>
            查看库存
          </el-button>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增商品
          </el-button>
        </div>
      </div>

      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image
              :src="getImage(row.images)"
              style="width: 60px; height: 60px;"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="180" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="price" label="价格" width="100" align="right">
          <template #default="{ row }">
            <span style="color: #e74c3c; font-weight: bold;">¥{{ (row.price / 100).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" align="right">
          <template #default="{ row }">
            <el-tag :type="row.stock > 0 ? 'success' : 'danger'" size="small">
              {{ row.stock }}件
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="80" align="right" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '可售' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button
              :type="row.status === 1 ? 'warning' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteProduct(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadProducts"
          @current-change="loadProducts"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingProduct ? '编辑商品' : '新增商品'"
      width="600px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%;">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
        </el-form-item>
        <el-form-item label="商品图片" prop="images">
          <el-upload
            action="/admin/api/upload/image"
            :headers="{ Authorization: `Bearer ${token}` }"
            :on-success="handleImageSuccess"
            :file-list="imageList"
            :limit="4"
            list-type="picture-card"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="销售价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="0.1" /> 元
        </el-form-item>
        <el-form-item label="原价" prop="originalPrice">
          <el-input-number v-model="form.originalPrice" :min="0" :precision="2" :step="0.1" /> 元
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" /> 件
        </el-form-item>
        <el-form-item label="是否热销">
          <el-switch v-model="form.isHot" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'
import { createLogger } from '@/utils/logger'

const log = createLogger('ProductList')
const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const categories = ref([])
const dialogVisible = ref(false)
const editingProduct = ref(null)
const formRef = ref(null)
const token = ref(localStorage.getItem('token') || '')

const searchForm = reactive({
  keyword: '',
  categoryId: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 50,
  total: 0
})

const form = reactive({
  categoryId: '',
  name: '',
  description: '',
  images: [],
  price: 0,
  originalPrice: null,
  stock: 0,
  isHot: false,
  status: 1
})

const rules = {
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入销售价格', trigger: 'blur' }]
}

const imageList = computed(() => {
  return form.images.map((url, index) => ({
    url: url.startsWith('/') ? '/admin/api' + url : url,
    name: `image${index}`
  }))
})

const stockCount = computed(() => {
  return tableData.value.filter(item => item.stock > 0).length
})

const loadProducts = async () => {
  log.info('=== 开始加载商品 ===')
  loading.value = true
  
  try {
    // 过滤空值参数
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    
    // 只添加有值的筛选条件
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.categoryId) params.categoryId = searchForm.categoryId
    if (searchForm.status !== '' && searchForm.status !== null) params.status = searchForm.status
    
    log.info('请求参数:', params)
    log.info('调用 API: getProducts')
    
    const result = await api.getProducts(params)
    
    log.info(`API 返回：${result.total} 个商品`)
    log.info('商品列表:', result.list.map(p => ({ name: p.name, stock: p.stock, price: p.price/100 })))
    
    tableData.value = result.list
    pagination.total = result.total
    
    log.info('页面渲染完成，商品数:', tableData.value.length)
    
  } catch (error) {
    log.error('加载商品失败:', error)
    ElMessage.error('加载商品失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  log.group('加载分类数据')
  log.debug('开始加载分类列表')
  
  try {
    const result = await api.getCategories()
    log.debug('分类 API 返回:', result)
    
    categories.value = Array.isArray(result) ? result : (result.list || [])
    log.info(`获取到 ${categories.value.length} 个分类`)
    log.debug('分类列表:', categories.value)
    
  } catch (error) {
    log.error('加载分类失败:', error)
    ElMessage.error('加载分类失败')
  } finally {
    log.groupEnd()
  }
}

onMounted(() => {
  log.info('=== 商品管理页面已挂载 ===')
  log.debug('开始初始化页面')
  loadCategories()
  loadProducts()
})

const getImage = (images) => {
  if (!images) return '/images/default.png'
  const imgArray = typeof images === 'string' ? JSON.parse(images) : images
  const imgUrl = imgArray[0] || '/images/default.png'
  return imgUrl.startsWith('/') ? '/admin/api' + imgUrl : imgUrl
}

const goToStock = () => {
  router.push('/stock')
}

const showAddDialog = () => {
  editingProduct.value = null
  Object.assign(form, {
    categoryId: '',
    name: '',
    description: '',
    images: [],
    price: 0,
    originalPrice: null,
    stock: 0,
    isHot: false,
    status: 1
  })
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  editingProduct.value = row
  Object.assign(form, {
    categoryId: row.category_id,
    name: row.name,
    description: row.description || '',
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [],
    price: row.price / 100,
    originalPrice: row.original_price ? row.original_price / 100 : null,
    stock: row.stock,
    isHot: !!row.is_hot,
    status: row.status
  })
  dialogVisible.value = true
}

const handleImageSuccess = (response) => {
  if (!form.images.includes(response.url)) {
    form.images.push(response.url)
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  
  try {
    const data = { ...form }
    
    if (editingProduct.value) {
      await api.updateProduct(editingProduct.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await api.createProduct(data)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadProducts()
  } catch (error) {
    console.error('保存商品失败:', error)
    ElMessage.error(error.message || '保存失败')
  }
}

const toggleStatus = async (row) => {
  try {
    await api.updateProduct(row.id, { status: row.status === 1 ? 0 : 1 })
    ElMessage.success('操作成功')
    loadProducts()
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

const deleteProduct = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', { type: 'warning' })
    await api.deleteProduct(id)
    ElMessage.success('删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除商品失败:', error)
    }
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
